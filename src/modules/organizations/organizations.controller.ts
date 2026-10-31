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
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { OrganizationQueryDto } from './dto/organization-query.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationsService } from './organizations.service.js';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  @RequirePermissions('organizations.create')
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizations.create(dto, user.id);
  }

  @Get()
  @RequirePermissions('organizations.read')
  findAll(@Query() query: OrganizationQueryDto) {
    return this.organizations.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('organizations.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizations.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('organizations.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizations.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('organizations.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizations.remove(id, user.id);
  }
}
