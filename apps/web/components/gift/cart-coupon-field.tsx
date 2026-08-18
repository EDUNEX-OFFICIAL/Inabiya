'use client';

import { couponCodesOnCart, type CartDto } from '@/lib/cart-client';

export function CartCouponField({
  cart,
  draft,
  busy,
  inputClassName = 'clay-input',
  onDraft,
  onApply,
  onRemove,
}: {
  cart: CartDto;
  draft: string;
  busy?: boolean;
  inputClassName?: string;
  onDraft: (v: string) => void;
  onApply: () => void;
  onRemove: (code?: string) => void;
}) {
  const codes = couponCodesOnCart(cart);

  return (
    <div>
      {codes.length ? (
        <ul className="mb-gs-2 flex flex-wrap gap-1.5">
          {codes.map((code) => (
            <li
              key={code}
              className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)] px-2 py-0.5 text-caption text-primary"
            >
              {code}
              <button
                type="button"
                className="rounded-full px-0.5 opacity-70 hover:opacity-100"
                aria-label={`Remove ${code}`}
                disabled={busy}
                onClick={() => onRemove(code)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-col gap-gs-2 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 text-body">
          Coupon
          <input
            className={inputClassName}
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!busy && draft.trim()) onApply();
              }
            }}
            placeholder="Code"
            disabled={busy}
            autoCapitalize="characters"
          />
        </label>
        <button
          type="button"
          onClick={() => onApply()}
          disabled={busy || !draft.trim()}
          className="clay-btn-secondary w-full sm:w-auto disabled:opacity-60"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
