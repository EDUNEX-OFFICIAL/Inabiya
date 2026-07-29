/** Local saved filter views for Commerce OPS (OPS-9). */

export type OpsSavedView = {
  id: string;
  label: string;
  href: string;
  createdAt: string;
};

const STORAGE_KEY = 'inabiya.ops.savedViews.v1';
const MAX_VIEWS = 12;

function readAll(): OpsSavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OpsSavedView[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(views: OpsSavedView[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views.slice(0, MAX_VIEWS)));
}

export function listSavedViews(pathPrefix?: string): OpsSavedView[] {
  const all = readAll();
  if (!pathPrefix) return all;
  return all.filter((v) => v.href.startsWith(pathPrefix));
}

export function saveCurrentView(label: string, href: string): OpsSavedView {
  const views = readAll().filter((v) => v.href !== href);
  const row: OpsSavedView = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: label.trim().slice(0, 60) || 'Saved view',
    href,
    createdAt: new Date().toISOString(),
  };
  views.unshift(row);
  writeAll(views);
  return row;
}

export function removeSavedView(id: string) {
  writeAll(readAll().filter((v) => v.id !== id));
}
