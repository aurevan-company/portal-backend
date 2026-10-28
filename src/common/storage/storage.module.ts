import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { STORAGE_ADAPTER } from './storage.interface.js';
import { LocalStorageAdapter } from './local-storage.adapter.js';

@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageAdapter,
    {
      provide: STORAGE_ADAPTER,
      inject: [ConfigService, LocalStorageAdapter],
      useFactory: (
        config: ConfigService,
        localStorage: LocalStorageAdapter,
      ) => {
        const driver = config.get<string>('FILE_STORAGE_DRIVER', 'local');

        if (driver !== 'local') {
          throw new Error(`Storage driver "${driver}" is not configured yet`);
        }

        return localStorage;
      },
    },
  ],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {}
