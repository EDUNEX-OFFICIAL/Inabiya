/** Pure helpers for commerce order invoices (HTML preview + PDF download). */

import PDFDocument from 'pdfkit';
import type { InvoiceLegalProfile } from '@inabiya/validation';

export type InvoiceAddress = {
  fullName?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string | null;
};

export type InvoiceLine = {
  title: string;
  label: string;
  sku: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
};

export type InvoiceInput = {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: Date;
  paidAt: Date | null;
  status: string;
  customerEmail: string;
  customerName: string | null;
  shippingAddress: InvoiceAddress | null;
  billingAddress: InvoiceAddress | null;
  items: InvoiceLine[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  shippingMethod: string;
  couponCode: string | null;
  paymentProvider: string | null;
  paymentStatus: string | null;
  legalProfile: InvoiceLegalProfile;
};

/** JSON DTO for storefront invoice preview. */
export type InvoicePreviewDto = {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: string;
  paidAt: string | null;
  status: string;
  customerEmail: string;
  customerName: string | null;
  shippingAddress: InvoiceAddress | null;
  billingAddress: InvoiceAddress | null;
  items: InvoiceLine[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  shippingMethod: string;
  couponCode: string | null;
  paymentProvider: string | null;
  paymentStatus: string | null;
  legalProfile: InvoiceLegalProfile;
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function sampleInvoiceNumber(orderNumber: string): string {
  return `SMP/26/${orderNumber
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-9)
    .toUpperCase()}`;
}

export function formatInvoiceInr(paise: number): string {
  return INR.format(Math.round(paise / 100));
}

/** Helvetica-safe money line for PDF (WinAnsi). */
export function formatInvoiceInrPdf(paise: number): string {
  return `INR ${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export function isInvoiceEligible(input: {
  paidAt: Date | null;
  payments: Array<{ status: string }>;
}): boolean {
  if (input.paidAt != null) return true;
  return input.payments.some((p) => p.status === 'CAPTURED' || p.status === 'REFUNDED');
}

export function toInvoicePreviewDto(inv: InvoiceInput): InvoicePreviewDto {
  return {
    invoiceNumber: inv.invoiceNumber,
    orderNumber: inv.orderNumber,
    issuedAt: inv.issuedAt.toISOString(),
    paidAt: inv.paidAt?.toISOString() ?? null,
    status: inv.status,
    customerEmail: inv.customerEmail,
    customerName: inv.customerName,
    shippingAddress: inv.shippingAddress,
    billingAddress: inv.billingAddress,
    items: inv.items,
    subtotalPaise: inv.subtotalPaise,
    discountPaise: inv.discountPaise,
    shippingPaise: inv.shippingPaise,
    taxPaise: inv.taxPaise,
    totalPaise: inv.totalPaise,
    shippingMethod: inv.shippingMethod,
    couponCode: inv.couponCode,
    paymentProvider: inv.paymentProvider,
    paymentStatus: inv.paymentStatus,
    legalProfile: inv.legalProfile,
  };
}

function esc(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatAddressHtml(a: InvoiceAddress | null): string {
  if (!a) return '—';
  const lines = [
    a.fullName,
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(', '),
    a.phone ? `Phone: ${a.phone}` : null,
  ].filter(Boolean) as string[];
  return lines.map(esc).join('<br/>');
}

function formatAddressLines(a: InvoiceAddress | null): string[] {
  if (!a) return ['—'];
  return [
    a.fullName,
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(', '),
    a.phone ? `Phone: ${a.phone}` : null,
  ].filter(Boolean) as string[];
}

/** Strip chars Helvetica/WinAnsi cannot draw. */
function pdfText(s: string): string {
  return s
    .replaceAll('₹', 'Rs ')
    .replaceAll('–', '-')
    .replaceAll('—', '-')
    .replaceAll('·', '|')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?');
}

export function renderInvoiceHtml(inv: InvoiceInput): string {
  const issued = inv.issuedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const paid = inv.paidAt ? inv.paidAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null;
  const rows = inv.items
    .map(
      (i) => `<tr>
      <td>${esc(i.title)} <span class="muted">(${esc(i.label)})</span><br/><span class="muted">SKU ${esc(i.sku)}</span></td>
      <td class="num">${i.quantity}</td>
      <td class="num">${formatInvoiceInr(i.unitPricePaise)}</td>
      <td class="num">${formatInvoiceInr(i.lineTotalPaise)}</td>
    </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${esc(inv.invoiceNumber)} — Inabiya</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: "Plus Jakarta Sans", system-ui, sans-serif; color: #2d2430; margin: 0; padding: 32px; background: #fff; }
    h1 { font-family: Fraunces, Georgia, serif; font-weight: 600; font-size: 28px; margin: 0 0 4px; color: #ff6b9d; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; margin: 24px 0 8px; opacity: 0.7; }
    .meta { font-size: 13px; line-height: 1.5; opacity: 0.85; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #f0e6eb; vertical-align: top; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.6; }
    .num { text-align: right; white-space: nowrap; }
    .muted { opacity: 0.65; font-size: 12px; }
    .totals { margin-top: 16px; margin-left: auto; width: 260px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { font-weight: 700; font-size: 16px; border-top: 1px solid #f0e6eb; margin-top: 8px; padding-top: 10px; }
    .foot { margin-top: 40px; font-size: 12px; opacity: 0.65; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Inabiya</h1>
    <p class="meta">Tax invoice / payment receipt</p>
  </header>
  <div class="grid">
    <div class="meta">
      <strong>Invoice</strong> ${esc(inv.invoiceNumber)}<br/>
      Order ${esc(inv.orderNumber)}<br/>
      Issued ${esc(issued)}<br/>
      ${paid ? `Paid ${esc(paid)}<br/>` : ''}
      Status ${esc(inv.status.replaceAll('_', ' '))}<br/>
      ${inv.paymentProvider ? `Payment ${esc(inv.paymentProvider)} · ${esc(inv.paymentStatus ?? '')}` : ''}
    </div>
    <div class="meta">
      <strong>Bill to</strong><br/>
      ${esc(inv.customerName ?? inv.customerEmail)}<br/>
      ${esc(inv.customerEmail)}
    </div>
  </div>
  <div class="grid">
    <div class="meta">
      <h2>Ship to</h2>
      ${formatAddressHtml(inv.shippingAddress)}
      <p class="muted" style="margin-top:8px">Method: ${esc(inv.shippingMethod)}</p>
    </div>
    <div class="meta">
      <h2>Billing</h2>
      ${formatAddressHtml(inv.billingAddress ?? inv.shippingAddress)}
    </div>
  </div>
  <h2>Items</h2>
  <table>
    <thead>
      <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatInvoiceInr(inv.subtotalPaise)}</span></div>
    ${inv.discountPaise > 0 ? `<div><span>Discount${inv.couponCode ? ` (${esc(inv.couponCode)})` : ''}</span><span>−${formatInvoiceInr(inv.discountPaise)}</span></div>` : ''}
    <div><span>Shipping</span><span>${formatInvoiceInr(inv.shippingPaise)}</span></div>
    ${inv.taxPaise > 0 ? `<div><span>Tax</span><span>${formatInvoiceInr(inv.taxPaise)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${formatInvoiceInr(inv.totalPaise)}</span></div>
  </div>
  <p class="foot">Thank you for gifting with Inabiya. This receipt confirms payment for the order above. For support, contact hello@inabiya.in.</p>
</body>
</html>`;
}

export function renderInvoicePdf(inv: InvoiceInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 42 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const leftX = 42;
    const rightEdge = doc.page.width - 42;
    const contentW = rightEdge - leftX;
    const dateOpts: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    };
    const issued = inv.issuedAt.toLocaleString('en-IN', dateOpts);
    const payment =
      !inv.paymentProvider || inv.paymentProvider === 'mock'
        ? `Online payment${inv.paymentStatus ? ` | ${inv.paymentStatus}` : ''}`
        : `${inv.paymentProvider}${inv.paymentStatus ? ` | ${inv.paymentStatus}` : ''}`;
    const bill = inv.billingAddress ?? inv.shippingAddress;
    const supplier = inv.legalProfile;
    const placeOfSupply = bill?.state
      ? `${bill.state}${bill.postalCode ? ` (${bill.postalCode})` : ''}`
      : 'Not provided';
    const taxablePaise = Math.max(0, inv.subtotalPaise - inv.discountPaise);
    const taxRate = taxablePaise > 0 ? (inv.taxPaise / taxablePaise) * 100 : 0;
    const intraState = bill?.state?.trim().toLowerCase() === supplier.state.toLowerCase();
    const cgstPaise = intraState ? Math.round(inv.taxPaise / 2) : 0;
    const sgstPaise = intraState ? inv.taxPaise - cgstPaise : 0;
    const igstPaise = intraState ? 0 : inv.taxPaise;
    const invoiceNo = sampleInvoiceNumber(inv.orderNumber);

    doc.rect(leftX, 42, contentW, 18).strokeColor('#000000').lineWidth(0.8).stroke();
    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('SAMPLE - NOT VALID FOR TAX OR ACCOUNTING', leftX, 48, {
        width: contentW,
        align: 'center',
      });

    let y = 68;
    doc.font('Helvetica-Bold').fontSize(11).text(supplier.legalName, leftX, y);
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(
        [
          supplier.addressLine1,
          supplier.addressLine2,
          supplier.city,
          supplier.state,
          supplier.postalCode,
        ]
          .filter(Boolean)
          .join(', '),
        leftX,
        y + 15,
      );
    doc.text(`GSTIN: ${supplier.gstin}`, leftX, y + 27);
    doc.text(`State: ${supplier.state} (${supplier.stateCode})`, leftX, y + 39);
    doc.font('Helvetica-Bold').fontSize(14).text('TAX INVOICE', leftX, y, {
      width: contentW,
      align: 'right',
    });
    doc
      .font('Helvetica')
      .fontSize(8)
      .text('Original for recipient', leftX, y + 18, {
        width: contentW,
        align: 'right',
      });
    y = 120;
    doc.moveTo(leftX, y).lineTo(rightEdge, y).strokeColor('#000000').lineWidth(0.8).stroke();

    const detailRows = [
      ['Invoice No.', invoiceNo, 'Invoice Date', issued],
      ['Order No.', inv.orderNumber, 'Payment', payment],
      ['Place of Supply', placeOfSupply, 'Reverse Charge', 'No'],
    ];
    const detailCol = contentW / 4;
    detailRows.forEach((row) => {
      row.forEach((value, i) => {
        doc
          .font(i % 2 === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .text(pdfText(value), leftX + i * detailCol + 5, y + 6, {
            width: detailCol - 10,
          });
      });
      y += 24;
      doc.moveTo(leftX, y).lineTo(rightEdge, y).strokeColor('#000000').lineWidth(0.35).stroke();
    });

    const partyW = contentW / 2;
    const partyTop = y;
    const billLines = [
      inv.customerName ?? inv.customerEmail,
      ...formatAddressLines(bill),
      `GSTIN/UIN: URP`,
    ];
    const shipLines = [
      ...formatAddressLines(inv.shippingAddress),
      `Delivery: ${inv.shippingMethod.replaceAll('_', ' ')}`,
    ];
    const partyHeight = Math.max(billLines.length, shipLines.length) * 11 + 28;
    doc
      .moveTo(leftX + partyW, partyTop)
      .lineTo(leftX + partyW, partyTop + partyHeight)
      .strokeColor('#000000')
      .lineWidth(0.35)
      .stroke();
    [
      { title: 'BILL TO', lines: billLines, x: leftX },
      { title: 'SHIP TO', lines: shipLines, x: leftX + partyW },
    ].forEach((party) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(party.title, party.x + 5, partyTop + 6);
      party.lines.forEach((line, i) => {
        doc
          .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .text(pdfText(line), party.x + 5, partyTop + 20 + i * 11, { width: partyW - 10 });
      });
    });
    y += partyHeight;
    doc.moveTo(leftX, y).lineTo(rightEdge, y).strokeColor('#000000').lineWidth(0.8).stroke();

    const cols = {
      item: leftX,
      hsn: leftX + 245,
      qty: leftX + 290,
      unit: leftX + 330,
      rate: leftX + 370,
      taxable: leftX + 440,
    };
    const drawTableHeader = () => {
      doc.font('Helvetica-Bold').fontSize(7);
      doc.text('DESCRIPTION OF GOODS', cols.item + 4, y + 6, { width: 235 });
      doc.text('HSN', cols.hsn, y + 6, { width: 40, align: 'center' });
      doc.text('QTY', cols.qty, y + 6, { width: 35, align: 'center' });
      doc.text('UNIT', cols.unit, y + 6, { width: 35, align: 'center' });
      doc.text('RATE', cols.rate, y + 6, { width: 65, align: 'right' });
      doc.text('TAXABLE', cols.taxable, y + 6, {
        width: rightEdge - cols.taxable - 4,
        align: 'right',
      });
      y += 22;
      doc.moveTo(leftX, y).lineTo(rightEdge, y).strokeColor('#000000').lineWidth(0.8).stroke();
    };
    drawTableHeader();

    inv.items.forEach((item) => {
      if (y > doc.page.height - 170) {
        doc.addPage();
        y = 42;
        drawTableHeader();
      }
      const rowTop = y;
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(pdfText(item.title), cols.item + 4, rowTop + 6, { width: 235 });
      doc
        .font('Helvetica')
        .fontSize(7)
        .text(pdfText(`${item.label} | SKU ${item.sku}`), cols.item + 4, doc.y + 2, {
          width: 235,
        });
      const rowHeight = Math.max(34, doc.y - rowTop + 7);
      doc.font('Helvetica').fontSize(8);
      doc.text(supplier.defaultHsn, cols.hsn, rowTop + 6, { width: 40, align: 'center' });
      doc.text(String(item.quantity), cols.qty, rowTop + 6, { width: 35, align: 'center' });
      doc.text('PCS', cols.unit, rowTop + 6, { width: 35, align: 'center' });
      doc.text(formatInvoiceInrPdf(item.unitPricePaise), cols.rate, rowTop + 6, {
        width: 65,
        align: 'right',
      });
      doc.text(formatInvoiceInrPdf(item.lineTotalPaise), cols.taxable, rowTop + 6, {
        width: rightEdge - cols.taxable - 4,
        align: 'right',
      });
      y = rowTop + rowHeight;
      doc.moveTo(leftX, y).lineTo(rightEdge, y).strokeColor('#000000').lineWidth(0.35).stroke();
    });

    const totalsX = leftX + contentW - 220;
    const totalRows: Array<[string, string, boolean?]> = [
      ['Subtotal', formatInvoiceInrPdf(inv.subtotalPaise)],
      ...(inv.discountPaise > 0
        ? ([['Discount', `-${formatInvoiceInrPdf(inv.discountPaise)}`]] as Array<[string, string]>)
        : []),
      ['Taxable value', formatInvoiceInrPdf(taxablePaise)],
      ...(intraState
        ? ([
            [`CGST @ ${(taxRate / 2).toFixed(2)}%`, formatInvoiceInrPdf(cgstPaise)],
            [`SGST @ ${(taxRate / 2).toFixed(2)}%`, formatInvoiceInrPdf(sgstPaise)],
          ] as Array<[string, string]>)
        : ([[`IGST @ ${taxRate.toFixed(2)}%`, formatInvoiceInrPdf(igstPaise)]] as Array<
            [string, string]
          >)),
      ['Shipping', formatInvoiceInrPdf(inv.shippingPaise)],
      ['INVOICE TOTAL', formatInvoiceInrPdf(inv.totalPaise), true],
    ];
    totalRows.forEach(([label, value, bold]) => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 9 : 8)
        .text(label, totalsX, y + 6, { width: 100, align: 'right' });
      doc.text(value, totalsX + 108, y + 6, { width: 112, align: 'right' });
      y += bold ? 20 : 16;
      if (bold) {
        doc
          .moveTo(totalsX, y - 20)
          .lineTo(rightEdge, y - 20)
          .strokeColor('#000000')
          .lineWidth(0.8)
          .stroke();
      }
    });

    y += 12;
    doc.moveTo(leftX, y).lineTo(rightEdge, y).strokeColor('#000000').lineWidth(0.8).stroke();
    doc
      .font('Helvetica')
      .fontSize(7)
      .text(
        'Declaration: Sample particulars only. Tax is not payable under reverse charge.',
        leftX,
        y + 8,
        { width: contentW - 180 },
      );
    doc.font('Helvetica-Bold').text(`For ${supplier.legalName}`, rightEdge - 180, y + 8, {
      width: 180,
      align: 'center',
    });
    doc.font('Helvetica').text('Authorised Signatory', rightEdge - 180, y + 48, {
      width: 180,
      align: 'center',
    });
    y += 68;
    doc.moveTo(leftX, y).lineTo(rightEdge, y).strokeColor('#000000').lineWidth(0.8).stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(
        'SAMPLE DATA ONLY - replace supplier, GSTIN, HSN and tax configuration before use.',
        leftX,
        y + 7,
        { width: contentW },
      );

    doc.end();
  });
}

export function asInvoiceAddress(value: unknown): InvoiceAddress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  return {
    fullName: typeof o.fullName === 'string' ? o.fullName : undefined,
    line1: typeof o.line1 === 'string' ? o.line1 : undefined,
    line2: typeof o.line2 === 'string' ? o.line2 : null,
    city: typeof o.city === 'string' ? o.city : undefined,
    state: typeof o.state === 'string' ? o.state : undefined,
    postalCode: typeof o.postalCode === 'string' ? o.postalCode : undefined,
    phone: typeof o.phone === 'string' ? o.phone : null,
  };
}
