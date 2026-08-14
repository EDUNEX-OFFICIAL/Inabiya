import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cfg = readFileSync(join(__dirname, 'next.config.js'), 'utf8');
assert.match(cfg, /Content-Security-Policy/);
assert.match(cfg, /frame-ancestors 'none'/);
assert.match(cfg, /object-src 'none'/);

console.log('next-csp.check: ok');
