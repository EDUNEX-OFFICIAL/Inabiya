import assert from 'node:assert/strict';
import { INSERTER_DEFAULT_PX, INSPECTOR_DEFAULT_PX, PANEL_CLOSE_PX } from './cms-panel-resize';

assert.ok(PANEL_CLOSE_PX < INSERTER_DEFAULT_PX);
assert.ok(PANEL_CLOSE_PX < INSPECTOR_DEFAULT_PX);
assert.equal(INSERTER_DEFAULT_PX, 256);
assert.equal(INSPECTOR_DEFAULT_PX, 384);

console.log('cms-panel-resize.check: ok');
