import type { RefreshTokenDocument } from "./refresh-token.model.ts";
import type { RefreshTokenRecord } from "./refresh-token.types.ts";

export function mapRefreshTokenDocument(
  document: RefreshTokenDocument,
): RefreshTokenRecord {
  return {
    id: document._id.toString(),
    userId: document.userId.toString(),
    tokenHash: document.tokenHash,
    jti: document.jti,
    expiresAt: document.expiresAt,
    revokedAt: document.revokedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
