import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { OrganizationQueryDto } from './dto/organization-query.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationStatus } from './organization-status.enum.js';
import { UserStatus } from '../users/user-status.enum.js';
import { UserEntity } from '../users/user.entity.js';
import { OrganizationEntity } from './organization.entity.js';

const isForeignKeyViolation = (error: unknown) =>
  !!error &&
  typeof error === 'object' &&
  'code' in error &&
  error.code === '23503';

const clean = (value: string | null | undefined) => value?.trim() || null;

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizations: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async create(dto: CreateOrganizationDto, current_user_id: number) {
    await this.assertValidOwner(dto.owner_id);
    if (dto.parent_id) await this.assertValidParent(dto.parent_id);

    const entity = this.organizations.create({
      owner_id: dto.owner_id,
      parent_id: dto.parent_id ?? null,
      name: dto.name.trim(),
      logo_url: clean(dto.logo_url),
      description: clean(dto.description),
      phone: clean(dto.phone),
      email: clean(dto.email),
      address: clean(dto.address),
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      google_place_id: clean(dto.google_place_id),
      facebook_url: clean(dto.facebook_url),
      instagram_url: clean(dto.instagram_url),
      working_hours: dto.working_hours ?? null,
      status: dto.status ?? OrganizationStatus.PENDING,
      is_active: dto.is_active ?? true,
      created_by: current_user_id,
    });

    return this.save(entity);
  }

  async findAll(query: OrganizationQueryDto) {
    const { page, limit, status, owner_id, parent_id, is_active, search } =
      query;
    const where: FindOptionsWhere<OrganizationEntity> = { deleted: false };
    if (status) where.status = status;
    if (owner_id) where.owner_id = owner_id;
    if (parent_id) where.parent_id = parent_id;
    if (is_active !== undefined) where.is_active = is_active;
    if (search?.trim()) where.name = ILike(`%${search.trim()}%`);

    const [items, total] = await this.organizations.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next_page: page * limit < total,
        has_previous_page: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const organization = await this.organizations.findOne({
      where: { id, deleted: false },
    });
    if (!organization) throw new NotFoundException('Organization not found');
    return organization;
  }

  async update(id: number, dto: UpdateOrganizationDto, current_user_id: number) {
    const organization = await this.findOne(id);

    if (dto.owner_id !== undefined && dto.owner_id !== organization.owner_id) {
      await this.assertValidOwner(dto.owner_id);
    }
    if (dto.parent_id !== undefined && dto.parent_id !== null) {
      if (dto.parent_id === id) {
        throw new BadRequestException('Organization cannot be its own parent');
      }
      await this.assertValidParent(dto.parent_id);
    }

    if (dto.owner_id !== undefined) organization.owner_id = dto.owner_id;
    if (dto.parent_id !== undefined) organization.parent_id = dto.parent_id;
    if (dto.name !== undefined) organization.name = dto.name.trim();
    if (dto.logo_url !== undefined) organization.logo_url = clean(dto.logo_url);
    if (dto.description !== undefined) {
      organization.description = clean(dto.description);
    }
    if (dto.phone !== undefined) organization.phone = clean(dto.phone);
    if (dto.email !== undefined) organization.email = clean(dto.email);
    if (dto.address !== undefined) organization.address = clean(dto.address);
    if (dto.latitude !== undefined) organization.latitude = dto.latitude;
    if (dto.longitude !== undefined) organization.longitude = dto.longitude;
    if (dto.google_place_id !== undefined) {
      organization.google_place_id = clean(dto.google_place_id);
    }
    if (dto.facebook_url !== undefined) {
      organization.facebook_url = clean(dto.facebook_url);
    }
    if (dto.instagram_url !== undefined) {
      organization.instagram_url = clean(dto.instagram_url);
    }
    if (dto.working_hours !== undefined) {
      organization.working_hours = dto.working_hours;
    }
    if (dto.status !== undefined) organization.status = dto.status;
    if (dto.is_active !== undefined) organization.is_active = dto.is_active;
    organization.updated_by = current_user_id;

    return this.save(organization);
  }

  async remove(id: number, current_user_id: number) {
    await this.findOne(id);
    await this.organizations.update(id, {
      deleted: true,
      updated_by: current_user_id,
    });
  }

  private async assertValidOwner(owner_id: number) {
    const user = await this.users.findOne({
      where: { id: owner_id, deleted: false, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException('Owner user does not exist or is not active');
    }
  }

  private async assertValidParent(parent_id: number) {
    const parent = await this.organizations.findOne({
      where: { id: parent_id, deleted: false },
      select: { id: true },
    });
    if (!parent) {
      throw new BadRequestException('Parent organization does not exist');
    }
  }

  private async save(entity: OrganizationEntity) {
    try {
      return await this.organizations.save(entity);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new BadRequestException('Owner or parent organization does not exist');
      }
      throw error;
    }
  }
}
