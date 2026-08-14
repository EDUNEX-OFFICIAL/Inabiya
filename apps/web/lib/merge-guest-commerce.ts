import { cartApi } from './cart-client';
import { giftBoxApi } from './gift-box-client';

/** After login/register: fold guest cart + gift box into the user. */
export async function mergeGuestCommerce(): Promise<void> {
  await Promise.all([
    cartApi('/cart/merge', { method: 'POST' }).catch(() => undefined),
    giftBoxApi('/catalog/gift-boxes/merge', { method: 'POST' }).catch(() => undefined),
  ]);
}
