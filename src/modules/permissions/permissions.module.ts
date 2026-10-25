import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionOrmEntity } from './infrastructure/permission.orm-entity.js';
import { PermissionsService } from './application/permissions.service.js';
import { PermissionsController } from './presentation/permissions.controller.js';
import { JwtAuthGuard } from '../../shared/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../shared/auth/guards/permissions.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionOrmEntity])],
  controllers: [PermissionsController],
  providers: [PermissionsService, JwtAuthGuard, PermissionsGuard],
  exports: [PermissionsService, TypeOrmModule],
})
export class PermissionsModule {}
