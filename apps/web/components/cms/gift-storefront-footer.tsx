import Link from 'next/link';
import type { ReactNode } from 'react';
import { Facebook, Gift, Instagram, Mail } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { WhatsAppIcon } from '@/components/gift/whatsapp-icon';
import { formatFooterCopyright } from '@/lib/gift-footer-chrome';
import { safeHrefOrHash } from '@inabiya/validation';

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
  brandHref?: string;
  tagline?: string;
  columns?: GiftFooterColumn[];
  socialLinks?: GiftSocialLink[];
  reachTitle?: string;
  reachLinks?: GiftSocialLink[];
  legalLinks?: Array<{ label: string; href: string }>;
  copyright?: string;
  newsletterTitle?: string;
  newsletterHint?: string;
  showNewsletter?: boolean;
  newsletterSlot?: ReactNode;
};

export const DEFAULT_FOOTER_COLUMNS: GiftFooterColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Build Your Box', href: '/build-your-box' },
      { label: 'Ready-Made Hampers', href: '/collections/ready-hampers' },
      { label: 'Shop by Age', href: '/collections/newborn' },
      { label: 'Corporate Gifting', href: '/corporate' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Shipping', href: '/#faq' },
      { label: 'Returns', href: '/#faq' },
      { label: 'FAQ', href: '/#faq' },
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
  brandHref: '/',
  tagline:
    'Thoughtfully personalised baby essentials & gifting for the tiny humans (and their moms) you love.',
  columns: DEFAULT_FOOTER_COLUMNS,
  reachTitle: 'Reach us',
};

const DEFAULT_SOCIAL: GiftSocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com/inabiya', network: 'instagram' },
  { label: 'Facebook', href: 'https://facebook.com/inabiya', network: 'facebook' },
  { label: 'WhatsApp', href: 'https://wa.me/919693940330', network: 'whatsapp' },
];

export const DEFAULT_REACH_LINKS: GiftSocialLink[] = [
  { label: 'hello@inabiya.in', href: 'mailto:hello@inabiya.in', network: 'mail' },
  { label: 'WhatsApp', href: 'https://wa.me/919693940330', network: 'whatsapp' },
  { label: '@inabiya', href: 'https://instagram.com/inabiya', network: 'instagram' },
];

export const DEFAULT_LEGAL_LINKS: Array<{ label: string; href: string }> = [
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Contact', href: '/contact' },
];

function FooterAnchor({
  href,
  label,
  className = 'gift-footer-link',
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const safe = safeHrefOrHash(href);
  const external =
    safe.startsWith('mailto:') || safe.startsWith('https:') || safe.startsWith('tel:');
  if (external) {
    return (
      <a
        href={safe}
        className={className}
        {...(safe.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={safe} className={className}>
      {label}
    </Link>
  );
}

function SocialIcon({ network, href = '' }: { network?: string; href?: string }) {
  const n = `${network ?? ''} ${href}`.toLowerCase();
  if (n.includes('instagram')) return <Instagram className="h-4 w-4" aria-hidden />;
  if (n.includes('facebook')) return <Facebook className="h-4 w-4" aria-hidden />;
  if (n.includes('whatsapp') || n.includes('wa.me')) return <WhatsAppIcon className="h-4 w-4" />;
  if (n.includes('mail') || n.startsWith('mailto:') || n.includes('mailto:')) {
    return <Mail className="h-4 w-4" aria-hidden />;
  }
  return <Gift className="h-4 w-4" aria-hidden />;
}

function ReachIcon({ network, href }: { network?: string; href: string }) {
  const n = `${network ?? ''} ${href}`.toLowerCase();
  const cls = 'h-3.5 w-3.5 shrink-0 opacity-70';
  if (n.includes('mail') || href.startsWith('mailto:')) return <Mail className={cls} aria-hidden />;
  if (n.includes('whatsapp') || href.includes('wa.me')) return <WhatsAppIcon className={cls} />;
  if (n.includes('instagram')) return <Instagram className={cls} aria-hidden />;
  if (n.includes('facebook')) return <Facebook className={cls} aria-hidden />;
  return <Gift className={cls} aria-hidden />;
}

function ReachUs({ title, links }: { title: string; links: GiftSocialLink[] }) {
  if (!links.length) return null;
  return (
    <div className="gift-footer__reach">
      <p className="gift-footer__col-title">{title}</p>
      <ul className="gift-footer__col-list">
        {links.map((l) => {
          const safe = safeHrefOrHash(l.href);
          return (
            <li key={`${l.label}-${l.href}`}>
              <a
                href={safe}
                className="gift-footer-link gift-footer-link--icon"
                {...(safe.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                <ReachIcon network={l.network} href={safe} />
                {l.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GiftStorefrontFooter(props: GiftFooterProps = {}) {
  const brandName = props.brandName?.trim() || DEFAULT_FOOTER.brandName;
  const brandHref = props.brandHref?.trim() || DEFAULT_FOOTER.brandHref;
  const tagline = props.tagline?.trim() || DEFAULT_FOOTER.tagline;
  const columns = props.columns?.length ? props.columns : DEFAULT_FOOTER.columns;
  const socialLinks = props.socialLinks ?? DEFAULT_SOCIAL;
  const reachTitle = props.reachTitle?.trim() || DEFAULT_FOOTER.reachTitle;
  const reachLinks = props.reachLinks ?? DEFAULT_REACH_LINKS;
  const legalLinks = props.legalLinks ?? DEFAULT_LEGAL_LINKS;
  const year = new Date().getFullYear();
  const showNewsletter = Boolean(props.showNewsletter && props.newsletterSlot);

  return (
    <div className="gift-footer-dark gift-band">
      <footer className="gift-band-inner gift-footer">
        <div className="gift-footer__grid">
          <div className="gift-footer__brand">
            <Link href={safeHrefOrHash(brandHref)} className="gift-footer__brand-lockup">
              <BrandLogo
                href={null}
                variant="onDark"
                size="lg"
                label={brandName}
                className="gift-footer__wordmark"
              />
            </Link>
            <p className="gift-footer__tagline">{tagline}</p>
            {socialLinks.length > 0 ? (
              <ul className="gift-footer__social" aria-label="Social links">
                {socialLinks.map((s) => {
                  const safe = safeHrefOrHash(s.href);
                  return (
                    <li key={`${s.network ?? s.label}-${s.href}`}>
                      <a
                        href={safe}
                        className="gift-footer__social-btn"
                        aria-label={s.label}
                        {...(safe.startsWith('http')
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        <SocialIcon network={s.network ?? s.label} href={safe} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {columns.map((col, i) => (
            <div key={`${col.title}-${i}`} className="gift-footer__col">
              <p className="gift-footer__col-title">{col.title}</p>
              <ul className="gift-footer__col-list">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}-${link.label}`}>
                    <FooterAnchor href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className={`gift-footer__lower${showNewsletter ? '' : ' gift-footer__lower--reach-only'}`}
        >
          {showNewsletter ? (
            <div className="gift-footer__newsletter">{props.newsletterSlot}</div>
          ) : null}
          <ReachUs title={reachTitle} links={reachLinks} />
        </div>

        <div className="gift-footer__bar">
          <p>{formatFooterCopyright(props.copyright, year, brandName)}</p>
          {legalLinks.length ? (
            <nav className="gift-footer__bar-links" aria-label="Legal">
              {legalLinks.map((l) => (
                <FooterAnchor key={`${l.label}-${l.href}`} href={l.href} label={l.label} />
              ))}
            </nav>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
