import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const filter = readFileSync(join(__dirname, 'api-exception.filter.ts'), 'utf8');
assert.match(filter, /headersSent/);

const auth = readFileSync(join(__dirname, '../../modules/identity/auth.controller.ts'), 'utf8');
assert.equal(auth.includes('res.status(401).json'), false);
assert.match(auth, /throw new UnauthorizedException/);

console.log('api-exception.filter.headers-sent.check: ok');
