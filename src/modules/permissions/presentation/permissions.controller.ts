import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { PermissionsService } from '../application/permissions.service.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../../../shared/auth/decorators/require-permissions.decorator.js';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permissions.read')
  findAll() { return this.permissionsService.findAll(); }

  @Get(':id')
  @RequirePermissions('permissions.read')
  findById(@Param('id', ParseIntPipe) id: number) { return this.permissionsService.findById(id); }

  @Post()
  @RequirePermissions('permissions.create')
  create(@Body() dto: CreatePermissionDto) { return this.permissionsService.create(dto); }

  @Patch(':id')
  @RequirePermissions('permissions.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('permissions.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsService.remove(id);
    return { message: 'Permission deleted successfully' };
  }
}
