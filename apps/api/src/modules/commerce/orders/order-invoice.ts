/** Pure helpers for commerce order invoices (HTML preview + PDF download). */

import PDFDocument from 'pdfkit';

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
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

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
  const paid = inv.paidAt
    ? inv.paidAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : null;
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
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const leftX = 48;
    const rightEdge = pageW - 48;
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
    const paid = inv.paidAt ? inv.paidAt.toLocaleString('en-IN', dateOpts) : '—';

    const payment =
      !inv.paymentProvider || inv.paymentProvider === 'mock'
        ? `Online payment${inv.paymentStatus ? ` | ${inv.paymentStatus}` : ''}`
        : `${inv.paymentProvider}${inv.paymentStatus ? ` | ${inv.paymentStatus}` : ''}`;

    const shipMethod =
      inv.shippingMethod === 'STANDARD'
        ? 'Standard delivery'
        : inv.shippingMethod === 'EXPRESS'
          ? 'Express delivery'
          : inv.shippingMethod.replaceAll('_', ' ');

    // Header
    doc.fillColor('#FF6B9D').fontSize(24).font('Helvetica-Bold').text('Inabiya', leftX, 48);
    doc
      .fillColor('#666666')
      .fontSize(8)
      .font('Helvetica')
      .text('Thoughtfully personalised baby gifts', leftX, 76);

    doc
      .fillColor('#FF6B9D')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('TAX INVOICE', leftX, 48, { width: contentW, align: 'right' });
    doc
      .fillColor('#2d2430')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(pdfText(inv.invoiceNumber), leftX, 62, { width: contentW, align: 'right' });
    doc
      .fillColor('#FF6B9D')
      .fontSize(8)
      .font('Helvetica')
      .text(pdfText(inv.status.replaceAll('_', ' ')), leftX, 78, {
        width: contentW,
        align: 'right',
      });

    doc
      .moveTo(leftX, 96)
      .lineTo(rightEdge, 96)
      .strokeColor('#e8dfe4')
      .lineWidth(1)
      .stroke();

    // Meta row
    let y = 110;
    const metaCols = [
      { label: 'ORDER', value: inv.orderNumber },
      { label: 'ISSUED', value: issued },
      { label: 'PAID', value: paid },
      { label: 'PAYMENT', value: payment },
    ];
    const metaW = contentW / 4;
    metaCols.forEach((m, i) => {
      const x = leftX + i * metaW;
      doc.fillColor('#999999').fontSize(7).font('Helvetica-Bold').text(m.label, x, y);
      doc
        .fillColor('#2d2430')
        .fontSize(8)
        .font('Helvetica')
        .text(pdfText(m.value), x, y + 12, { width: metaW - 8 });
    });

    y = 150;

    // Three party boxes
    const boxGap = 10;
    const boxW = (contentW - boxGap * 2) / 3;
    const boxes = [
      {
        title: 'BILL TO',
        lines: [inv.customerName ?? inv.customerEmail, inv.customerEmail],
      },
      {
        title: 'SHIP TO',
        lines: [...formatAddressLines(inv.shippingAddress), shipMethod],
      },
      {
        title: 'BILLING',
        lines: formatAddressLines(inv.billingAddress ?? inv.shippingAddress),
      },
    ];

    let maxBoxH = 0;
    boxes.forEach((box, i) => {
      const x = leftX + i * (boxW + boxGap);
      const linesH = box.lines.length * 11 + 28;
      maxBoxH = Math.max(maxBoxH, linesH);
      doc.roundedRect(x, y, boxW, linesH, 4).strokeColor('#eee6ea').lineWidth(0.8).stroke();
      doc.fillColor('#999999').fontSize(7).font('Helvetica-Bold').text(box.title, x + 8, y + 8);
      let ly = y + 22;
      box.lines.forEach((line, li) => {
        doc
          .fillColor('#2d2430')
          .fontSize(li === 0 ? 9 : 8)
          .font(li === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .text(pdfText(line), x + 8, ly, { width: boxW - 16 });
        ly += 11;
      });
    });

    y += maxBoxH + 22;

    // Table header
    const colItem = leftX;
    const colQty = leftX + contentW - 200;
    const colPrice = leftX + contentW - 140;
    const colAmt = leftX + contentW - 70;

    doc.fillColor('#999999').fontSize(7).font('Helvetica-Bold');
    doc.text('ITEM', colItem, y);
    doc.text('QTY', colQty, y, { width: 40, align: 'center' });
    doc.text('PRICE', colPrice, y, { width: 55, align: 'right' });
    doc.text('AMOUNT', colAmt, y, { width: 70, align: 'right' });
    y += 12;
    doc
      .moveTo(leftX, y)
      .lineTo(rightEdge, y)
      .strokeColor('#d9cfd5')
      .lineWidth(1.2)
      .stroke();
    y += 8;

    for (const item of inv.items) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 48;
      }
      const startY = y;
      doc
        .fillColor('#2d2430')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(pdfText(`${item.title} (${item.label})`), colItem, startY, { width: colQty - colItem - 8 });
      const afterTitle = doc.y;
      doc
        .fillColor('#999999')
        .fontSize(7)
        .font('Helvetica')
        .text(pdfText(`SKU ${item.sku}`), colItem, afterTitle, { width: colQty - colItem - 8 });
      const rowBottom = doc.y;
      doc
        .fillColor('#2d2430')
        .fontSize(9)
        .font('Helvetica')
        .text(String(item.quantity), colQty, startY, { width: 40, align: 'center' });
      doc.text(formatInvoiceInrPdf(item.unitPricePaise), colPrice, startY, {
        width: 55,
        align: 'right',
      });
      doc
        .font('Helvetica-Bold')
        .text(formatInvoiceInrPdf(item.lineTotalPaise), colAmt, startY, {
          width: 70,
          align: 'right',
        });
      y = rowBottom + 10;
      doc
        .moveTo(leftX, y - 4)
        .lineTo(rightEdge, y - 4)
        .strokeColor('#f0e8ec')
        .lineWidth(0.5)
        .stroke();
    }

    y += 8;
    const totalsX = leftX + contentW - 200;
    const drawTotal = (label: string, value: string, bold = false) => {
      doc
        .fillColor(bold ? '#2d2430' : '#666666')
        .fontSize(bold ? 11 : 9)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(label, totalsX, y);
      doc
        .fillColor(bold ? '#FF6B9D' : '#2d2430')
        .text(value, totalsX + 80, y, { width: 120, align: 'right' });
      y += bold ? 18 : 14;
    };

    doc
      .moveTo(totalsX, y)
      .lineTo(rightEdge, y)
      .strokeColor('#e8dfe4')
      .lineWidth(0.8)
      .stroke();
    y += 10;

    drawTotal('Subtotal', formatInvoiceInrPdf(inv.subtotalPaise));
    if (inv.discountPaise > 0) {
      drawTotal(
        inv.couponCode ? `Discount (${pdfText(inv.couponCode)})` : 'Discount',
        `-${formatInvoiceInrPdf(inv.discountPaise)}`,
      );
    }
    drawTotal('Shipping', formatInvoiceInrPdf(inv.shippingPaise));
    if (inv.taxPaise > 0) drawTotal('Tax', formatInvoiceInrPdf(inv.taxPaise));
    y += 2;
    doc
      .moveTo(totalsX, y)
      .lineTo(rightEdge, y)
      .strokeColor('#d9cfd5')
      .lineWidth(1.2)
      .stroke();
    y += 8;
    drawTotal('Total', formatInvoiceInrPdf(inv.totalPaise), true);

    y += 20;
    doc
      .moveTo(leftX, y)
      .lineTo(rightEdge, y)
      .strokeColor('#eee6ea')
      .lineWidth(0.6)
      .stroke();
    y += 12;
    doc.fillColor('#888888').fontSize(8).font('Helvetica');
    doc.text(
      'This is a computer-generated tax invoice / payment receipt for your Inabiya order.',
      leftX,
      y,
      { width: contentW },
    );
    doc.text('Support: hello@inabiya.in', leftX, y + 12, { width: contentW });

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
