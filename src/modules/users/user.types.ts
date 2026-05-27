export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export type CreateUserRecord = {
  name: string;
  email: string;
  passwordHash: string;
};

export interface UserRepository {
  create(input: CreateUserRecord): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByEmailWithPasswordHash(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
}
