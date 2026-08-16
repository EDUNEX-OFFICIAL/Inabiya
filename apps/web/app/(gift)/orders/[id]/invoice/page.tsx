'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, LoaderCircle, Printer } from 'lucide-react';
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
  legalProfile: {
    legalName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    stateCode: string;
    postalCode: string;
    gstin: string;
    email: string;
    defaultHsn: string;
  };
};

const DATE_FMT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

function sampleInvoiceNumber(orderNumber: string): string {
  return `SMP/26/${orderNumber
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-9)
    .toUpperCase()}`;
}

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
  const supplier = invoice.legalProfile;
  const placeOfSupply = bill?.state
    ? `${bill.state}${bill.postalCode ? ` (${bill.postalCode})` : ''}`
    : 'Not provided';
  const taxablePaise = Math.max(0, invoice.subtotalPaise - invoice.discountPaise);
  const taxRate = taxablePaise > 0 ? (invoice.taxPaise / taxablePaise) * 100 : 0;
  const intraState = bill?.state?.trim().toLowerCase() === supplier.state.toLowerCase();
  const cgstPaise = intraState ? Math.round(invoice.taxPaise / 2) : 0;
  const sgstPaise = intraState ? invoice.taxPaise - cgstPaise : 0;
  const igstPaise = intraState ? 0 : invoice.taxPaise;
  const displayInvoiceNumber = sampleInvoiceNumber(invoice.orderNumber);

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

      <article className="invoice-doc invoice-legal bg-white">
        <p className="invoice-sample-banner">SAMPLE — NOT VALID FOR TAX OR ACCOUNTING</p>
        <header className="invoice-legal__header">
          <div>
            <p className="invoice-legal__supplier">{supplier.legalName}</p>
            <p>
              {[
                supplier.addressLine1,
                supplier.addressLine2,
                supplier.city,
                supplier.state,
                supplier.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p>GSTIN: {supplier.gstin}</p>
            <p>
              State: {supplier.state} ({supplier.stateCode})
            </p>
          </div>
          <div className="invoice-legal__title">
            <h1>TAX INVOICE</h1>
            <p>Original for recipient</p>
          </div>
        </header>

        <table className="invoice-legal__meta">
          <tbody>
            <tr>
              <th>Invoice No.</th>
              <td>{displayInvoiceNumber}</td>
              <th>Invoice Date</th>
              <td>{formatDate(invoice.issuedAt)}</td>
            </tr>
            <tr>
              <th>Order No.</th>
              <td>{invoice.orderNumber}</td>
              <th>Payment</th>
              <td>{paymentLabel(invoice.paymentProvider, invoice.paymentStatus)}</td>
            </tr>
            <tr>
              <th>Place of Supply</th>
              <td>{placeOfSupply}</td>
              <th>Reverse Charge</th>
              <td>No</td>
            </tr>
          </tbody>
        </table>

        <div className="invoice-legal__parties">
          <section>
            <h2>Bill To</h2>
            <p className="font-semibold">{invoice.customerName ?? invoice.customerEmail}</p>
            {billLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>GSTIN/UIN: URP</p>
          </section>
          <section>
            <h2>Ship To</h2>
            {shipLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>Delivery: {shippingLabel(invoice.shippingMethod)}</p>
          </section>
        </div>

        <div className="invoice-legal__table-wrap">
          <table className="invoice-legal__items">
            <thead>
              <tr>
                <th>#</th>
                <th>Description of goods</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Unit</th>
                <th className="num">Rate</th>
                <th className="num">Taxable value</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={`${item.sku}-${i}`}>
                  <td>{i + 1}</td>
                  <td>
                    <strong>{item.title}</strong>
                    <br />
                    {item.label} · SKU {item.sku}
                  </td>
                  <td>{supplier.defaultHsn}</td>
                  <td>{item.quantity}</td>
                  <td>PCS</td>
                  <td className="num">{formatInr(item.unitPricePaise)}</td>
                  <td className="num">{formatInr(item.lineTotalPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-legal__summary">
          <table>
            <tbody>
              <tr>
                <th>Subtotal</th>
                <td>{formatInr(invoice.subtotalPaise)}</td>
              </tr>
              {invoice.discountPaise > 0 ? (
                <tr>
                  <th>Discount{invoice.couponCode ? ` (${invoice.couponCode})` : ''}</th>
                  <td>−{formatInr(invoice.discountPaise)}</td>
                </tr>
              ) : null}
              <tr>
                <th>Taxable value</th>
                <td>{formatInr(taxablePaise)}</td>
              </tr>
              {intraState ? (
                <>
                  <tr>
                    <th>CGST @ {(taxRate / 2).toFixed(2)}%</th>
                    <td>{formatInr(cgstPaise)}</td>
                  </tr>
                  <tr>
                    <th>SGST @ {(taxRate / 2).toFixed(2)}%</th>
                    <td>{formatInr(sgstPaise)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <th>IGST @ {taxRate.toFixed(2)}%</th>
                  <td>{formatInr(igstPaise)}</td>
                </tr>
              )}
              <tr>
                <th>Shipping</th>
                <td>{formatInr(invoice.shippingPaise)}</td>
              </tr>
              <tr className="invoice-legal__grand">
                <th>Invoice Total</th>
                <td>{formatInr(invoice.totalPaise)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="invoice-legal__declaration">
          <div>
            <p>
              Declaration: The particulars shown above are true and correct for this sample
              document. Tax is not payable under reverse charge.
            </p>
            <p className="mt-2">Status: {statusLabel}</p>
          </div>
          <div className="invoice-legal__signature">
            <p>For {supplier.legalName}</p>
            <div />
            <p>Authorised Signatory</p>
          </div>
        </div>

        <footer className="invoice-legal__footer">
          <p>
            This is sample data only. Replace supplier, GSTIN, HSN and tax configuration before use.
          </p>
          <p>{supplier.email}</p>
        </footer>
      </article>
    </main>
  );
}
