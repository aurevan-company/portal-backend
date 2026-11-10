import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PriceType } from './price-type.enum.js';
import { ServicePriceEntity } from './service-price.entity.js';
import { ServiceType } from './service-type.enum.js';
import { ServiceEntity } from './service.entity.js';
import { VehicleCategoryEntity } from './vehicle-category.entity.js';

export interface QuoteInput {
  vehicle_category_id: number;
  service_ids: number[];
  addons?: { service_id: number; amount?: number }[];
}

export interface Quote {
  items: { service_id: number; name: string; price: number }[];
  total: number;
}

const notAvailable = () =>
  new BadRequestException({
    code: 'SERVICE_NOT_AVAILABLE_FOR_CATEGORY',
    message: 'Service is not available for this vehicle category',
  });

// Server-side price calculation. Prices come only from the DB; exported so the
// future orders module can reuse it.
@Injectable()
export class CatalogPricingService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly services: Repository<ServiceEntity>,
    @InjectRepository(VehicleCategoryEntity)
    private readonly categories: Repository<VehicleCategoryEntity>,
    @InjectRepository(ServicePriceEntity)
    private readonly prices: Repository<ServicePriceEntity>,
  ) {}

  async quote(organization_id: number, input: QuoteInput): Promise<Quote> {
    const addons = input.addons ?? [];
    const ids = [...input.service_ids, ...addons.map((a) => a.service_id)];
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('A service can be listed only once');
    }

    const category = await this.categories
      .createQueryBuilder('c')
      .select('c.id')
      .where('c.id = :id', { id: input.vehicle_category_id })
      .andWhere('c.deleted = false')
      .andWhere('c.is_active = true')
      .andWhere(
        '(c.organization_id IS NULL OR c.organization_id = :organization_id)',
        {
          organization_id,
        },
      )
      .getOne();
    if (!category) throw new BadRequestException('Unknown vehicle category');

    const services = await this.services
      .createQueryBuilder('s')
      .where('s.id IN (:...ids)', { ids })
      .andWhere('s.deleted = false')
      .andWhere('s.is_active = true')
      .andWhere(
        '(s.organization_id IS NULL OR s.organization_id = :organization_id)',
        {
          organization_id,
        },
      )
      .getMany();
    const serviceById = new Map(services.map((s) => [s.id, s]));

    const prices = await this.prices.find({
      where: {
        organization_id,
        vehicle_category_id: input.vehicle_category_id,
        deleted: false,
        is_active: true,
      },
    });
    const priceByService = new Map(prices.map((p) => [p.service_id, p]));

    const items: Quote['items'] = [];

    for (const service_id of input.service_ids) {
      const service = serviceById.get(service_id);
      if (!service)
        throw new BadRequestException(`Unknown service ${service_id}`);
      if (service.type !== ServiceType.SERVICE) {
        throw new BadRequestException(
          `${service_id} is an addon, not a service`,
        );
      }
      const row = priceByService.get(service_id);
      if (!row) throw notAvailable();
      // A RANGE price on a main service quotes its lower bound.
      items.push({ service_id, name: service.name, price: row.price });
    }

    for (const addon of addons) {
      const service = serviceById.get(addon.service_id);
      if (!service) {
        throw new BadRequestException(`Unknown service ${addon.service_id}`);
      }
      if (service.type !== ServiceType.ADDON) {
        throw new BadRequestException(
          `${addon.service_id} is a service, not an addon`,
        );
      }
      const row = priceByService.get(addon.service_id);
      if (!row) throw notAvailable();

      let price = row.price;
      if (row.price_type === PriceType.RANGE) {
        const max = row.price_max ?? row.price;
        if (
          addon.amount === undefined ||
          addon.amount < row.price ||
          addon.amount > max
        ) {
          throw new BadRequestException(
            `amount for addon ${addon.service_id} must be between ${row.price} and ${max}`,
          );
        }
        price = addon.amount;
      }
      items.push({ service_id: addon.service_id, name: service.name, price });
    }

    return { items, total: items.reduce((sum, item) => sum + item.price, 0) };
  }
}
