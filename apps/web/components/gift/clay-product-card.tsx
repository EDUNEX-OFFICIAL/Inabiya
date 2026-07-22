import Link from 'next/link';
import { formatInr, type CatalogProduct } from '@/lib/catalog';

type Props = {
  product: CatalogProduct;
  imageHeightClass?: string;
};

export function ClayProductCard({ product, imageHeightClass = 'h-44' }: Props) {
  const img = product.media[0];
  const out = product.variants.length > 0 && product.variants.every((v) => v.available <= 0);

  return (
    <li className="clay-card overflow-hidden list-none">
      <Link href={`/gift/products/${product.slug}`} className="block">
        {img?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.url}
            alt={img.altText ?? product.title}
            className={`${imageHeightClass} w-full object-cover`}
          />
        ) : (
          <div className={`${imageHeightClass} w-full gift-media-fallback`} />
        )}
        <div className="p-gs-4">
          <p className="font-medium leading-snug text-foreground">{product.title}</p>
          <p className="mt-gs-2 text-sm font-semibold text-primary">
            {formatInr(product.fromPricePaise)}
          </p>
          {product.isReadyMadeHamper ? (
            <p className="mt-gs-1 text-xs opacity-70">Ready-made hamper</p>
          ) : null}
          {out ? <p className="mt-gs-2 text-xs text-danger">Out of stock</p> : null}
        </div>
      </Link>
    </li>
  );
}
