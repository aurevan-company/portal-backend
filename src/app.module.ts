import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { validateEnvironment } from './platform/config/env.validation.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ResponseEnvelopeInterceptor } from './shared/api/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './shared/api/filters/http-exception.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', validate: validateEnvironment }),
    DatabaseModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
