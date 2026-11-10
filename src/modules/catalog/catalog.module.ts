import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OrganizationAccessGuard } from '../../common/guards/organization-access.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { OrganizationEntity } from '../organizations/organization.entity.js';
import { CatalogPricingService } from './catalog-pricing.service.js';
import { PriceListController } from './price-list.controller.js';
import { PriceListService } from './price-list.service.js';
import { ServicePriceEntity } from './service-price.entity.js';
import { ServiceEntity } from './service.entity.js';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';
import { VehicleCategoriesController } from './vehicle-categories.controller.js';
import { VehicleCategoriesService } from './vehicle-categories.service.js';
import { VehicleCategoryEntity } from './vehicle-category.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehicleCategoryEntity,
      ServiceEntity,
      ServicePriceEntity,
      OrganizationEntity,
    ]),
  ],
  controllers: [
    VehicleCategoriesController,
    ServicesController,
    PriceListController,
  ],
  providers: [
    VehicleCategoriesService,
    ServicesService,
    PriceListService,
    CatalogPricingService,
    JwtAuthGuard,
    PermissionsGuard,
    OrganizationAccessGuard,
  ],
  exports: [CatalogPricingService],
})
export class CatalogModule {}
