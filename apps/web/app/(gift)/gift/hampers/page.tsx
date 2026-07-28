import { redirect } from 'next/navigation';

/** Legacy QA/bookmark URL — canonical hamper PLP is query-filtered products. */
export default function GiftHampersRedirectPage() {
  redirect('/gift/products?hamper=1');
}
