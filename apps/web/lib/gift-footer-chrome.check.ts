/**
 * Run: npx tsx apps/web/lib/gift-footer-chrome.check.ts
 */
import assert from 'node:assert/strict';
import { formatFooterCopyright } from './gift-footer-chrome';

assert.equal(formatFooterCopyright('© {year} {brand}.', 2026, 'Inabiya'), '© 2026 Inabiya.');
assert.equal(
  formatFooterCopyright(undefined, 2026, 'Inabiya'),
  '© 2026 Inabiya. Soft gifts for tiny humans.',
);
assert.equal(formatFooterCopyright('  ', 2026, 'X'), '© 2026 X. Soft gifts for tiny humans.');

console.log('gift-footer-chrome.check.ts: ok');
