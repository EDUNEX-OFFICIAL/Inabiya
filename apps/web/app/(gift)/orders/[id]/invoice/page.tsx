'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, apiAuthDownload, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/cart-client';

type Address = {
  fullName?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string | null;
};

type Invoice = {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: string;
  paidAt: string | null;
  status: string;
  customerEmail: string;
  customerName: string | null;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  items: Array<{
    title: string;
    label: string;
    sku: string;
    quantity: number;
    unitPricePaise: number;
    lineTotalPaise: number;
  }>;
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

const DATE_FMT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', DATE_FMT);
}

function formatAddress(a: Address | null | undefined): string[] {
  if (!a) return ['—'];
  return [
    a.fullName,
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(', '),
    a.phone ? `Ph: ${a.phone}` : null,
  ].filter(Boolean) as string[];
}

function paymentLabel(provider: string | null, status: string | null): string {
  if (!provider && !status) return '—';
  const p =
    !provider || provider === 'mock'
      ? 'Online payment'
      : provider.charAt(0).toUpperCase() + provider.slice(1);
  const s = status ? status.replaceAll('_', ' ') : '';
  return s ? `${p} · ${s}` : p;
}

function shippingLabel(method: string): string {
  const map: Record<string, string> = {
    STANDARD: 'Standard delivery',
    EXPRESS: 'Express delivery',
    PRIORITY: 'Priority delivery',
  };
  return map[method] ?? method.replaceAll('_', ' ');
}

