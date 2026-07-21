import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { giftingInquiryBodySchema, type GiftingInquiryBody } from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../identity/jwt-auth.guard';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { GiftingInquiryService } from './gifting-inquiry.service';

@Controller('catalog/gifting-inquiries')
export class GiftingInquiryPublicController {
  constructor(private readonly inquiries: GiftingInquiryService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(giftingInquiryBodySchema)) body: GiftingInquiryBody,
  ) {
    return this.inquiries.create(body);
  }
}

@Controller('admin/commerce/gifting-inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'SUPER_ADMIN', 'SUPPORT')
export class GiftingInquiryAdminController {
  constructor(private readonly inquiries: GiftingInquiryService) {}

  @Get()
  list() {
    return this.inquiries.listAdmin();
  }
}
