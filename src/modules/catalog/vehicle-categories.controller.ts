import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentOrganizationId } from '../../common/decorators/current-organization-id.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OrganizationAccessGuard } from '../../common/guards/organization-access.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { CreateVehicleCategoryDto } from './dto/create-vehicle-category.dto.js';
import { UpdateVehicleCategoryDto } from './dto/update-vehicle-category.dto.js';
import { VehicleCategoriesService } from './vehicle-categories.service.js';

@Controller('vehicle-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard, OrganizationAccessGuard)
export class VehicleCategoriesController {
  constructor(private readonly categories: VehicleCategoriesService) {}

  @Get()
  @RequirePermissions('vehicle_categories.read')
  findAll(@CurrentOrganizationId() organization_id: number) {
    return this.categories.findAll(organization_id);
  }

  @Post()
  @RequirePermissions('vehicle_categories.create')
  create(
    @CurrentOrganizationId() organization_id: number,
    @Body() dto: CreateVehicleCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categories.create(organization_id, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('vehicle_categories.update')
  update(
    @CurrentOrganizationId() organization_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categories.update(organization_id, id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('vehicle_categories.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentOrganizationId() organization_id: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categories.remove(organization_id, id, user.id);
  }
}
