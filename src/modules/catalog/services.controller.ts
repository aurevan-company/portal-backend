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
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { ServicesService } from './services.service.js';

@Controller('services')
@UseGuards(JwtAuthGuard, PermissionsGuard, OrganizationAccessGuard)
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @RequirePermissions('services.read')
  findAll(@CurrentOrganizationId() organization_id: number) {
    return this.services.findAll(organization_id);
  }

  @Post()
  @RequirePermissions('services.create')
  create(
    @CurrentOrganizationId() organization_id: number,
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.services.create(organization_id, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('services.update')
  update(
    @CurrentOrganizationId() organization_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.services.update(organization_id, id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('services.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentOrganizationId() organization_id: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.services.remove(organization_id, id, user.id);
  }
}
