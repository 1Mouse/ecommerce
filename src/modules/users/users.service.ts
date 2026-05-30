import { ConflictError, NotFoundError, UnprocessableEntityError } from "../../shared/errors/app-error.ts";
import type { UserRepository, PublicUser, UpdateUserInput } from "./user.repository.ts";
import { toPublicUser } from "./user.repository.ts";

export class UsersService {
  private readonly users: UserRepository;

  constructor(users: UserRepository) {
    this.users = users;
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    return toPublicUser(user);
  }

  async updateMe(userId: string, input: UpdateUserInput): Promise<PublicUser> {
    if (input.username !== undefined) {
      const existingUser = await this.users.findByUsername(input.username, {
        includeDeleted: true,
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError(
          "Username already exists",
          "USERNAME_ALREADY_EXISTS",
        );
      }
    }

    if (input.dob && input.dob.getTime() >= Date.now()) {
      throw new UnprocessableEntityError("Invalid date of birth", "INVALID_DOB");
    }

    const user = await this.users.updateById(userId, input);

    if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    return toPublicUser(user);
  }

  async deleteMe(userId: string): Promise<Pick<PublicUser, "id"> & { deletedAt: Date | null }> {
    const user = await this.users.softDeleteById(userId);

    if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    return {
      id: user.id,
      deletedAt: user.deletedAt,
    };
  }
}