export default function InvoicePreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(`/login?next=/orders/${params.id}/invoice`);
      return;
    }
    apiAuth<Invoice>(`/orders/me/${params.id}/invoice`)
      .then(setInvoice)
      .catch((e) => setError(e instanceof Error ? e.message : 'Invoice unavailable'));
  }, [params.id, router]);

  async function downloadPdf() {
    setBusy(true);
    setError(null);
    try {
      await apiAuthDownload(
        `/orders/me/${params.id}/invoice/pdf`,
        `inabiya-invoice-${invoice?.orderNumber ?? params.id}.pdf`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not download PDF');
    } finally {
      setBusy(false);
    }
  }

  if (error && !invoice) {
    return (
      <main className="mx-auto max-w-[720px] px-gs-4 py-gs-8">
        <p className="text-sm text-danger">{error}</p>
        <Link href={`/orders/${params.id}`} className="gift-link mt-gs-4 inline-block text-sm">
          ← Back to order
        </Link>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="mx-auto max-w-[720px] px-gs-4 py-gs-8 text-sm opacity-70">
        Loading invoice…
      </main>
    );
  }

  const bill = invoice.billingAddress ?? invoice.shippingAddress;
  const shipLines = formatAddress(invoice.shippingAddress);
  const billLines = formatAddress(bill);

  return (
    <main className="invoice-sheet mx-auto max-w-[720px] px-gs-3 py-gs-4 sm:px-gs-6 sm:py-gs-6">
      <div className="mb-gs-4 flex flex-wrap items-center justify-between gap-gs-3 print:hidden">
        <Link href={`/orders/${params.id}`} className="gift-link text-sm">
          ← Back to order
        </Link>
        <div className="flex flex-wrap gap-gs-2">
          <button type="button" className="clay-btn-secondary text-sm" onClick={() => window.print()}>
            Print
          </button>
          <button
            type="button"
            className="clay-btn text-sm"
            disabled={busy}
            onClick={() => void downloadPdf()}
          >
            {busy ? 'Downloading…' : 'Download PDF'}
          </button>
        </div>
      </div>
      {error ? <p className="mb-gs-3 text-sm text-danger print:hidden">{error}</p> : null}

      <article className="invoice-doc rounded-clay border border-[rgba(45,36,48,0.08)] bg-white p-gs-5 shadow-sm sm:p-gs-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-gs-4 border-b border-[rgba(45,36,48,0.1)] pb-gs-5">
          <div>
            <p className="font-display text-2xl tracking-tight text-primary sm:text-3xl">Inabiya</p>
            <p className="mt-1 text-xs opacity-60">Thoughtfully personalised baby gifts</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Tax invoice
            </p>
            <p className="mt-1 font-mono text-sm font-medium">{invoice.invoiceNumber}</p>
            <p className="mt-2 inline-flex rounded-full bg-[rgba(255,107,157,0.12)] px-2.5 py-0.5 text-xs font-medium text-primary">
              {invoice.status.replaceAll('_', ' ')}
            </p>
          </div>
        </header>

        {/* Meta */}
        <dl className="mt-gs-5 grid grid-cols-2 gap-x-gs-4 gap-y-gs-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide opacity-50">Order</dt>
            <dd className="mt-0.5 font-medium">{invoice.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide opacity-50">Issued</dt>
            <dd className="mt-0.5">{formatDate(invoice.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide opacity-50">Paid</dt>
            <dd className="mt-0.5">{invoice.paidAt ? formatDate(invoice.paidAt) : '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide opacity-50">Payment</dt>
            <dd className="mt-0.5">
              {paymentLabel(invoice.paymentProvider, invoice.paymentStatus)}
            </dd>
          </div>
        </dl>

        {/* Parties */}
        <div className="mt-gs-6 grid gap-gs-3 sm:grid-cols-3">
          <section className="rounded-lg border border-[rgba(45,36,48,0.08)] bg-[rgba(255,247,250,0.6)] p-gs-3 text-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide opacity-50">Bill to</h2>
            <p className="mt-gs-2 font-medium">{invoice.customerName ?? invoice.customerEmail}</p>
            <p className="mt-0.5 text-xs opacity-70">{invoice.customerEmail}</p>
          </section>
          <section className="rounded-lg border border-[rgba(45,36,48,0.08)] p-gs-3 text-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide opacity-50">Ship to</h2>
            <div className="mt-gs-2 space-y-0.5 text-xs leading-relaxed opacity-90">
              {shipLines.map((l, i) => (
                <p key={i} className={i === 0 ? 'font-medium text-sm' : undefined}>
                  {l}
                </p>
              ))}
            </div>
            <p className="mt-gs-2 text-[11px] opacity-55">{shippingLabel(invoice.shippingMethod)}</p>
          </section>
          <section className="rounded-lg border border-[rgba(45,36,48,0.08)] p-gs-3 text-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide opacity-50">Billing</h2>
            <div className="mt-gs-2 space-y-0.5 text-xs leading-relaxed opacity-90">
              {billLines.map((l, i) => (
                <p key={i} className={i === 0 ? 'font-medium text-sm' : undefined}>
                  {l}
                </p>
              ))}
            </div>
          </section>
        </div>

        {/* Line items table */}
        <div className="mt-gs-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[rgba(45,36,48,0.12)] text-left text-[10px] font-semibold uppercase tracking-wide opacity-50">
                <th className="pb-2 pr-2 font-semibold">Item</th>
                <th className="pb-2 px-2 text-center font-semibold w-14">Qty</th>
                <th className="pb-2 px-2 text-right font-semibold w-24">Price</th>
                <th className="pb-2 pl-2 text-right font-semibold w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-[rgba(45,36,48,0.06)] align-top">
                  <td className="py-3 pr-2">
                    <p className="font-medium">
                      {item.title}{' '}
                      <span className="font-normal opacity-60">({item.label})</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] opacity-45">SKU {item.sku}</p>
                  </td>
                  <td className="py-3 px-2 text-center tabular-nums">{item.quantity}</td>
                  <td className="py-3 px-2 text-right tabular-nums whitespace-nowrap">
                    {formatInr(item.unitPricePaise)}
                  </td>
                  <td className="py-3 pl-2 text-right font-medium tabular-nums whitespace-nowrap">
                    {formatInr(item.lineTotalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-gs-4 flex justify-end">
          <table className="w-full max-w-[260px] text-sm">
            <tbody>
              <tr>
                <td className="py-1 opacity-70">Subtotal</td>
                <td className="py-1 text-right tabular-nums">{formatInr(invoice.subtotalPaise)}</td>
              </tr>
              {invoice.discountPaise > 0 ? (
                <tr>
                  <td className="py-1 opacity-70">
                    Discount{invoice.couponCode ? ` (${invoice.couponCode})` : ''}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    −{formatInr(invoice.discountPaise)}
                  </td>
                </tr>
              ) : null}
              <tr>
                <td className="py-1 opacity-70">Shipping</td>
                <td className="py-1 text-right tabular-nums">{formatInr(invoice.shippingPaise)}</td>
              </tr>
              {invoice.taxPaise > 0 ? (
                <tr>
                  <td className="py-1 opacity-70">Tax</td>
                  <td className="py-1 text-right tabular-nums">{formatInr(invoice.taxPaise)}</td>
                </tr>
              ) : null}
              <tr className="border-t-2 border-[rgba(45,36,48,0.12)]">
                <td className="pt-3 text-base font-semibold">Total</td>
                <td className="pt-3 text-right text-base font-semibold tabular-nums text-primary">
                  {formatInr(invoice.totalPaise)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer className="mt-gs-8 border-t border-[rgba(45,36,48,0.08)] pt-gs-4 text-xs opacity-55">
          <p>This is a computer-generated tax invoice / payment receipt for your Inabiya order.</p>
          <p className="mt-1">
            Questions?{' '}
            <a href="mailto:hello@inabiya.in" className="underline underline-offset-2">
              hello@inabiya.in
            </a>
          </p>
        </footer>
      </article>
    </main>
  );
}
