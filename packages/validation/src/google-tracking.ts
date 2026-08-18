import { z } from 'zod';

const emptyToUndef = (v: unknown) => {
  if (v == null) return undefined;
  if (typeof v === 'string' && v.trim() === '') return undefined;
  return v;
};

export const GTM_CONTAINER_ID_RE = /^GTM-[A-Z0-9]+$/;
export const GA4_MEASUREMENT_ID_RE = /^G-[A-Z0-9]+$/;
export const GOOGLE_ADS_ID_RE = /^AW-[0-9]+$/;
export const GOOGLE_SITE_VERIFICATION_RE = /^[A-Za-z0-9_-]{10,100}$/;
export const GOOGLE_ADS_PURCHASE_LABEL_RE = /^[A-Za-z0-9_-]+$/;
export const META_PIXEL_ID_RE = /^\d{5,20}$/;

function optionalId(regex: RegExp, uppercase: boolean) {
  return z.preprocess((v) => {
    const u = emptyToUndef(v);
    if (typeof u !== 'string') return u;
    const t = u.trim();
    return uppercase ? t.toUpperCase() : t;
  }, z.string().regex(regex).optional());
}

export const googleTrackingBodySchema = z.object({
  googleSiteVerification: optionalId(GOOGLE_SITE_VERIFICATION_RE, false),
  gtmContainerId: optionalId(GTM_CONTAINER_ID_RE, true),
  ga4MeasurementId: optionalId(GA4_MEASUREMENT_ID_RE, true),
  googleAdsId: optionalId(GOOGLE_ADS_ID_RE, true),
  googleAdsPurchaseLabel: optionalId(GOOGLE_ADS_PURCHASE_LABEL_RE, false),
  metaPixelId: optionalId(META_PIXEL_ID_RE, false),
});

export type GoogleTracking = z.infer<typeof googleTrackingBodySchema>;

export function normalizeGoogleTracking(input: unknown): GoogleTracking {
  const parsed = googleTrackingBodySchema.safeParse(input ?? {});
  if (!parsed.success) return {};
  const v = parsed.data;
  const out: GoogleTracking = {};
  if (v.googleSiteVerification) out.googleSiteVerification = v.googleSiteVerification;
  if (v.gtmContainerId) out.gtmContainerId = v.gtmContainerId;
  if (v.ga4MeasurementId) out.ga4MeasurementId = v.ga4MeasurementId;
  if (v.googleAdsId) out.googleAdsId = v.googleAdsId;
  if (v.googleAdsPurchaseLabel) out.googleAdsPurchaseLabel = v.googleAdsPurchaseLabel;
  if (v.metaPixelId) out.metaPixelId = v.metaPixelId;
  return out;
}

export function googleTrackingAdminForm(t: GoogleTracking): Required<GoogleTracking> {
  return {
    googleSiteVerification: t.googleSiteVerification ?? '',
    gtmContainerId: t.gtmContainerId ?? '',
    ga4MeasurementId: t.ga4MeasurementId ?? '',
    googleAdsId: t.googleAdsId ?? '',
    googleAdsPurchaseLabel: t.googleAdsPurchaseLabel ?? '',
    metaPixelId: t.metaPixelId ?? '',
  };
}
