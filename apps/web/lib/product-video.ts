/** Product PDP video URL classification (YouTube or direct file). */

export type ProductVideoSource =
  { kind: 'youtube'; id: string; url: string } | { kind: 'direct'; url: string };

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'www.youtu.be',
]);

const DIRECT_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

/** 11-char YouTube video id. */
const YT_ID = /^[\w-]{11}$/;

function hostnameOf(raw: string): string | null {
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function extractYoutubeId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Bare id pasted
  if (YT_ID.test(trimmed)) return trimmed;

  let url: URL;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    url = new URL(withProto);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0] ?? '';
    return YT_ID.test(id) ? id : null;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  // /embed/ID, /shorts/ID, /live/ID, /v/ID
  const marker = parts.findIndex(
    (p) => p === 'embed' || p === 'shorts' || p === 'live' || p === 'v',
  );
  if (marker >= 0 && parts[marker + 1]) {
    const id = parts[marker + 1]!;
    if (YT_ID.test(id)) return id;
  }

  const v = url.searchParams.get('v');
  if (v && YT_ID.test(v)) return v;

  return null;
}

function isDirectVideoUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (DIRECT_EXT.test(trimmed)) return true;
  // Soft Gift static / media API paths often omit extension in checks — allow known prefixes
  if (trimmed.startsWith('/gift/media/')) return true;
  if (trimmed.startsWith('/api/v1/media/')) return true;
  if (/^https?:\/\/[^/]+\/api\/v1\/media\//i.test(trimmed)) return true;
  return false;
}

/**
 * Classify a pasted product video URL.
 * Returns null for empty or unsupported links (no arbitrary iframe).
 */
export function parseProductVideoUrl(raw: string | null | undefined): ProductVideoSource | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;

  const yt = extractYoutubeId(trimmed);
  if (yt) {
    return { kind: 'youtube', id: yt, url: trimmed };
  }

  // Reject other http(s) hosts that aren't clearly video files
  const host = hostnameOf(trimmed);
  if (host && YOUTUBE_HOSTS.has(host)) {
    return null; // YouTube host but couldn't parse id
  }

  if (isDirectVideoUrl(trimmed)) {
    return { kind: 'direct', url: trimmed };
  }

  return null;
}

/** Privacy-enhanced embed URL (load only after click). */
export function youtubeNocookieEmbedUrl(id: string, autoplay = true): string {
  const q = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  if (autoplay) q.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${id}?${q.toString()}`;
}

/** Default YouTube thumbnail (hq — balanced size for below-fold PDP). */
export function youtubePosterUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function isValidProductVideoUrl(raw: string | null | undefined): boolean {
  return parseProductVideoUrl(raw) != null;
}
