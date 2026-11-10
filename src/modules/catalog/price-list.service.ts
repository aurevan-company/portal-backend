import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import {
  PriceListItemDto,
  UpsertPriceListDto,
} from './dto/upsert-price-list.dto.js';
import { PriceType } from './price-type.enum.js';
import { ServicePriceEntity } from './service-price.entity.js';
import { ServiceEntity } from './service.entity.js';
import { ServicesService } from './services.service.js';
import { VehicleCategoriesService } from './vehicle-categories.service.js';
import { VehicleCategoryEntity } from './vehicle-category.entity.js';

@Injectable()
export class PriceListService {
  constructor(
    @InjectRepository(ServicePriceEntity)
    private readonly prices: Repository<ServicePriceEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly categories: VehicleCategoriesService,
    private readonly services: ServicesService,
  ) {}

  // Everything the frontend needs to draw the tariff table.
  async findAll(organization_id: number) {
    const [categories, services, prices] = await Promise.all([
      this.categories.findAll(organization_id),
      this.services.findAll(organization_id),
      this.findPrices(this.prices.manager, organization_id),
    ]);
    return { categories, services, prices };
  }

  async upsert(
    organization_id: number,
    dto: UpsertPriceListDto,
    current_user_id: number,
  ) {
    const items = dto.items.map((item) => this.normalize(item));
    this.assertNoDuplicates(items);

    return this.dataSource.transaction(async (manager) => {
      await this.assertVisible(
        manager,
        ServiceEntity,
        'service_id',
        items.map((item) => item.service_id),
        organization_id,
      );
      await this.assertVisible(
        manager,
        VehicleCategoryEntity,
        'vehicle_category_id',
        items.map((item) => item.vehicle_category_id),
        organization_id,
      );

      const existing = await manager
        .getRepository(ServicePriceEntity)
        .createQueryBuilder('p')
        .where('p.organization_id = :organization_id', { organization_id })
        .andWhere('p.deleted = false')
        .andWhere('p.service_id IN (:...service_ids)', {
          service_ids: items.map((item) => item.service_id),
        })
        .getMany();
      const byKey = new Map(
        existing.map((row) => [
          `${row.service_id}:${row.vehicle_category_id}`,
          row,
        ]),
      );

      const repo = manager.getRepository(ServicePriceEntity);
      for (const item of items) {
        const row =
          byKey.get(`${item.service_id}:${item.vehicle_category_id}`) ??
          repo.create({
            organization_id,
            service_id: item.service_id,
            vehicle_category_id: item.vehicle_category_id,
            created_by: current_user_id,
          });
        row.price_type = item.price_type;
        row.price = item.price;
        row.price_max = item.price_max;
        row.is_active = true;
        row.updated_by = current_user_id;
        await repo.save(row);
      }

      return this.findPrices(manager, organization_id);
    });
  }

  // Soft delete: the combination stops being offered.
  async remove(organization_id: number, id: number, current_user_id: number) {
    const price = await this.prices.findOne({
      where: { id, organization_id, deleted: false },
      select: { id: true },
    });
    if (!price) throw new NotFoundException('Price not found');
    await this.prices.update(id, {
      deleted: true,
      updated_by: current_user_id,
    });
  }

  private findPrices(manager: EntityManager, organization_id: number) {
    return manager.getRepository(ServicePriceEntity).find({
      where: { organization_id, deleted: false },
      order: { service_id: 'ASC', vehicle_category_id: 'ASC' },
    });
  }

  private normalize(item: PriceListItemDto) {
    let price_max: number | null = null;
    if (item.price_type === PriceType.RANGE) {
      if (item.price_max == null || item.price_max <= item.price) {
        throw new BadRequestException(
          'price_max must be greater than price for RANGE prices',
        );
      }
      price_max = item.price_max;
    }
    return {
      service_id: item.service_id,
      vehicle_category_id: item.vehicle_category_id,
      price_type: item.price_type,
      price: item.price,
      price_max,
    };
  }

  private assertNoDuplicates(
    items: { service_id: number; vehicle_category_id: number }[],
  ) {
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.service_id}:${item.vehicle_category_id}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          `Duplicate item for service_id ${item.service_id} and vehicle_category_id ${item.vehicle_category_id}`,
        );
      }
      seen.add(key);
    }
  }

  // Every id must be a live system row or one of this organization's own.
  private async assertVisible(
    manager: EntityManager,
    entity: typeof ServiceEntity | typeof VehicleCategoryEntity,
    field: 'service_id' | 'vehicle_category_id',
    ids: number[],
    organization_id: number,
  ) {
    const unique = [...new Set(ids)];
    const rows = await manager
      .getRepository<{ id: number }>(entity)
      .createQueryBuilder('t')
      .select('t.id', 'id')
      .where('t.id IN (:...unique)', { unique })
      .andWhere('t.deleted = false')
      .andWhere(
        '(t.organization_id IS NULL OR t.organization_id = :organization_id)',
        {
          organization_id,
        },
      )
      .getRawMany<{ id: string }>();
    const found = new Set(rows.map((row) => Number(row.id)));
    const missing = unique.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown ${field}: ${missing.join(', ')}`);
    }
  }
}
