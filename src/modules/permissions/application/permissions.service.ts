import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PermissionOrmEntity } from '../infrastructure/permission.orm-entity.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionOrmEntity)
    private readonly permissions: Repository<PermissionOrmEntity>,
  ) {}

  async findAll() {
    return this.permissions.find({
      order: { code: 'ASC' },
    });
  }

  async findById(id: number) {
    const permission = await this.permissions.findOne({ where: { id } });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async create(dto: CreatePermissionDto) {
    const code = dto.code.trim().toLowerCase();
    const existing = await this.permissions.findOne({
      where: { code },
    });

    if (existing) {
      throw new ConflictException('Permission code already exists');
    }

    const permission = this.permissions.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
    });

    return this.permissions.save(permission);
  }

  async update(id: number, dto: CreatePermissionDto) {
    const permission = await this.findById(id);
    const code = dto.code.trim().toLowerCase();

    const duplicate = await this.permissions.findOne({
      where: { code },
    });

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Permission code already exists');
    }

    permission.code = code;
    permission.name = dto.name.trim();
    permission.description = dto.description?.trim() || null;

    return this.permissions.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.permissions.findOne({
      where: { id },
      // relations: {
      //   roles: true,
      // },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Эхлээд холбоосыг цэвэрлээд permission-ийг устгана.
    // permission.roles = [];
    await this.permissions.save(permission);
    await this.permissions.remove(permission);
  }
}
