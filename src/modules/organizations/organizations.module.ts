import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { UserEntity } from '../users/user.entity.js';
import { OrganizationEntity } from './organization.entity.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity, UserEntity])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, JwtAuthGuard, PermissionsGuard],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
