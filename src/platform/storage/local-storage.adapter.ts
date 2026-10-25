import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { FileStorage, StoredObject } from './storage.interface.js';

@Injectable()
export class LocalStorageAdapter implements FileStorage {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = path.resolve(
      config.get<string>('FILE_STORAGE_ROOT', './private-uploads'),
    );
  }

  async save(
    buffer: Buffer,
    _originalName: string,
    mimeType: string,
  ): Promise<StoredObject> {
    await mkdir(this.root, { recursive: true });

    const storageKey = randomUUID();
    const destination = this.resolveKey(storageKey);

    await writeFile(destination, buffer, { flag: 'wx' });

    return {
      storageKey,
      size: buffer.length,
      mimeType,
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    try {
      return await readFile(this.resolveKey(storageKey));
    } catch {
      throw new NotFoundException('Stored file not found');
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await rm(this.resolveKey(storageKey));
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }

      throw error;
    }
  }

  private resolveKey(storageKey: string): string {
    if (!/^[0-9a-f-]{36}$/i.test(storageKey)) {
      throw new NotFoundException('Stored file not found');
    }

    return path.join(this.root, storageKey);
  }
}
