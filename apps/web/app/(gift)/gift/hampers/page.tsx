import { redirect } from 'next/navigation';

/** Legacy QA/bookmark URL — canonical hamper browse is the ready-hampers collection. */
export default function GiftHampersRedirectPage() {
  redirect('/gift/collections/ready-hampers');
}
