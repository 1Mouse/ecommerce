import mongoose from "mongoose";
import type { HydratedDocument, Model, UpdateQuery } from "mongoose";

import type { PaginationMeta } from "../../../shared/http/api-response.ts";

const { Types } = mongoose;

export type SoftDeletableDocument = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export type PaginationInput = {
  page: number;
  limit: number;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export type RepositoryReadOptions = {
  includeDeleted?: boolean;
};

export type MongoFilter = Record<string, unknown>;

export abstract class MongoBaseCrudRepository<
  TDocument extends SoftDeletableDocument,
  TEntity,
> {
  protected readonly model: Model<TDocument>;

  constructor(model: Model<TDocument>) {
    this.model = model;
  }

  protected abstract toEntity(document: HydratedDocument<TDocument>): TEntity;

  protected toObjectId(id: string): mongoose.Types.ObjectId | null {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return new Types.ObjectId(id);
  }

  protected withNotDeleted(
    filter: MongoFilter,
    options: RepositoryReadOptions = {},
  ): MongoFilter {
    if (options.includeDeleted) {
      return filter;
    }

    return {
      ...filter,
      deletedAt: null,
    };
  }

  async create(input: Partial<TDocument>): Promise<TEntity> {
    const document = await this.model.create(input);
    return this.toEntity(document);
  }

  async findById(
    id: string,
    options: RepositoryReadOptions = {},
  ): Promise<TEntity | null> {
    const objectId = this.toObjectId(id);

    if (!objectId) {
      return null;
    }

    const document = await this.model
      .findOne(
        this.withNotDeleted(
          { _id: objectId },
          options,
        ),
      )
      .exec();

    return document ? this.toEntity(document) : null;
  }

  async findMany(
    filter: MongoFilter,
    pagination: PaginationInput,
    options: RepositoryReadOptions = {},
  ): Promise<PaginatedResult<TEntity>> {
    const query = this.withNotDeleted(filter, options);
    const page = Math.max(1, pagination.page);
    const limit = Math.min(100, Math.max(1, pagination.limit));
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      data: documents.map((document) => this.toEntity(document)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(
    id: string,
    input: Partial<TDocument>,
    options: RepositoryReadOptions = {},
  ): Promise<TEntity | null> {
    const objectId = this.toObjectId(id);

    if (!objectId) {
      return null;
    }

    const update = { $set: input } as UpdateQuery<TDocument>;
    const document = await this.model
      .findOneAndUpdate(
        this.withNotDeleted(
          { _id: objectId },
          options,
        ),
        update,
        { returnDocument: "after", runValidators: true },
      )
      .exec();

    return document ? this.toEntity(document) : null;
  }

  async softDeleteById(id: string): Promise<TEntity | null> {
    const objectId = this.toObjectId(id);

    if (!objectId) {
      return null;
    }

    const document = await this.model
      .findOneAndUpdate(
        this.withNotDeleted({ _id: objectId }),
        { $set: { deletedAt: new Date() } } as UpdateQuery<TDocument>,
        { returnDocument: "after", runValidators: true },
      )
      .exec();

    return document ? this.toEntity(document) : null;
  }

  async exists(filter: MongoFilter): Promise<boolean> {
    const result = await this.model.exists(this.withNotDeleted(filter)).exec();
    return result !== null;
  }
}
