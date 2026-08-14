import type { CatalogHamperItem } from '../../lib/catalog';

export type HamperContentsProduct = {
  id: string;
  slug: string;
  title: string;
  fromPricePaise: number;
  hamperItems?: CatalogHamperItem[];
  hamperItemCount?: number;
  contentsValuePaise?: number | null;
  hamperSavingsPaise?: number | null;
};

export function hamperContentsCount(product: HamperContentsProduct): number {
  const items = product.hamperItems ?? [];
  return product.hamperItemCount ?? items.reduce((sum, item) => sum + item.qty, 0);
}

export function hamperContentsLabel(count: number): string {
  return count === 1 ? '1 curated item in this set' : `${count} curated items in this set`;
}
