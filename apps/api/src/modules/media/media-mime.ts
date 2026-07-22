/** Pure MIME/size gates for media uploads — no Nest deps (easy to assert). */

export const ALLOWED_MEDIA_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

/** ~5 MiB */
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export type MediaUploadValidation =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function validateMediaUpload(
  mimeType: string | undefined,
  sizeBytes: number,
): MediaUploadValidation {
  if (!mimeType || !ALLOWED_MEDIA_MIMES.has(mimeType)) {
    return {
      ok: false,
      code: 'MEDIA_MIME_REJECTED',
      message: 'File type not allowed. Use jpeg, png, webp, gif, or pdf.',
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
  return { ok: true };
}
