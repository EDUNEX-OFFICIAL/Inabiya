import Link from 'next/link';
import type { ReactNode } from 'react';

export type GiftFooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export type GiftSocialLink = {
  label: string;
  href: string;
  network?: string;
};

export type GiftFooterProps = {
  brandName?: string;
  tagline?: string;
  columns?: GiftFooterColumn[];
  socialLinks?: GiftSocialLink[];
  /** When true, show newsletter signup (Pass 7+) */
  showNewsletter?: boolean;
  newsletterSlot?: ReactNode;
};

export const DEFAULT_FOOTER_COLUMNS: GiftFooterColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Build Your Box', href: '/gift/build-your-box' },
      { label: 'Ready-Made Hampers', href: '/gift/products?hamper=1' },
      { label: 'Shop by Age', href: '/gift/products?age=newborn' },
      { label: 'Corporate Gifting', href: '/gift/corporate' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Shipping', href: '/gift#faq' },
      { label: 'Returns', href: '/gift#faq' },
      { label: 'FAQ', href: '/gift#faq' },
      { label: 'WhatsApp', href: 'https://wa.me/919693940330' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Parenting Blog', href: '/articles' },
      { label: 'Our Specialists', href: '/specialists' },
    ],
  },
];

const DEFAULT_FOOTER = {
  brandName: 'Inabiya',
  tagline: 'Thoughtfully personalised baby essentials & gifting.',
  columns: DEFAULT_FOOTER_COLUMNS,
};

function FooterAnchor({ href, label }: { href: string; label: string }) {
  const external = href.startsWith('mailto:') || href.startsWith('http') || href.startsWith('tel:');
  if (external) {
    return (
      <a
        href={href}
        className="hover:text-primary"
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className="hover:text-primary">
      {label}
    </Link>
  );
}

export function GiftStorefrontFooter(props: GiftFooterProps = {}) {
  const brandName = props.brandName?.trim() || DEFAULT_FOOTER.brandName;
  const tagline = props.tagline?.trim() || DEFAULT_FOOTER.tagline;
  const columns = props.columns?.length ? props.columns : DEFAULT_FOOTER.columns;
  const socialLinks = props.socialLinks ?? [];

  return (
    <div className="gift-band gift-band--soft">
      <footer className="gift-band-inner border-t border-border-subtle pt-gs-7 text-sm opacity-80">
        <div className="grid gap-gs-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl text-foreground">{brandName}</p>
            <p className="mt-gs-2 max-w-xs">{tagline}</p>
            {socialLinks.length > 0 ? (
              <ul className="mt-gs-4 flex flex-wrap gap-gs-3">
                {socialLinks.map((s) => (
                  <li key={`${s.network ?? s.label}-${s.href}`}>
                    <FooterAnchor href={s.href} label={s.label} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-foreground">{col.title}</p>
              <ul className="mt-gs-2 space-y-gs-2">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}-${link.label}`}>
                    <FooterAnchor href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {props.showNewsletter && props.newsletterSlot ? (
          <div className="mt-gs-7 border-t border-border-subtle pt-gs-6">
            {props.newsletterSlot}
          </div>
        ) : null}
      </footer>
    </div>
  );
}
