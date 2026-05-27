import type { PublicUser, UserRecord } from "./user.types.ts";
import type { UserDocument } from "./user.model.ts";

export function mapUserDocument(document: UserDocument): UserRecord {
  return {
    id: document._id.toString(),
    name: document.name,
    email: document.email,
    passwordHash: document.passwordHash,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
