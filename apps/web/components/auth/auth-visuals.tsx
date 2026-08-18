import type { ReactNode } from 'react';
import { AuthBrandLockup } from '@/components/auth/auth-brand';

function VisualSheen() {
  return <span className="auth-visual__sheen" aria-hidden />;
}

/** Soft Gift decorative panels for portal logins — CSS-driven shapes only. */
export function GiftCustomerVisual() {
  return (
    <div className="auth-visual__inner auth-visual__inner--gift">
      <VisualSheen />
      <div className="auth-blob auth-blob--a" aria-hidden />
      <div className="auth-blob auth-blob--b" aria-hidden />
      <div className="auth-blob auth-blob--c" aria-hidden />
      <AuthBrandLockup surface="light" placement="visual" />
      <div className="auth-visual__copy">
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
      <VisualSheen />
      <div className="auth-ops-grid" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <AuthBrandLockup surface="dark" placement="visual" />
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

export function PlatformVisual() {
  return (
    <div className="auth-visual__inner auth-visual__inner--ops auth-visual__inner--platform">
      <VisualSheen />
      <div className="auth-platform-rings" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <AuthBrandLockup surface="dark" placement="visual" />
      <div className="auth-visual__copy">
        <p className="auth-visual__kicker">Platform</p>
        <p className="auth-visual__headline">High-trust controls, quiet surface</p>
        <ul className="auth-visual__chips">
          <li>Flags</li>
          <li>Media</li>
          <li>Audit</li>
        </ul>
      </div>
    </div>
  );
}

export function BlogEditorialVisual() {
  return (
    <div className="auth-visual__inner auth-visual__inner--blog">
      <VisualSheen />
      <div className="auth-blog-lines" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <AuthBrandLockup surface="dark" placement="visual" />
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
      <VisualSheen />
      <div className="auth-creator-shapes" aria-hidden>
        <span className="auth-creator-shape auth-creator-shape--1" />
        <span className="auth-creator-shape auth-creator-shape--2" />
        <span className="auth-creator-shape auth-creator-shape--3" />
      </div>
      <AuthBrandLockup surface="dark" placement="visual" />
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
  brandHref = '/',
}: {
  overline?: string;
  title: string;
  description?: string;
  visual?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  brandHref?: string | null;
}) {
  return (
    <main className="auth-shell auth-shell--gift">
      <div className="auth-shell__grid">
        <aside className="auth-visual" aria-hidden="true">
          {visual ?? <GiftCustomerVisual />}
        </aside>
        <div className="auth-form-col">
          <header className="auth-form-col__header">
            <AuthBrandLockup surface="light" placement="form" href={brandHref} />
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
