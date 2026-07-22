export const FREE_SHIPPING_MIN_PAISE = 200_000;
export const STANDARD_SHIPPING_PAISE = 9_900;
export const EXPRESS_SHIPPING_PAISE = 19_900;

export function shippingPaise(method: 'STANDARD' | 'EXPRESS', subtotalPaise: number): number {
  if (method === 'STANDARD' && subtotalPaise >= FREE_SHIPPING_MIN_PAISE) return 0;
  return method === 'EXPRESS' ? EXPRESS_SHIPPING_PAISE : STANDARD_SHIPPING_PAISE;
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INB-${ts}-${rand}`;
}
