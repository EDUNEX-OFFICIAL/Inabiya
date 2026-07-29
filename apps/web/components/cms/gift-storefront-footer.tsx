import Link from 'next/link';
import type { ReactNode } from 'react';
import { Facebook, Gift, Instagram, Mail } from 'lucide-react';
import { WhatsAppIcon } from '@/components/gift/whatsapp-icon';

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
      { label: 'Ready-Made Hampers', href: '/gift/collections/ready-hampers' },
      { label: 'Shop by Age', href: '/gift/collections/newborn' },
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
  tagline:
    'Thoughtfully personalised baby essentials & gifting for the tiny humans (and their moms) you love.',
  columns: DEFAULT_FOOTER_COLUMNS,
};

const DEFAULT_SOCIAL: GiftSocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com/inabiya', network: 'instagram' },
  { label: 'Facebook', href: 'https://facebook.com/inabiya', network: 'facebook' },
  { label: 'WhatsApp', href: 'https://wa.me/919693940330', network: 'whatsapp' },
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
  const external = href.startsWith('mailto:') || href.startsWith('http') || href.startsWith('tel:');
  if (external) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function SocialIcon({ network }: { network?: string }) {
  const n = (network ?? '').toLowerCase();
  if (n.includes('instagram')) return <Instagram className="h-4 w-4" aria-hidden />;
  if (n.includes('facebook')) return <Facebook className="h-4 w-4" aria-hidden />;
  if (n.includes('whatsapp')) return <WhatsAppIcon className="h-4 w-4" />;
  return <Gift className="h-4 w-4" aria-hidden />;
}

function ReachUs() {
  return (
    <div className="gift-footer__reach">
      <p className="gift-footer__col-title">Reach us</p>
      <ul className="gift-footer__col-list">
        <li>
          <a href="mailto:hello@inabiya.in" className="gift-footer-link gift-footer-link--icon">
            <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            hello@inabiya.in
          </a>
        </li>
        <li>
          <a
            href="https://wa.me/919693940330"
            className="gift-footer-link gift-footer-link--icon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
            WhatsApp
          </a>
        </li>
        <li>
          <a
            href="https://instagram.com/inabiya"
            className="gift-footer-link gift-footer-link--icon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            @inabiya
          </a>
        </li>
      </ul>
    </div>
  );
}

export function GiftStorefrontFooter(props: GiftFooterProps = {}) {
  const brandName = props.brandName?.trim() || DEFAULT_FOOTER.brandName;
  const tagline = props.tagline?.trim() || DEFAULT_FOOTER.tagline;
  const columns = props.columns?.length ? props.columns : DEFAULT_FOOTER.columns;
  const socialLinks = props.socialLinks?.length ? props.socialLinks : DEFAULT_SOCIAL;
  const year = new Date().getFullYear();
  const showNewsletter = Boolean(props.showNewsletter && props.newsletterSlot);

  return (
    <div className="gift-footer-dark gift-band">
      <footer className="gift-band-inner gift-footer">
        <div className="gift-footer__grid">
          <div className="gift-footer__brand">
            <Link href="/gift" className="gift-footer__brand-lockup">
              <span className="gift-footer__mark" aria-hidden>
                <Gift className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="font-display text-xl text-white sm:text-2xl">{brandName}</span>
            </Link>
            <p className="gift-footer__tagline">{tagline}</p>
            {socialLinks.length > 0 ? (
              <ul className="gift-footer__social" aria-label="Social links">
                {socialLinks.map((s) => (
                  <li key={`${s.network ?? s.label}-${s.href}`}>
                    <a
                      href={s.href}
                      className="gift-footer__social-btn"
                      aria-label={s.label}
                      {...(s.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      <SocialIcon network={s.network ?? s.label} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {columns.map((col) => (
            <div key={col.title} className="gift-footer__col">
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

        <div className={`gift-footer__lower${showNewsletter ? '' : ' gift-footer__lower--reach-only'}`}>
          {showNewsletter ? <div className="gift-footer__newsletter">{props.newsletterSlot}</div> : null}
          <ReachUs />
        </div>

        <div className="gift-footer__bar">
          <p>
            © {year} {brandName}. Soft gifts for tiny humans.
          </p>
          <nav className="gift-footer__bar-links" aria-label="Legal">
            <Link href="/gift#faq" className="gift-footer-link">
              Shipping
            </Link>
            <Link href="/contact" className="gift-footer-link">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
