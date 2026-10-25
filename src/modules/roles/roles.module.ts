import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleOrmEntity } from './infrastructure/role.orm-entity.js';
import { PermissionOrmEntity } from '../permissions/infrastructure/permission.orm-entity.js';
import { RolesService } from './application/services/roles.service.js';
import { RolesController } from './presentation/roles.controller.js';
import { JwtAuthGuard } from '../../shared/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../shared/auth/guards/permissions.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([RoleOrmEntity, PermissionOrmEntity])],
  controllers: [RolesController],
  providers: [RolesService, JwtAuthGuard, PermissionsGuard],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
