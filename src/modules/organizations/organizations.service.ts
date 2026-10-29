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

  async create(dto: CreateOrganizationDto) {
    await this.assertValidOwner(dto.owner_id);

    const entity = this.organizations.create({
      name: dto.name.trim(),
      owner_id: dto.owner_id,
      phone: dto.phone.trim(),
      email: clean(dto.email),
      description: clean(dto.description),
      logo_url: clean(dto.logo_url),
      status: dto.status ?? OrganizationStatus.ACTIVE,
    });

    return this.save(entity);
  }

  async findAll(query: OrganizationQueryDto) {
    const { page, limit, status, owner_id, search } = query;
    const where: FindOptionsWhere<OrganizationEntity> = { deleted: false };
    if (status) where.status = status;
    if (owner_id) where.owner_id = owner_id;
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

  async update(id: number, dto: UpdateOrganizationDto) {
    const organization = await this.findOne(id);
    if (dto.owner_id !== undefined && dto.owner_id !== organization.owner_id) {
      await this.assertValidOwner(dto.owner_id);
    }

    if (dto.name !== undefined) organization.name = dto.name.trim();
    if (dto.owner_id !== undefined) organization.owner_id = dto.owner_id;
    if (dto.phone !== undefined) organization.phone = dto.phone.trim();
    if (dto.email !== undefined) organization.email = clean(dto.email);
    if (dto.description !== undefined) {
      organization.description = clean(dto.description);
    }
    if (dto.logo_url !== undefined) organization.logo_url = clean(dto.logo_url);
    if (dto.status !== undefined) organization.status = dto.status;

    return this.save(organization);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.organizations.update(id, { deleted: true });
  }

  private async assertValidOwner(owner_id: number) {
    const owner = await this.users.findOne({
      where: { id: owner_id, deleted: false, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    if (!owner) {
      throw new BadRequestException(
        'Owner user does not exist or is not active',
      );
    }
  }

  private async save(entity: OrganizationEntity) {
    try {
      return await this.organizations.save(entity);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new BadRequestException('Owner user does not exist');
      }
      throw error;
    }
  }
}
