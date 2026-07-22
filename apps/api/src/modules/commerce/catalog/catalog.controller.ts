import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type {
  CreateCategoryBody,
  CreateProductBody,
  UpdateProductBody,
  UpdateVariantBody,
  BulkProductsBody,
} from '@inabiya/validation';
import {
  bulkProductsBodySchema,
  catalogListQuerySchema,
  createCategoryBodySchema,
  createProductBodySchema,
  updateInventoryBodySchema,
  updateProductBodySchema,
  updateVariantBodySchema,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogPublicController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Get('products')
  listProducts(
    @Query(new ZodValidationPipe(catalogListQuerySchema))
    query: {
      q?: string;
      category?: string;
      recipient?: string;
      age?: string;
      occasion?: string;
      hamper?: '0' | '1';
      sort?: 'newest' | 'price_asc' | 'price_desc';
    },
  ) {
    return this.catalog.listPublishedProducts(query);
  }

  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.catalog.getPublishedProductBySlug(slug);
  }
}

@Controller('admin/catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
export class CatalogAdminController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('products')
  listProducts() {
    return this.catalog.listAdminProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.catalog.getAdminProduct(id);
  }

  @Post('products')
  createProduct(
    @Body(new ZodValidationPipe(createProductBodySchema))
    body: CreateProductBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.createProduct(body, user.id, String(req.id ?? ''));
  }

  @Post('products/bulk')
  bulkProducts(
    @Body(new ZodValidationPipe(bulkProductsBodySchema))
    body: BulkProductsBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.bulkProducts(body.ids, body.action, user.id, String(req.id ?? ''));
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductBodySchema))
    body: UpdateProductBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.updateProduct(id, body, user.id, String(req.id ?? ''));
  }

  @Post('products/:id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: { id: string }, @Req() req: AuthedRequest) {
    return this.catalog.publishProduct(id, user.id, String(req.id ?? ''));
  }

  @Post('products/:id/unpublish')
  unpublish(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.unpublishProduct(id, user.id, String(req.id ?? ''));
  }

  @Patch('variants/:variantId/inventory')
  updateInventory(
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(updateInventoryBodySchema))
    body: { onHand: number },
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.updateInventory(variantId, body.onHand, user.id, String(req.id ?? ''));
  }

  @Patch('variants/:variantId')
  updateVariant(
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(updateVariantBodySchema))
    body: UpdateVariantBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.updateVariant(variantId, body, user.id, String(req.id ?? ''));
  }

  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Post('categories')
  createCategory(
    @Body(new ZodValidationPipe(createCategoryBodySchema))
    body: CreateCategoryBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.createCategory(body, user.id, String(req.id ?? ''));
  }
}
