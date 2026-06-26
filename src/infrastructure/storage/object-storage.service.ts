export type StoredObject = {
  body: Uint8Array;
  contentType: string | null;
};

export type PutObjectInput = {
  key: string;
  body: Uint8Array;
  contentType: string;
};

export interface ObjectStorageService {
  putObject(input: PutObjectInput): Promise<void>;
  getObject(key: string): Promise<StoredObject | null>;
  deleteObject(key: string): Promise<void>;
}
