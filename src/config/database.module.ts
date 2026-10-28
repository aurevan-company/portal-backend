import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // useFactory: (config: ConfigService) => ({
      //   type: 'postgres' as const,
      //   host: config.getOrThrow<string>('DB_HOST'),
      //   port: config.getOrThrow<number>('DB_PORT'),
      //   username: config.getOrThrow<string>('DB_USERNAME'),
      //   password: config.getOrThrow<string>('DB_PASSWORD'),
      //   database: config.getOrThrow<string>('DB_DATABASE'),
      //   autoLoadEntities: true,
      //   synchronize: false,
      // }),
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: { rejectUnauthorized: false },
      }),
    }),
  ],
})
export class DatabaseModule {}
