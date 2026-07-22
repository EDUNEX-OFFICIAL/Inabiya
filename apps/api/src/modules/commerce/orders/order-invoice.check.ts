import assert from 'node:assert/strict';
import {
  formatInvoiceInr,
  formatInvoiceInrPdf,
  isInvoiceEligible,
  renderInvoiceHtml,
  renderInvoicePdf,
  asInvoiceAddress,
  toInvoicePreviewDto,
} from './order-invoice';

assert.equal(formatInvoiceInr(189800), '₹1,898');
assert.equal(formatInvoiceInrPdf(189800), 'INR 1,898');
assert.equal(isInvoiceEligible({ paidAt: new Date(), payments: [] }), true);
assert.equal(isInvoiceEligible({ paidAt: null, payments: [{ status: 'PENDING' }] }), false);
assert.equal(isInvoiceEligible({ paidAt: null, payments: [{ status: 'CAPTURED' }] }), true);

const sample = {
  invoiceNumber: 'INV-INB-TEST-001',
  orderNumber: 'INB-TEST-001',
  issuedAt: new Date('2026-07-22T06:00:00Z'),
  paidAt: new Date('2026-07-22T06:00:00Z'),
  status: 'PAID',
  customerEmail: 'test@example.com',
  customerName: 'Test Customer',
  shippingAddress: {
    fullName: 'Test Customer',
    line1: '1 Soft Lane',
    city: 'Mumbai',
    state: 'MH',
    postalCode: '400001',
  },
  billingAddress: null,
  items: [
    {
      title: 'Expecting Mom Calm Kit',
      label: 'Kit',
      sku: 'MOM-001',
      quantity: 1,
      unitPricePaise: 179900,
      lineTotalPaise: 179900,
    },
  ],
  subtotalPaise: 179900,
  discountPaise: 0,
  shippingPaise: 9900,
  taxPaise: 0,
  totalPaise: 189800,
  shippingMethod: 'STANDARD',
  couponCode: null,
  paymentProvider: 'mock',
  paymentStatus: 'CAPTURED',
};

const html = renderInvoiceHtml(sample);
assert.match(html, /INV-INB-TEST-001/);
assert.match(html, /Expecting Mom Calm Kit/);
assert.match(html, /₹1,898/);
assert.doesNotMatch(html, /<script/);

const dto = toInvoicePreviewDto(sample);
assert.equal(dto.invoiceNumber, 'INV-INB-TEST-001');
assert.equal(typeof dto.issuedAt, 'string');

const addr = asInvoiceAddress({ fullName: 'A', line1: 'B', city: 'C', state: 'D', postalCode: '1' });
assert.equal(addr?.fullName, 'A');
assert.equal(asInvoiceAddress(null), null);

void (async () => {
  const pdf = await renderInvoicePdf(sample);
  assert.ok(pdf.length > 500);
  assert.equal(pdf.subarray(0, 4).toString('utf8'), '%PDF');
  console.log('order-invoice checks ok');
})();
