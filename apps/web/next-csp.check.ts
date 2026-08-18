import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cfg = readFileSync(join(__dirname, 'next.config.js'), 'utf8');
assert.match(cfg, /Content-Security-Policy/);
assert.match(cfg, /frame-ancestors 'none'/);
assert.match(cfg, /object-src 'none'/);
assert.match(cfg, /unsafe-eval/);
assert.match(cfg, /isDev/);
assert.match(cfg, /NODE_ENV !== 'production'/);
assert.match(cfg, /checkout\.razorpay\.com/);
assert.match(cfg, /www\.googletagmanager\.com/);
assert.match(cfg, /www\.google-analytics\.com/);
assert.match(cfg, /connect\.facebook\.net/);
assert.match(cfg, /connect-src/);
assert.doesNotMatch(cfg, /fonts\.googleapis\.com/);
assert.doesNotMatch(cfg, /fonts\.gstatic\.com/);
assert.doesNotMatch(cfg, /cloudflareinsights/);
assert.match(cfg, /font-src 'self'/);
assert.match(cfg, /\/brand\/:path\*/);
assert.match(cfg, /\/gift\/media\/:path\*/);

console.log('next-csp.check: ok');
