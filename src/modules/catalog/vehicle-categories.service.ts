import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateVehicleCategoryDto } from './dto/create-vehicle-category.dto.js';
import { UpdateVehicleCategoryDto } from './dto/update-vehicle-category.dto.js';
import { VehicleCategoryEntity } from './vehicle-category.entity.js';

const isUniqueViolation = (error: unknown) =>
  !!error &&
  typeof error === 'object' &&
  'code' in error &&
  error.code === '23505';

const clean = (value: string | null | undefined) => value?.trim() || null;

@Injectable()
export class VehicleCategoriesService {
  constructor(
    @InjectRepository(VehicleCategoryEntity)
    private readonly categories: Repository<VehicleCategoryEntity>,
  ) {}

  // System rows first, then the organization's own, each by sort_order.
  findAll(organization_id: number) {
    return this.categories
      .createQueryBuilder('c')
      .where(
        '(c.organization_id IS NULL OR c.organization_id = :organization_id)',
        {
          organization_id,
        },
      )
      .andWhere('c.deleted = false')
      .orderBy('(c.organization_id IS NOT NULL)', 'ASC')
      .addOrderBy('c.sort_order', 'ASC')
      .addOrderBy('c.id', 'ASC')
      .getMany();
  }

  async create(
    organization_id: number,
    dto: CreateVehicleCategoryDto,
    current_user_id: number,
  ) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('name must not be blank');
    await this.assertNotSystemName(name);

    const entity = this.categories.create({
      organization_id,
      name,
      description: clean(dto.description),
      sort_order: dto.sort_order ?? (await this.nextSortOrder(organization_id)),
      created_by: current_user_id,
    });
    return this.save(entity);
  }

  async update(
    organization_id: number,
    id: number,
    dto: UpdateVehicleCategoryDto,
    current_user_id: number,
  ) {
    const category = await this.findOwn(organization_id, id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('name must not be blank');
      if (name.toLowerCase() !== category.name.toLowerCase()) {
        await this.assertNotSystemName(name);
      }
      category.name = name;
    }
    if (dto.description !== undefined) {
      category.description = clean(dto.description);
    }
    if (dto.sort_order !== undefined) category.sort_order = dto.sort_order;
    if (dto.is_active !== undefined) category.is_active = dto.is_active;
    category.updated_by = current_user_id;

    return this.save(category);
  }

  async remove(organization_id: number, id: number, current_user_id: number) {
    await this.findOwn(organization_id, id);
    await this.categories.update(id, {
      deleted: true,
      updated_by: current_user_id,
    });
  }

  // System rows are read-only (403); other organizations' rows look missing (404).
  private async findOwn(organization_id: number, id: number) {
    const category = await this.categories.findOne({
      where: { id, deleted: false },
    });
    if (!category) throw new NotFoundException('Vehicle category not found');
    if (category.organization_id === null) {
      throw new ForbiddenException('System vehicle categories are read-only');
    }
    if (category.organization_id !== organization_id) {
      throw new NotFoundException('Vehicle category not found');
    }
    return category;
  }

  private async assertNotSystemName(name: string) {
    const exists = await this.categories
      .createQueryBuilder('c')
      .where('c.organization_id IS NULL')
      .andWhere('c.deleted = false')
      .andWhere('lower(c.name) = lower(:name)', { name })
      .getExists();
    if (exists) this.throwDuplicate();
  }

  private async nextSortOrder(organization_id: number) {
    const row = await this.categories
      .createQueryBuilder('c')
      .select('MAX(c.sort_order)', 'max')
      .where('c.organization_id = :organization_id', { organization_id })
      .andWhere('c.deleted = false')
      .getRawOne<{ max: number | null }>();
    return Number(row?.max ?? 0) + 1;
  }

  private async save(entity: VehicleCategoryEntity) {
    try {
      return await this.categories.save(entity);
    } catch (error) {
      // uq_vehicle_categories_org_name: same name already in this organization.
      if (isUniqueViolation(error)) this.throwDuplicate();
      throw error;
    }
  }

  private throwDuplicate(): never {
    throw new ConflictException({
      code: 'CATEGORY_ALREADY_EXISTS',
      message: 'Vehicle category already exists',
    });
  }
}
