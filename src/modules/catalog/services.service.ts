import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { ServiceEntity } from './service.entity.js';

const isUniqueViolation = (error: unknown) =>
  !!error &&
  typeof error === 'object' &&
  'code' in error &&
  error.code === '23505';

const clean = (value: string | null | undefined) => value?.trim() || null;

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly services: Repository<ServiceEntity>,
  ) {}

  // System rows first, then the organization's own, each by sort_order.
  findAll(organization_id: number) {
    return this.services
      .createQueryBuilder('s')
      .where(
        '(s.organization_id IS NULL OR s.organization_id = :organization_id)',
        {
          organization_id,
        },
      )
      .andWhere('s.deleted = false')
      .orderBy('(s.organization_id IS NOT NULL)', 'ASC')
      .addOrderBy('s.sort_order', 'ASC')
      .addOrderBy('s.id', 'ASC')
      .getMany();
  }

  async create(
    organization_id: number,
    dto: CreateServiceDto,
    current_user_id: number,
  ) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('name must not be blank');
    await this.assertNotSystemName(name);

    const entity = this.services.create({
      organization_id,
      name,
      description: clean(dto.description),
      type: dto.type,
      sort_order: dto.sort_order ?? (await this.nextSortOrder(organization_id)),
      created_by: current_user_id,
    });
    return this.save(entity);
  }

  async update(
    organization_id: number,
    id: number,
    dto: UpdateServiceDto,
    current_user_id: number,
  ) {
    const service = await this.findOwn(organization_id, id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('name must not be blank');
      if (name.toLowerCase() !== service.name.toLowerCase()) {
        await this.assertNotSystemName(name);
      }
      service.name = name;
    }
    if (dto.description !== undefined) {
      service.description = clean(dto.description);
    }
    if (dto.type !== undefined) service.type = dto.type;
    if (dto.sort_order !== undefined) service.sort_order = dto.sort_order;
    if (dto.is_active !== undefined) service.is_active = dto.is_active;
    service.updated_by = current_user_id;

    return this.save(service);
  }

  async remove(organization_id: number, id: number, current_user_id: number) {
    await this.findOwn(organization_id, id);
    await this.services.update(id, {
      deleted: true,
      updated_by: current_user_id,
    });
  }

  // System rows are read-only (403); other organizations' rows look missing (404).
  private async findOwn(organization_id: number, id: number) {
    const service = await this.services.findOne({
      where: { id, deleted: false },
    });
    if (!service) throw new NotFoundException('Service not found');
    if (service.organization_id === null) {
      throw new ForbiddenException('System services are read-only');
    }
    if (service.organization_id !== organization_id) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  private async assertNotSystemName(name: string) {
    const exists = await this.services
      .createQueryBuilder('s')
      .where('s.organization_id IS NULL')
      .andWhere('s.deleted = false')
      .andWhere('lower(s.name) = lower(:name)', { name })
      .getExists();
    if (exists) this.throwDuplicate();
  }

  private async nextSortOrder(organization_id: number) {
    const row = await this.services
      .createQueryBuilder('s')
      .select('MAX(s.sort_order)', 'max')
      .where('s.organization_id = :organization_id', { organization_id })
      .andWhere('s.deleted = false')
      .getRawOne<{ max: number | null }>();
    return Number(row?.max ?? 0) + 1;
  }

  private async save(entity: ServiceEntity) {
    try {
      return await this.services.save(entity);
    } catch (error) {
      // uq_services_org_name: same name already in this organization.
      if (isUniqueViolation(error)) this.throwDuplicate();
      throw error;
    }
  }

  private throwDuplicate(): never {
    throw new ConflictException({
      code: 'SERVICE_ALREADY_EXISTS',
      message: 'Service already exists',
    });
  }
}
