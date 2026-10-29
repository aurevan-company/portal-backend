import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { OrganizationEntity } from '../organizations/organization.entity.js';
import { EmployeeEntity } from './employee.entity.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeEntity, OrganizationEntity])],
  controllers: [EmployeesController],
  providers: [EmployeesService, JwtAuthGuard, PermissionsGuard],
  exports: [EmployeesService],
})
export class EmployeesModule {}
