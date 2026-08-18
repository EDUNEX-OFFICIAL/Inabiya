import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { dirname, join, sep } from 'path';

export function mediaRootDir(): string {
  const fromEnv = process.env.MEDIA_LOCAL_ROOT?.trim();
  if (fromEnv) return fromEnv;
  const cwd = process.cwd();
  if (cwd.endsWith(`${sep}apps${sep}worker`) || cwd.endsWith('/apps/worker')) {
    return join(cwd, '..', 'api', '.data', 'media');
  }
  return join(cwd, '.data', 'media');
}

function absolutePath(key: string): string {
  const safe = key.replace(/\.\./g, '').replace(/^\/+/, '');
  return join(mediaRootDir(), safe);
}

export async function putMediaObject(key: string, body: Buffer): Promise<void> {
  const abs = absolutePath(key);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, body);
}

export async function getMediaObject(key: string): Promise<Buffer> {
  return readFile(absolutePath(key));
}

export async function deleteMediaObject(key: string): Promise<void> {
  try {
    await unlink(absolutePath(key));
  } catch {
    // idempotent
  }
}
