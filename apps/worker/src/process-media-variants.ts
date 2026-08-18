import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import { buildImageVariants, shouldSkipVariants, variantStorageKey } from './image-variants';
import { deleteMediaObject, getMediaObject, putMediaObject } from './local-media-store';

export async function processMediaVariants(
  prisma: PrismaClient,
  logger: Logger,
  mediaAssetId: string,
): Promise<{ status: string }> {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaAssetId } });
  if (!asset) {
    logger.warn({ mediaAssetId }, 'media variants: asset missing');
    return { status: 'missing' };
  }

  if (shouldSkipVariants(asset.mimeType)) {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { variantsStatus: 'SKIPPED' },
    });
    return { status: 'skipped' };
  }

  try {
    const original = await getMediaObject(asset.storageKey);
    const built = await buildImageVariants(original);
    const webKey = variantStorageKey(asset.storageKey, 'web');
    const thumbKey = variantStorageKey(asset.storageKey, 'thumb');
    await putMediaObject(webKey, built.web);
    await putMediaObject(thumbKey, built.thumb);

    if (asset.webStorageKey && asset.webStorageKey !== webKey) {
      await deleteMediaObject(asset.webStorageKey);
    }
    if (asset.thumbStorageKey && asset.thumbStorageKey !== thumbKey) {
      await deleteMediaObject(asset.thumbStorageKey);
    }

    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        width: built.width || null,
        height: built.height || null,
        webStorageKey: webKey,
        thumbStorageKey: thumbKey,
        blurDataUrl: built.blurDataUrl,
        variantsStatus: 'READY',
      },
    });
    logger.info(
      { mediaAssetId, webBytes: built.web.length, thumbBytes: built.thumb.length },
      'media variants ready',
    );
    return { status: 'ready' };
  } catch (err) {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { variantsStatus: 'FAILED' },
    });
    throw err;
  }
}
