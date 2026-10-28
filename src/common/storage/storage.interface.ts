export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

export interface StoredObject {
  storageKey: string;
  size: number;
  mimeType: string;
}

export interface FileStorage {
  save(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<StoredObject>;

  read(storageKey: string): Promise<Buffer>;

  delete(storageKey: string): Promise<void>;
}
