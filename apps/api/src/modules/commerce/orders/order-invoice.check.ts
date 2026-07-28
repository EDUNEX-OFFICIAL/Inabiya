import assert from 'node:assert/strict';
import {
  isInvoiceEligible,
  toInvoicePreviewDto,
  type InvoiceInput,
} from './order-invoice';

const sample: InvoiceInput = {
  invoiceNumber: 'INV-TEST-1',
  orderNumber: 'TEST-1',
  issuedAt: new Date('2026-07-28T10:00:00.000Z'),
  paidAt: new Date('2026-07-28T10:00:00.000Z'),
  status: 'PAID',
  customerEmail: 'customer@test.inabiya',
  customerName: 'Test',
  shippingAddress: null,
  billingAddress: null,
  items: [
    {
      title: 'Swaddle',
      label: 'Default',
      sku: 'SKU-1',
      quantity: 1,
      unitPricePaise: 129900,
      lineTotalPaise: 129900,
    },
  ],
  subtotalPaise: 129900,
  discountPaise: 0,
  shippingPaise: 0,
  taxPaise: 0,
  totalPaise: 129900,
  shippingMethod: 'STANDARD',
  couponCode: null,
  paymentProvider: 'mock',
  paymentStatus: 'CAPTURED',
};

assert.equal(isInvoiceEligible({ paidAt: sample.paidAt, payments: [{ status: 'CAPTURED' }] }), true);
assert.equal(isInvoiceEligible({ paidAt: null, payments: [{ status: 'PENDING' }] }), false);
const dto = toInvoicePreviewDto(sample);
assert.equal(dto.invoiceNumber, 'INV-TEST-1');
assert.equal(dto.totalPaise, 129900);
assert.equal(typeof dto.issuedAt, 'string');
console.log('order-invoice check ok');
