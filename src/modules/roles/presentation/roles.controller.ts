import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RolesService } from '../../roles/application/services/roles.service.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../../../shared/auth/decorators/require-permissions.decorator.js';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  findAll() { return this.rolesService.findAll(); }

  @Get(':id')
  @RequirePermissions('roles.read')
  findById(@Param('id', ParseIntPipe) id: number) { return this.rolesService.findById(id); }

  @Post()
  @RequirePermissions('roles.create')
  create(@Body() dto: CreateRoleDto) { return this.rolesService.create(dto); }

  @Patch(':id')
  @RequirePermissions('roles.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('roles.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.rolesService.remove(id);
    return { message: 'Role deleted successfully' };
  }
}
