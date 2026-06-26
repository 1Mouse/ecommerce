import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "../../config/env.ts";
import type {
  ObjectStorageService,
  PutObjectInput,
  StoredObject,
} from "./object-storage.service.ts";

export class S3ObjectStorageService implements ObjectStorageService {
  private readonly client: S3Client;
  private readonly bucketName = env.s3Bucket;
  private ensureBucketPromise: Promise<void> | null = null;

  constructor() {
    this.client = new S3Client({
      endpoint: env.s3Endpoint,
      region: env.s3Region,
      forcePathStyle: env.s3ForcePathStyle,
      credentials: {
        accessKeyId: env.s3AccessKeyId,
        secretAccessKey: env.s3SecretAccessKey,
      },
    });
  }

  async putObject(input: PutObjectInput): Promise<void> {
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async getObject(key: string): Promise<StoredObject | null> {
    await this.ensureBucket();

    try {
      const object = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (!object.Body) {
        return null;
      }

      return {
        body: await object.Body.transformToByteArray(),
        contentType: object.ContentType ?? null,
      };
    } catch (error) {
      if (error instanceof NoSuchKey || error instanceof NotFound) {
        return null;
      }

      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.ensureBucket();
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  private async ensureBucket(): Promise<void> {
    this.ensureBucketPromise ??= this.createBucketIfMissing();
    await this.ensureBucketPromise;
  }

  private async createBucketIfMissing(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      return;
    } catch (error) {
      if (!(error instanceof NotFound)) {
        throw error;
      }
    }

    await this.client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
  }
}
