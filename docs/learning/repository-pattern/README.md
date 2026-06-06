# Repository Pattern

## Generic Theory

A repository is a persistence boundary.

It hides database details from the rest of the app.

Instead of services doing this:

```ts
await UserModel.findOne({ email, deletedAt: null }).exec();
```

They do this:

```ts
await users.findByEmail(email);
```

So the service thinks in app/business language:

```txt
find user by email
mark email verified
revoke refresh token
find address owned by user
```

Not database language:

```txt
Mongoose model
ObjectId
findOneAndUpdate
.exec()
```

A repository usually does these jobs:

- Query the database.
- Convert database records into app objects.
- Hide ORM/Mongoose details.
- Centralize common DB behavior.
- Keep services focused on workflow/business rules.
- Prevent controllers/services from depending directly on Mongoose models.

A repository should not usually contain business workflow rules.

Good repository logic:

```txt
findByEmail
findById
create
updateById
softDeleteById
findOwnedById
revokeByTokenHash
```

Bad repository logic:

```txt
signup user and send email
login user
place order and charge payment
decide whether user can checkout
```

Those belong in services/use cases.

## Abstract Class

This:

```ts
export abstract class MongoBaseCrudRepository<TDocument, TEntity>
```

means:

```txt
This class is incomplete by itself.
You cannot directly create it.
Other repositories must extend it.
```

You cannot do:

```ts
new MongoBaseCrudRepository(...);
```

Because it does not know how to convert a Mongoose document into your app object.

That missing part is here:

```ts
protected abstract toEntity(document: HydratedDocument<TDocument>): TEntity;
```

The base class says:

```txt
Every child repository must tell me how to convert DB documents into app entities.
```

Then each child does that:

```ts
protected toEntity(document: HydratedDocument<UserDocument>): User {
  return {
    id: document._id.toString(),
    email: document.email,
    username: document.username,
    // ...
  };
}
```

So the base class can implement generic DB operations:

```ts
create();
findById();
findMany();
updateById();
softDeleteById();
exists();
```

But the child controls the mapping.

## `protected`

`protected` means:

```txt
This is accessible inside the class and inside child classes, but not from outside.
```

Example:

```ts
protected readonly model: Model<TDocument>;
```

This means:

- `MongoBaseCrudRepository` can use `this.model`.
- `UserRepository` can use `this.model`.
- `AuthService` cannot use `userRepository.model`.

This is allowed inside a subclass:

```ts
class UserRepository extends MongoBaseCrudRepository<UserDocument, User> {
  async customQuery() {
    return this.model.findOne(...);
  }
}
```

This is not allowed outside:

```ts
userRepository.model.findOne(...); // blocked
```

That is good because services should not reach into database internals.

Same for:

```ts
protected toObjectId(...);
protected withNotDeleted(...);
protected abstract toEntity(...);
```

They are internal repository tools, not public API.

## Are We Implementing It Right?

Yes, mostly.

The current implementation is good for this project’s current stage.

Good things we are doing:

- Controllers do not call repositories directly.
- Services call repositories.
- Repositories hide Mongoose queries.
- Repositories return plain app objects, not Mongoose documents.
- `_id` is converted to `id`.
- `ObjectId` fields are converted to strings.
- Soft-delete filtering is centralized in `withNotDeleted`.
- Common CRUD behavior is reused through `MongoBaseCrudRepository`.
- Feature-specific repositories stay inside their modules.

Example of good mapping:

```ts
return {
  id: document._id.toString(),
  userId: document.userId.toString(),
  tokenHash: document.tokenHash,
  expiresAt: document.expiresAt,
  // ...
};
```

That means the rest of the app does not need to know about Mongoose document shape.

## What Is Slightly Imperfect?

The main imperfection is that services depend on concrete repository classes:

```ts
constructor(users: UserRepository) {}
```

In stricter Clean Architecture, services would depend on an interface/port:

```ts
type UsersPort = {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
};
```

Then `UserRepository` would implement that port.

But for the current modular-monolith learning project, concrete repository injection is acceptable. We are not overcomplicating it too early.

Another small issue: the base repository exposes generic methods like:

```ts
create(input: Partial<TDocument>);
updateById(id, input: Partial<TDocument>);
```

That means services can sometimes pass persistence-shaped objects instead of app-specific input types.

Example from `AuthService`:

```ts
await this.users.create({
  email,
  username,
  passwordHash,
  emailVerifiedAt: null,
  imageExt: null,
  phone: null,
  dob: null,
  deletedAt: null,
});
```

This works, but later we may prefer:

```ts
await this.users.createUser({
  email,
  username,
  passwordHash,
});
```

That keeps the service away from persistence details like `deletedAt`.

## Verdict

The repository pattern is implemented correctly enough for now.

```txt
Current project stage: good
Enterprise strictness: decent, but not fully port/interface-based
Learning value: very good
```

Keep this structure for products/orders too.

For the next modules, follow this style:

```txt
products/
  product.model.ts
  product.repository.ts
  products.service.ts
  products.controller.ts
  products.routes.ts
  products.schema.ts
  products.manifest.ts
```

And make sure:

```txt
controller -> service -> repository -> model
```

Never:

```txt
controller -> repository
service -> mongoose model
controller -> mongoose model
```
