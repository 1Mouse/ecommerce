export type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  jti: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateRefreshTokenRecord = {
  userId: string;
  tokenHash: string;
  jti: string;
  expiresAt: Date;
};

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenRecord): Promise<RefreshTokenRecord>;
  findActiveByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeById(id: string): Promise<void>;
}
