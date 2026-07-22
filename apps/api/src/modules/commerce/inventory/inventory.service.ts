import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

type Tx = Prisma.TransactionClient;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAvailable(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    for (const item of items) {
      const inv = await this.prisma.inventoryItem.findUnique({
        where: { variantId: item.variantId },
      });
      if (!inv) {
        throw new BadRequestException({
          code: 'OUT_OF_STOCK',
          message: 'Item is unavailable.',
        });
      }
      const available = inv.onHand - inv.reserved;
      if (available < item.quantity) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: 'Not enough stock for one or more items.',
        });
      }
    }
  }

  async reserve(tx: Tx, items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    for (const item of items) {
      const inv = await tx.inventoryItem.findUnique({
        where: { variantId: item.variantId },
      });
      if (!inv || inv.onHand - inv.reserved < item.quantity) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: 'Not enough stock for one or more items.',
        });
      }
      await tx.inventoryItem.update({
        where: { variantId: item.variantId },
        data: { reserved: { increment: item.quantity } },
      });
    }
  }

  async release(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventoryItem.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inv) continue;
        const releaseQty = Math.min(item.quantity, inv.reserved);
        if (releaseQty > 0) {
          await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: { reserved: { decrement: releaseQty } },
          });
        }
      }
    });
  }

  async commit(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventoryItem.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inv) {
          throw new NotFoundException({
            code: 'INVENTORY_NOT_FOUND',
            message: 'Inventory record missing.',
          });
        }
        const qty = Math.min(item.quantity, inv.reserved);
        await tx.inventoryItem.update({
          where: { variantId: item.variantId },
          data: {
            onHand: { decrement: qty },
            reserved: { decrement: qty },
          },
        });
      }
    });
  }

  /** After paid cancel/refund — return committed stock to onHand. */
  async restock(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventoryItem.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inv || item.quantity <= 0) continue;
        await tx.inventoryItem.update({
          where: { variantId: item.variantId },
          data: { onHand: { increment: item.quantity } },
        });
      }
    });
  }
}
