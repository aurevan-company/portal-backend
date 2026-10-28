import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './role.entity.js';
import { PermissionEntity } from '../permissions/permission.entity.js';
import { RolesService } from './roles.service.js';
import { RolesController } from './roles.controller.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, PermissionEntity])],
  controllers: [RolesController],
  providers: [RolesService, JwtAuthGuard, PermissionsGuard],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
