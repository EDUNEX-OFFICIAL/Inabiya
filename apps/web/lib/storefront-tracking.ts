import { normalizeGoogleTracking, type GoogleTracking } from '@inabiya/validation';
import { apiUrl } from './api-base';

export async function fetchStorefrontTracking(): Promise<GoogleTracking> {
  try {
    const res = await fetch(apiUrl('/storefront/tracking'), { cache: 'no-store' });
    if (!res.ok) return {};
    return normalizeGoogleTracking(await res.json());
  } catch {
    return {};
  }
}
