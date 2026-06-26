import { fileTypeFromBuffer } from "file-type";

import type { ObjectStorageService } from "../../infrastructure/storage/object-storage.service.ts";
import { BadRequestError, ConflictError, NotFoundError, UnprocessableEntityError } from "../../shared/errors/app-error.ts";
import type { UserRepository, PublicUser, UpdateUserInput } from "./user.repository.ts";
import { toPublicUser } from "./user.repository.ts";

const allowedImageTypes = new Map([
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);

export type UploadedImageInput = {
  buffer: Buffer;
};

export type StoredUserImage = {
  body: Uint8Array;
  contentType: string;
};

export class UsersService {
  private readonly users: UserRepository;
  private readonly objectStorage: ObjectStorageService;

  constructor(users: UserRepository, objectStorage: ObjectStorageService) {
    this.users = users;
    this.objectStorage = objectStorage;
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

  async uploadMyImage(
    userId: string,
    input: UploadedImageInput | null,
  ): Promise<PublicUser> {
    if (!input) {
      throw new BadRequestError("Image file is required", "IMAGE_FILE_REQUIRED");
    }

    const imageType = await this.detectAllowedImageType(input.buffer);
    const key = this.getUserImageKey(userId, imageType.ext);

    await this.objectStorage.putObject({
      key,
      body: input.buffer,
      contentType: imageType.mime,
    });

    const user = await this.users.setImageExt(userId, imageType.ext);

    if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    return toPublicUser(user);
  }

  async getMyImage(userId: string): Promise<StoredUserImage> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    if (!user.imageExt) {
      throw new NotFoundError("User image not found", "USER_IMAGE_NOT_FOUND");
    }

    const object = await this.objectStorage.getObject(
      this.getUserImageKey(userId, user.imageExt),
    );

    if (!object) {
      throw new NotFoundError("User image not found", "USER_IMAGE_NOT_FOUND");
    }

    return {
      body: object.body,
      contentType: object.contentType ?? this.getImageContentType(user.imageExt),
    };
  }

  async deleteMyImage(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    if (user.imageExt) {
      await this.objectStorage.deleteObject(this.getUserImageKey(userId, user.imageExt));
    }

    const updatedUser = await this.users.setImageExt(userId, null);

    if (!updatedUser) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    return toPublicUser(updatedUser);
  }

  private async detectAllowedImageType(buffer: Buffer): Promise<{
    ext: string;
    mime: string;
  }> {
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType || !allowedImageTypes.has(detectedType.ext)) {
      throw new BadRequestError("Invalid image file", "INVALID_IMAGE_FILE");
    }

    return {
      ext: detectedType.ext,
      mime: allowedImageTypes.get(detectedType.ext) ?? detectedType.mime,
    };
  }

  private getUserImageKey(userId: string, imageExt: string): string {
    return `users/${userId}/profile.${imageExt}`;
  }

  private getImageContentType(imageExt: string): string {
    return allowedImageTypes.get(imageExt) ?? "application/octet-stream";
  }
}
