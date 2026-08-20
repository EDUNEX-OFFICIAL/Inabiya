import Link from 'next/link';
import { Heart } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { BlogNavIcon } from '@/components/blog/blog-nav-icon';
import { BLOG_PUBLIC_NAV } from '@/lib/blog-public-nav';
import { FOOTER_DEVELOPER_CREDIT } from '@/lib/gift-footer-chrome';

const EXPLORE = BLOG_PUBLIC_NAV.filter((item) => !item.cta);
const STORE = BLOG_PUBLIC_NAV.find((item) => item.cta);

export function BlogFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="blog-footer print:hidden">
      <div className="blog-footer__main blog-shell-width">
        <div className="blog-footer__brand">
          <BrandLogo
            kind="mark"
            href="/blog"
            size="sm"
            label="Inabiya Journal"
            className="blog-footer__logo"
          />
          <p className="blog-footer__tagline">Parenting notes from Inabiya.</p>
        </div>

        <div className="blog-footer__cols">
          <nav className="blog-footer__explore" aria-label="Journal">
            <p className="blog-footer__label">Explore</p>
            <ul className="blog-footer__list">
              {EXPLORE.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="blog-footer__link">
                    <BlogNavIcon id={item.id} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {STORE ? (
            <nav className="blog-footer__shop" aria-label="Shop">
              <p className="blog-footer__label">Shop</p>
              <ul className="blog-footer__list">
                <li>
                  <Link href={STORE.href} className="blog-footer__link">
                    <BlogNavIcon id={STORE.id} />
                    {STORE.label}
                  </Link>
                </li>
              </ul>
            </nav>
          ) : null}
        </div>
      </div>

      <div className="blog-footer__bar">
        <div className="blog-shell-width blog-footer__bar-inner">
          <p className="blog-footer__copy">© {year} Inabiya Journal</p>
          <p className="blog-footer__credit">
            <span>{FOOTER_DEVELOPER_CREDIT.prefix}</span>
            <Heart className="blog-footer__heart" strokeWidth={2} aria-hidden />
            <span className="sr-only">love</span>
            <span>
              {FOOTER_DEVELOPER_CREDIT.mid}{' '}
              <a href={FOOTER_DEVELOPER_CREDIT.href} target="_blank" rel="noopener noreferrer">
                {FOOTER_DEVELOPER_CREDIT.label}
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
