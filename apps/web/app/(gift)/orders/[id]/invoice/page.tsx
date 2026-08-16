'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, LoaderCircle, Printer } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
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
        <p className="text-body text-danger">{error}</p>
        <Link href={`/orders/${params.id}`} className="gift-link mt-gs-4 inline-block text-body">
          ← Back to order
        </Link>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="mx-auto max-w-[720px] px-gs-4 py-gs-8 text-body opacity-70">
        Loading invoice…
      </main>
    );
  }

  const bill = invoice.billingAddress ?? invoice.shippingAddress;
  const shipLines = formatAddress(invoice.shippingAddress);
  const billLines = formatAddress(bill);
  const statusLabel = invoice.status.replaceAll('_', ' ');

  return (
    <main className="invoice-sheet mx-auto max-w-[920px] px-gs-3 py-gs-4 sm:px-gs-6 sm:py-gs-8">
      <div className="invoice-actions mb-gs-4 flex flex-wrap items-center justify-between gap-gs-3 print:hidden">
        <Link
          href={`/orders/${params.id}`}
          className="gift-link inline-flex items-center gap-gs-2 text-body"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to order
        </Link>
        <div className="flex gap-gs-2">
          <button
            type="button"
            className="clay-btn-secondary inline-flex items-center gap-gs-2 text-body"
            onClick={() => window.print()}
          >
            <Printer aria-hidden="true" className="size-4" />
            Print
          </button>
          <button
            type="button"
            className="clay-btn inline-flex items-center gap-gs-2 text-body"
            disabled={busy}
            onClick={() => void downloadPdf()}
          >
            {busy ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Download aria-hidden="true" className="size-4" />
            )}
            {busy ? 'Downloading…' : 'Download PDF'}
          </button>
        </div>
      </div>
      {error ? <p className="mb-gs-3 text-body text-danger print:hidden">{error}</p> : null}

      <article className="invoice-doc overflow-hidden rounded-clay border border-border-subtle bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-primary via-[var(--inabiya-yellow)] to-[var(--inabiya-mint)] print:h-1" />
        <div className="p-gs-5 sm:p-gs-8">
          {/* Header */}
          <header className="flex items-start justify-between gap-gs-4">
            <div>
              <BrandLogo href={null} size="lg" />
              <p className="mt-gs-1 text-caption opacity-60">
                Thoughtfully personalised baby gifts
              </p>
            </div>
            <div className="text-right">
              <h1 className="font-display text-[clamp(1.35rem,4vw,2rem)] font-semibold leading-tight">
                Tax invoice
              </h1>
              <p className="mt-gs-1 font-mono text-caption opacity-65">{invoice.invoiceNumber}</p>
              <p className="mt-gs-2 inline-flex items-center gap-gs-1 rounded-pill bg-primary/10 px-gs-3 py-gs-1 text-caption font-semibold uppercase tracking-wide text-primary">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                {statusLabel}
              </p>
            </div>
          </header>

          {/* Meta */}
          <dl className="invoice-meta mt-gs-6 grid grid-cols-2 gap-px overflow-hidden rounded-control border border-border-subtle bg-border-subtle text-body sm:grid-cols-4">
            <div>
              <dt className="text-caption font-semibold uppercase tracking-wide opacity-50">
                Order
              </dt>
              <dd className="mt-gs-1 font-medium">{invoice.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-caption font-semibold uppercase tracking-wide opacity-50">
                Issued
              </dt>
              <dd className="mt-gs-1">{formatDate(invoice.issuedAt)}</dd>
            </div>
            <div>
              <dt className="text-caption font-semibold uppercase tracking-wide opacity-50">
                Paid
              </dt>
              <dd className="mt-gs-1">{invoice.paidAt ? formatDate(invoice.paidAt) : '—'}</dd>
            </div>
            <div>
              <dt className="text-caption font-semibold uppercase tracking-wide opacity-50">
                Payment
              </dt>
              <dd className="mt-gs-1">
                {paymentLabel(invoice.paymentProvider, invoice.paymentStatus)}
              </dd>
            </div>
          </dl>

          {/* Parties */}
          <div className="mt-gs-6 grid gap-gs-3 sm:grid-cols-3">
            <section className="invoice-party invoice-party--customer rounded-control border border-border-subtle bg-surface-soft p-gs-4 text-body">
              <h2 className="text-caption font-semibold uppercase tracking-[0.08em] text-primary">
                Bill to
              </h2>
              <p className="mt-gs-2 font-medium">{invoice.customerName ?? invoice.customerEmail}</p>
              {invoice.customerName ? (
                <p className="mt-gs-1 break-all text-caption opacity-70">{invoice.customerEmail}</p>
              ) : null}
            </section>
            <section className="invoice-party rounded-control border border-border-subtle p-gs-4 text-body">
              <h2 className="text-caption font-semibold uppercase tracking-[0.08em] opacity-50">
                Ship to
              </h2>
              <div className="mt-gs-2 space-y-gs-1 text-caption leading-relaxed opacity-90">
                {shipLines.map((l, i) => (
                  <p key={i} className={i === 0 ? 'font-medium text-body' : undefined}>
                    {l}
                  </p>
                ))}
              </div>
              <p className="mt-gs-2 text-caption opacity-55">
                {shippingLabel(invoice.shippingMethod)}
              </p>
            </section>
            <section className="invoice-party rounded-control border border-border-subtle p-gs-4 text-body">
              <h2 className="text-caption font-semibold uppercase tracking-[0.08em] opacity-50">
                Billing
              </h2>
              <div className="mt-gs-2 space-y-gs-1 text-caption leading-relaxed opacity-90">
                {billLines.map((l, i) => (
                  <p key={i} className={i === 0 ? 'font-medium text-body' : undefined}>
                    {l}
                  </p>
                ))}
              </div>
            </section>
          </div>

          {/* Line items table */}
          <div className="mt-gs-7">
            <div className="mb-gs-3 flex items-end justify-between">
              <h2 className="font-display text-xl font-semibold">Order items</h2>
              <p className="text-caption opacity-55">
                {invoice.items.length} {invoice.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <table className="invoice-items-table hidden w-full border-collapse text-body sm:table">
              <thead>
                <tr className="border-y border-border-subtle bg-surface-soft text-left text-caption font-semibold uppercase tracking-wide">
                  <th className="px-gs-3 py-gs-2 font-semibold">Item</th>
                  <th className="w-14 px-gs-2 py-gs-2 text-center font-semibold">Qty</th>
                  <th className="w-24 px-gs-2 py-gs-2 text-right font-semibold">Price</th>
                  <th className="w-28 px-gs-3 py-gs-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-border-subtle align-top">
                    <td className="px-gs-3 py-gs-3">
                      <p className="font-medium">
                        {item.title} <span className="font-normal opacity-60">({item.label})</span>
                      </p>
                      <p className="mt-gs-1 font-mono text-caption opacity-45">SKU {item.sku}</p>
                    </td>
                    <td className="py-3 px-gs-2 text-center tabular-nums">{item.quantity}</td>
                    <td className="py-3 px-gs-2 text-right tabular-nums whitespace-nowrap">
                      {formatInr(item.unitPricePaise)}
                    </td>
                    <td className="px-gs-3 py-gs-3 text-right font-semibold tabular-nums whitespace-nowrap">
                      {formatInr(item.lineTotalPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-items-mobile divide-y divide-border-subtle rounded-control border border-border-subtle sm:hidden">
              {invoice.items.map((item, i) => (
                <div key={i} className="p-gs-3">
                  <div className="flex items-start justify-between gap-gs-3">
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-gs-1 text-caption opacity-60">{item.label}</p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">
                      {formatInr(item.lineTotalPaise)}
                    </p>
                  </div>
                  <div className="mt-gs-3 flex items-center justify-between text-caption opacity-60">
                    <span className="font-mono">SKU {item.sku}</span>
                    <span>
                      {item.quantity} × {formatInr(item.unitPricePaise)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="mt-gs-4 flex justify-end">
            <table className="invoice-totals w-full rounded-control bg-surface-soft px-gs-4 py-gs-3 text-body sm:max-w-[300px]">
              <tbody>
                <tr>
                  <td className="px-gs-4 pt-gs-3 opacity-70">Subtotal</td>
                  <td className="px-gs-4 pt-gs-3 text-right tabular-nums">
                    {formatInr(invoice.subtotalPaise)}
                  </td>
                </tr>
                {invoice.discountPaise > 0 ? (
                  <tr>
                    <td className="px-gs-4 py-gs-1 opacity-70">
                      Discount{invoice.couponCode ? ` (${invoice.couponCode})` : ''}
                    </td>
                    <td className="px-gs-4 py-gs-1 text-right tabular-nums">
                      −{formatInr(invoice.discountPaise)}
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td className="px-gs-4 py-gs-1 opacity-70">Shipping</td>
                  <td className="px-gs-4 py-gs-1 text-right tabular-nums">
                    {formatInr(invoice.shippingPaise)}
                  </td>
                </tr>
                {invoice.taxPaise > 0 ? (
                  <tr>
                    <td className="px-gs-4 py-gs-1 opacity-70">Tax</td>
                    <td className="px-gs-4 py-gs-1 text-right tabular-nums">
                      {formatInr(invoice.taxPaise)}
                    </td>
                  </tr>
                ) : null}
                <tr className="border-t-2 border-border-strong">
                  <td className="px-gs-4 pb-gs-3 pt-gs-3 text-body font-semibold">Total paid</td>
                  <td className="px-gs-4 pb-gs-3 pt-gs-3 text-right text-lg font-semibold tabular-nums text-primary">
                    {formatInr(invoice.totalPaise)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer className="mt-gs-8 flex flex-col gap-gs-2 border-t border-border-subtle pt-gs-4 text-caption opacity-55 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md">
              This is a computer-generated tax invoice and payment receipt for your Inabiya order.
            </p>
            <p className="shrink-0">
              <a href="mailto:hello@inabiya.in" className="underline underline-offset-2">
                hello@inabiya.in
              </a>
            </p>
          </footer>
        </div>
      </article>
    </main>
  );
}
