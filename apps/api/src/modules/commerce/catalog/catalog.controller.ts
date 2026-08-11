import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  bulkProductsBodySchema,
  adminCatalogListQuerySchema,
  catalogListQuerySchema,
  createCollectionBodySchema,
  createProductBodySchema,
  productImportBodySchema,
  updateCollectionBodySchema,
  updateInventoryBodySchema,
  updateProductBodySchema,
  updateVariantBodySchema,
  type AdminCatalogListQuery,
  type BulkProductsBody,
  type CreateCollectionBody,
  type CreateProductBody,
  type ProductImportBody,
  type UpdateCollectionBody,
  type UpdateProductBody,
  type UpdateVariantBody,
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

  @Get('collections')
  listCollections() {
    return this.catalog.listCollections();
  }

  @Get('collections/:slug')
  getCollection(@Param('slug') slug: string) {
    return this.catalog.getPublishedCollectionBySlug(slug);
  }

  @Get('products')
  listProducts(
    @Query(new ZodValidationPipe(catalogListQuerySchema))
    query: {
      q?: string;
      collection?: string;
      recipient?: string;
      age?: string;
      occasion?: string;
      hamper?: '0' | '1';
      sort?: 'newest' | 'price_asc' | 'price_desc';
      storefrontLabel?: 'BESTSELLER' | 'EDITORS_PICK' | 'GIFT_SET';
      onSale?: '0' | '1';
      publishedSince?: string;
      maxPricePaise?: number;
    },
  ) {
    return this.catalog.listPublishedProducts({
      ...query,
      onSale: query.onSale === '1' ? true : undefined,
      publishedSince: query.publishedSince ? new Date(query.publishedSince) : undefined,
      maxPricePaise: query.maxPricePaise,
    });
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
  listProducts(
    @Query(new ZodValidationPipe(adminCatalogListQuerySchema)) query: AdminCatalogListQuery,
  ) {
    return this.catalog.listAdminProducts(query);
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

  @Post('products/import')
  importProducts(
    @Body(new ZodValidationPipe(productImportBodySchema)) body: ProductImportBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.importProducts(body, user.id, String(req.id ?? ''));
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

  @Get('collections')
  listCollections() {
    return this.catalog.listAdminCollections();
  }

  @Get('collections/:id')
  getCollection(@Param('id') id: string) {
    return this.catalog.getAdminCollection(id);
  }

  @Post('collections')
  createCollection(
    @Body(new ZodValidationPipe(createCollectionBodySchema))
    body: CreateCollectionBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.createCollection(body, user.id, String(req.id ?? ''));
  }

  @Patch('collections/:id')
  updateCollection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCollectionBodySchema))
    body: UpdateCollectionBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.updateCollection(id, body, user.id, String(req.id ?? ''));
  }

  @Delete('collections/:id')
  deleteCollection(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.catalog.deleteCollection(id, user.id, String(req.id ?? ''));
  }
}
