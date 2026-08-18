import sharp from 'sharp';

export const WEB_MAX_PX = 1600;
export const THUMB_MAX_PX = 400;
export const LQIP_MAX_PX = 16;
export const BLUR_MAX_CHARS = 2048;

const SKIP_MIMES = new Set(['image/gif', 'image/svg+xml', 'application/pdf']);

export function shouldSkipVariants(mimeType: string): boolean {
  return SKIP_MIMES.has(mimeType) || !mimeType.startsWith('image/');
}

export type BuiltVariants = {
  width: number;
  height: number;
  web: Buffer;
  thumb: Buffer;
  blurDataUrl: string | null;
};

export async function buildImageVariants(input: Buffer): Promise<BuiltVariants> {
  const meta = await sharp(input, { failOn: 'none' }).rotate().metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const web = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(WEB_MAX_PX, WEB_MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  const thumb = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(THUMB_MAX_PX, THUMB_MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  const lqip = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(LQIP_MAX_PX, LQIP_MAX_PX, { fit: 'inside' })
    .jpeg({ quality: 40 })
    .toBuffer();
  const blurDataUrl = `data:image/jpeg;base64,${lqip.toString('base64')}`;

  return {
    width,
    height,
    web,
    thumb,
    blurDataUrl: blurDataUrl.length <= BLUR_MAX_CHARS ? blurDataUrl : null,
  };
}

export function variantStorageKey(originalKey: string, kind: 'web' | 'thumb'): string {
  const trimmed = originalKey.replace(/\.[^./]+$/, '');
  return `${trimmed}-${kind}.webp`;
}
