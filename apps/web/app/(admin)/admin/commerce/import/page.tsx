'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { parseInventoryCsv } from '@/lib/parse-inventory-csv';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type ImportResult = {
  dryRun: boolean;
  total: number;
  okCount: number;
  errorCount: number;
  results: Array<{
    row: number;
    sku: string;
    ok: boolean;
    error?: string;
    availableAfter?: number;
  }>;
};

const SAMPLE = `sku,delta,reason,note
DEMO-SKU,10,RECEIVE,restock demo
`;

export default function InventoryImportPage() {
  const router = useRouter();
  const [text, setText] = useState(SAMPLE);
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(dryRun: boolean) {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    const parsed = parseInventoryCsv(text);
    setParseErrors(parsed.parseErrors);
    if (!parsed.rows.length) {
      setError('No valid rows to import');
      setBusy(false);
      return;
    }
    try {
      const res = await apiAuth<ImportResult>('/admin/commerce/inventory/import', {
        method: 'POST',
        json: { dryRun, rows: parsed.rows },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <OpsPageHeader
        title="Stock CSV import"
        description="Dry-run validates SKUs & deltas · commit writes ledger adjustments."
        actions={
          <Link href="/admin/commerce/inventory" className="clay-btn-secondary text-sm">
            ← Inventory
          </Link>
        }
      />

      <p className="mb-2 text-xs opacity-70">
        Columns: <code>sku,delta,reason[,note]</code> · reason = RECEIVE | DAMAGE | RECOUNT |
        CORRECTION
      </p>
      <textarea
        className="min-h-[12rem] w-full rounded border px-2 py-2 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="clay-btn-secondary text-sm disabled:opacity-50"
          disabled={busy}
          onClick={() => void run(true)}
        >
          Dry-run
        </button>
        <button
          type="button"
          className="clay-btn text-sm disabled:opacity-50"
          disabled={busy || Boolean(result?.dryRun && result.errorCount > 0)}
          onClick={() => void run(false)}
        >
          Commit import
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {parseErrors.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-amber-900">
          {parseErrors.map((e) => (
            <li key={`${e.row}-${e.message}`}>
              Parse row {e.row}: {e.message}
            </li>
          ))}
        </ul>
      ) : null}

      {result ? (
        <section className="mt-4 text-sm">
          <p>
            {result.dryRun ? 'Dry-run' : 'Committed'}: {result.okCount}/{result.total} ok
            {result.errorCount ? ` · ${result.errorCount} errors` : ''}
          </p>
          <OpsTableScroll>
            <table className="mt-2 w-full min-w-[28rem] border-collapse text-xs">
              <thead>
                <tr className="border-b text-left opacity-70">
                  <th className="py-1 pr-2">Row</th>
                  <th className="py-1 pr-2">SKU</th>
                  <th className="py-1 pr-2">OK</th>
                  <th className="py-1">Detail</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={`${r.row}-${r.sku}`} className="border-b">
                    <td className="py-1 pr-2">{r.row}</td>
                    <td className="py-1 pr-2 font-mono">{r.sku}</td>
                    <td className="py-1 pr-2">{r.ok ? 'yes' : 'no'}</td>
                    <td className="py-1">
                      {r.error ??
                        (r.availableAfter != null ? `available → ${r.availableAfter}` : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </OpsTableScroll>
        </section>
      ) : null}
    </div>
  );
}
