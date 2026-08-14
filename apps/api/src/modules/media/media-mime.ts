/** Pure MIME/size gates for media uploads — no Nest deps (easy to assert). */

export const ALLOWED_MEDIA_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
]);

/** ~5 MiB */
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export type MediaUploadValidation =
  { ok: true; mimeType: string } | { ok: false; code: string; message: string };

export function sniffMediaMime(buf: Uint8Array): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return 'image/gif';
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (buf.length >= 12) {
    const brand = String.fromCharCode(...buf.subarray(4, 8));
    const minor = String.fromCharCode(...buf.subarray(8, 12));
    if (brand === 'ftyp' && (minor === 'avif' || minor === 'avis' || minor === 'mif1')) {
      return 'image/avif';
    }
  }
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return 'application/pdf';
  }
  return null;
}

export function sanitizeContentDispositionFilename(name: string | null | undefined): string {
  const cleaned = (name ?? 'file')
    .replace(/[\r\n";\\]/g, '')
    .slice(0, 180)
    .trim();
  return cleaned || 'file';
}

export function validateMediaUpload(
  mimeType: string | undefined,
  sizeBytes: number,
  bytes?: Uint8Array,
): MediaUploadValidation {
  if (!mimeType || !ALLOWED_MEDIA_MIMES.has(mimeType)) {
    return {
      ok: false,
      code: 'MEDIA_MIME_REJECTED',
      message: 'File type not allowed. Use jpeg, png, webp, gif, avif, or pdf.',
    };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return {
      ok: false,
      code: 'MEDIA_EMPTY',
      message: 'Empty file rejected.',
    };
  }
  if (sizeBytes > MAX_MEDIA_BYTES) {
    return {
      ok: false,
      code: 'MEDIA_TOO_LARGE',
      message: `File exceeds ${MAX_MEDIA_BYTES} bytes.`,
    };
  }
  if (bytes && bytes.length > 0) {
    const sniffed = sniffMediaMime(bytes);
    if (!sniffed || sniffed !== mimeType) {
      return {
        ok: false,
        code: 'MEDIA_MIME_MISMATCH',
        message: 'File contents do not match the declared type.',
      };
    }
  }
  return { ok: true, mimeType };
}
