# MongoDB, Mongoose, And Backend Architecture Resources

## Knowledge

- [MongoDB Manual: Documents](https://www.mongodb.com/docs/manual/core/document/)
  Use for: how MongoDB stores BSON documents, `_id`, embedded documents, arrays, dot notation, and document size limits.
- [MongoDB Manual: Databases and Collections](https://www.mongodb.com/docs/manual/core/databases-and-collections/)
  Use for: how databases contain collections, how collections contain documents, automatic collection creation, and MongoDB's flexible schema behavior.
- [MongoDB Manual: Data Modeling](https://www.mongodb.com/docs/manual/data-modeling/)
  Use for: deciding whether data should be embedded or referenced based on ecommerce access patterns.
- [MongoDB Manual: Schema Validation](https://www.mongodb.com/docs/manual/core/schema-validation/)
  Use for: understanding optional database-level validation and when to enforce rules in MongoDB itself.
- [Mongoose Docs: Schemas](https://mongoosejs.com/docs/guide.html)
  Use for: how Mongoose schemas map to collections, define document shape, apply strict mode, timestamps, indexes, and options.
- [Mongoose Docs: Models](https://mongoosejs.com/docs/models.html)
  Use for: how models are compiled from schemas and used to create, read, update, and delete documents.
- [Mongoose Docs: Connections](https://mongoosejs.com/docs/connections.html)
  Use for: connection lifecycle, connection pools, `serverSelectionTimeoutMS`, multiple connections, and future multi-tenant concerns.
- [Mongoose Docs: Validation](https://mongoosejs.com/docs/validation.html)
  Use for: document validation, update validation caveats, and the important fact that `unique` is an index helper, not a validator.
- [Mongoose Docs: TypeScript](https://mongoosejs.com/docs/typescript.html)
  Use for: how document interfaces, schemas, models, `Types.ObjectId`, and hydrated documents relate in TypeScript.
- [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
  Use for: dependency direction and why infrastructure should depend inward on application/domain code.
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
  Use for: ports and adapters, especially how a database becomes a replaceable driven adapter.
- [Microsoft: Designing a DDD-oriented Microservice](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice)
  Use for: pragmatic backend layering and repository boundaries in long-lived services.

## Wisdom (Communities)

- [MongoDB Community Forums](https://www.mongodb.com/community/forums/)
  Use for: real MongoDB modeling questions, schema design tradeoffs, and operational gotchas.
- [Mongoose GitHub Discussions and Issues](https://github.com/Automattic/mongoose)
  Use for: version-specific Mongoose behavior and TypeScript edge cases.
- [r/node](https://www.reddit.com/r/node/)
  Use for: broader Node.js backend patterns and pragmatic production advice.

## Gaps

- We still need one high-quality resource for Express plus TypeScript project structure after the persistence boundary is clearer.
- We still need one practical resource on Bruno API documentation workflows for this project.
