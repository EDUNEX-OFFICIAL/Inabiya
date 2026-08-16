import type { ReactNode } from 'react';

/** Soft Gift decorative panels for portal logins — CSS-driven shapes only. */
export function GiftCustomerVisual() {
  return (
    <div className="auth-visual__inner auth-visual__inner--gift">
      <div className="auth-blob auth-blob--a" aria-hidden />
      <div className="auth-blob auth-blob--b" aria-hidden />
      <div className="auth-blob auth-blob--c" aria-hidden />
      <div className="auth-visual__copy">
        <p className="auth-visual__kicker">Soft Gift</p>
        <p className="auth-visual__headline">Thoughtful gifts, warmer checkouts</p>
        <ul className="auth-visual__chips">
          <li>Wishlists</li>
          <li>Orders</li>
          <li>Personalised boxes</li>
        </ul>
      </div>
    </div>
  );
}

export function GiftOpsVisual({
  kicker,
  headline,
  chips,
}: {
  kicker: string;
  headline: string;
  chips: string[];
}) {
  return (
    <div className="auth-visual__inner auth-visual__inner--ops">
      <div className="auth-ops-grid" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="auth-visual__copy">
        <p className="auth-visual__kicker">{kicker}</p>
        <p className="auth-visual__headline">{headline}</p>
        <ul className="auth-visual__chips">
          {chips.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function BlogEditorialVisual() {
  return (
    <div className="auth-visual__inner auth-visual__inner--blog">
      <div className="auth-blog-lines" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="auth-visual__copy">
        <p className="auth-visual__kicker">Blog Creative</p>
        <p className="auth-visual__headline">Journal desk for writers & reviewers</p>
        <ul className="auth-visual__chips">
          <li>Drafts</li>
          <li>SEO</li>
          <li>Medical review</li>
        </ul>
      </div>
    </div>
  );
}

export function CreatorCollectiveVisual() {
  return (
    <div className="auth-visual__inner auth-visual__inner--creator">
      <div className="auth-creator-shapes" aria-hidden>
        <span className="auth-creator-shape auth-creator-shape--1" />
        <span className="auth-creator-shape auth-creator-shape--2" />
        <span className="auth-creator-shape auth-creator-shape--3" />
      </div>
      <div className="auth-visual__copy">
        <p className="auth-visual__kicker">Creator Collective</p>
        <p className="auth-visual__headline">Campaigns, brands & deliverables</p>
        <ul className="auth-visual__chips">
          <li>Studio</li>
          <li>Brand desk</li>
          <li>Awards</li>
        </ul>
      </div>
    </div>
  );
}

/** Shared Soft Gift auth page shell (register / forgot / reset). */
export function GiftAuthShell({
  overline,
  title,
  description,
  visual,
  children,
  footer,
}: {
  overline?: string;
  title: string;
  description?: string;
  visual?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="auth-shell auth-shell--gift">
      <div className="auth-shell__grid">
        <aside className="auth-visual" aria-hidden="true">
          {visual ?? <GiftCustomerVisual />}
        </aside>
        <div className="auth-form-col">
          <header className="auth-form-col__header">
            {overline ? (
              <p className="text-caption font-semibold uppercase tracking-[0.14em] text-primary">
                {overline}
              </p>
            ) : null}
            <h1 className="gift-h1">{title}</h1>
            {description ? <p className="gift-muted mt-2">{description}</p> : null}
          </header>
          {children}
          {footer ? <div className="auth-form-col__footer">{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}
