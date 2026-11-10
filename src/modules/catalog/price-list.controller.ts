import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentOrganizationId } from '../../common/decorators/current-organization-id.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OrganizationAccessGuard } from '../../common/guards/organization-access.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { CatalogPricingService } from './catalog-pricing.service.js';
import { PriceQuoteDto } from './dto/price-quote.dto.js';
import { UpsertPriceListDto } from './dto/upsert-price-list.dto.js';
import { PriceListService } from './price-list.service.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard, OrganizationAccessGuard)
export class PriceListController {
  constructor(
    private readonly priceList: PriceListService,
    private readonly pricing: CatalogPricingService,
  ) {}

  @Get('price-list')
  @RequirePermissions('price_list.read')
  findAll(@CurrentOrganizationId() organization_id: number) {
    return this.priceList.findAll(organization_id);
  }

  @Put('price-list')
  @RequirePermissions('price_list.update')
  upsert(
    @CurrentOrganizationId() organization_id: number,
    @Body() dto: UpsertPriceListDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.priceList.upsert(organization_id, dto, user.id);
  }

  @Delete('price-list/:id')
  @RequirePermissions('price_list.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentOrganizationId() organization_id: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.priceList.remove(organization_id, id, user.id);
  }

  @Post('price-quote')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('price_list.read')
  quote(
    @CurrentOrganizationId() organization_id: number,
    @Body() dto: PriceQuoteDto,
  ) {
    return this.pricing.quote(organization_id, dto);
  }
}
