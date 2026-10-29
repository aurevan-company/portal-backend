import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { RoleEntity } from './role.entity.js';
import { PermissionEntity } from '../permissions/permission.entity.js';
import { CreateRoleDto } from './dto/create-role.dto.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissions: Repository<PermissionEntity>,
  ) {}

  private toResponse(role: RoleEntity) {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      permissions: (role.permissions ?? []).map((permission) => ({
        id: permission.id,
        code: permission.code,
        name: permission.name,
      })),
    };
  }

  async findAll() {
    const roles = await this.roles.find({
      relations: {
        permissions: true,
        // users: true,
      },
      order: { id: 'ASC' },
    });

    return roles.map((role) => this.toResponse(role));
  }

  async findById(id: number) {
    const role = await this.roles.findOne({
      where: { id },
      relations: {
        permissions: true,
        // users: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.toResponse(role);
  }

  private async getPermissions(ids: number[]) {
    const uniqueIds = [...new Set(ids)];

    const permissions = uniqueIds.length
      ? await this.permissions.find({
          where: { id: In(uniqueIds) },
        })
      : [];

    if (permissions.length !== uniqueIds.length) {
      throw new NotFoundException('One or more permissions were not found');
    }

    return permissions;
  }

  async create(dto: CreateRoleDto) {
    const code = dto.code.trim().toLowerCase();

    const existing = await this.roles.findOne({
      where: { code },
    });

    if (existing) {
      throw new ConflictException('Role code already exists');
    }

    const permissions = await this.getPermissions(dto.permission_ids ?? []);

    const role = this.roles.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      permissions,
    });

    const saved = await this.roles.save(role);

    return this.toResponse(saved);
  }

  async update(id: number, dto: CreateRoleDto) {
    const role = await this.roles.findOne({
      where: { id },
      relations: {
        permissions: true,
        // users: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const code = dto.code.trim().toLowerCase();

    const duplicate = await this.roles.findOne({
      where: { code },
    });

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Role code already exists');
    }

    const permissions = await this.getPermissions(dto.permission_ids ?? []);

    role.code = code;
    role.name = dto.name.trim();
    role.description = dto.description?.trim() || null;
    role.permissions = permissions;

    const saved = await this.roles.save(role);

    return this.toResponse(saved);
  }

  async remove(id: number): Promise<void> {
    const role = await this.roles.findOne({
      where: { id },
      relations: {
        permissions: true,
        // users: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // if (role.users?.length) {
    //   throw new ConflictException('Cannot delete a role assigned to users');
    // }

    role.permissions = [];
    await this.roles.save(role);
    await this.roles.remove(role);
  }
}
