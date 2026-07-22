import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { addressBodySchema } from '@inabiya/validation';
import type { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { AddressService } from './address.service';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addresses: AddressService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.addresses.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(addressBodySchema)) body: Parameters<AddressService['create']>[1],
  ) {
    return this.addresses.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addressBodySchema.partial()))
    body: Partial<z.infer<typeof addressBodySchema>>,
  ) {
    return this.addresses.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.addresses.remove(user.id, id);
  }
}
