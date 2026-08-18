/**
 * Run: npx tsx apps/web/lib/gift-footer-chrome.check.ts
 */
import assert from 'node:assert/strict';
import {
  FOOTER_DEVELOPER_CREDIT,
  composeCopyrightTpl,
  formatFooterCopyright,
  parseCopyrightTpl,
} from './gift-footer-chrome';

assert.equal(FOOTER_DEVELOPER_CREDIT.prefix, 'Developed with');
assert.equal(FOOTER_DEVELOPER_CREDIT.mid, 'By');
assert.equal(FOOTER_DEVELOPER_CREDIT.label, 'EDUNEX');
assert.equal(FOOTER_DEVELOPER_CREDIT.href, 'https://edunexservices.in');

assert.equal(formatFooterCopyright('© {year} {brand}.', 2026, 'Inabiya'), '© 2026 Inabiya.');
assert.equal(
  formatFooterCopyright(undefined, 2026, 'Inabiya'),
  '© 2026 Inabiya. Soft gifts for tiny humans.',
);
assert.equal(formatFooterCopyright('  ', 2026, 'X'), '© 2026 X. Soft gifts for tiny humans.');

const auto = parseCopyrightTpl('© {year} {brand}. Soft gifts for tiny humans.');
assert.equal(auto.yearAuto, true);
assert.equal(auto.suffix, 'Soft gifts for tiny humans.');
assert.equal(composeCopyrightTpl(auto), '© {year} {brand}. Soft gifts for tiny humans.');

const fixed = parseCopyrightTpl('© 2024 {brand}. Hello.');
assert.equal(fixed.yearAuto, false);
assert.equal(fixed.yearFixed, 2024);
assert.equal(fixed.suffix, 'Hello.');
assert.equal(composeCopyrightTpl(fixed), '© 2024 {brand}. Hello.');

assert.equal(
  formatFooterCopyright(composeCopyrightTpl(fixed), 2099, 'Inabiya'),
  '© 2024 Inabiya. Hello.',
);

console.log('gift-footer-chrome.check.ts: ok');
