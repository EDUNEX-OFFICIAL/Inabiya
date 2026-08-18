/**
 * White-on-CTA pink must meet WCAG AA (4.5:1). Token must exist in gift CSS.
 * Run: npx tsx apps/web/lib/gift-cta-contrast.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function lin(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

assert.ok(contrast('#FFFFFF', '#C44575') >= 4.5, 'CTA fill vs white');
assert.ok(contrast('#FFFFFF', '#A83661') >= 4.5, 'CTA hover vs white');
assert.ok(contrast('#2D2640', '#FFEAF1') >= 4.5, 'heading on blush tag');

const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');
assert.match(css, /--inabiya-pink-cta:\s*#c44575/i);
assert.match(css, /--inabiya-pink-cta-hover:\s*#a83661/i);
assert.match(css, /\[data-theme='gift'\] \.clay-btn \{[\s\S]*--inabiya-pink-cta/);
assert.match(css, /gift-whatsapp-cta__tag \{[\s\S]*color:\s*var\(--inabiya-heading\)/);

const tsx = readFileSync(join(__dirname, '../components/cms/marketing-page-blocks.tsx'), 'utf8');
assert.match(tsx, /role="region"/);
assert.match(tsx, /width=\{264\}/);
assert.match(tsx, /height=\{220\}/);

console.log('gift-cta-contrast.check: ok');
