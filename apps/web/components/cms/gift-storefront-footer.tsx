import Link from 'next/link';

export type GiftFooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export type GiftFooterProps = {
  brandName?: string;
  tagline?: string;
  columns?: GiftFooterColumn[];
};

const DEFAULT_FOOTER: Required<GiftFooterProps> = {
  brandName: 'Inabiya',
  tagline: 'Thoughtfully personalised baby essentials & gifting.',
  columns: [
    {
      title: 'Shop',
      links: [
        { label: 'Build Your Box', href: '/gift/box' },
        { label: 'Ready-Made Hampers', href: '/gift/products?hamper=1' },
        { label: 'Shop by Age', href: '/gift/products?age=newborn' },
        { label: 'Corporate Gifting', href: '/gift/corporate' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'Parenting Blog', href: '/articles' },
        { label: 'Our Specialists', href: '/specialists' },
        { label: 'Contact', href: 'mailto:hello@inabiya.in' },
      ],
    },
  ],
};

export function GiftStorefrontFooter(props: GiftFooterProps = {}) {
  const brandName = props.brandName?.trim() || DEFAULT_FOOTER.brandName;
  const tagline = props.tagline?.trim() || DEFAULT_FOOTER.tagline;
  const columns = props.columns?.length ? props.columns : DEFAULT_FOOTER.columns;

  return (
    <div className="gift-band gift-band--soft">
      <footer className="gift-band-inner grid gap-gs-6 border-t border-border-subtle pt-gs-7 text-sm opacity-80 sm:grid-cols-3">
        <div>
          <p className="font-display text-xl text-foreground">{brandName}</p>
          <p className="mt-gs-2 max-w-xs">{tagline}</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="font-semibold text-foreground">{col.title}</p>
            <ul className="mt-gs-2 space-y-gs-2">
              {col.links.map((link) => (
                <li key={`${col.title}-${link.href}-${link.label}`}>
                  {link.href.startsWith('mailto:') ? (
                    <a href={link.href} className="hover:text-primary">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="hover:text-primary">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </footer>
    </div>
  );
}
