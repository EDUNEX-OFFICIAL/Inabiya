import assert from 'node:assert/strict';
import {
  collisionsWithoutCanvasDrop,
  dropIndexForOver,
  remapSelectedAfterMove,
  toggleSectionPreview,
} from './cms-canvas-dnd';

assert.deepEqual(
  collisionsWithoutCanvasDrop([
    { id: 'canvas-drop' },
    { id: 'b-1' },
    { id: 'canvas-end' },
    { id: 'b-2' },
  ]),
  [{ id: 'b-1' }, { id: 'b-2' }],
);

const ids = ['a', 'b', 'c'];
assert.equal(dropIndexForOver('canvas-drop', ids), 3);
assert.equal(dropIndexForOver('canvas-end', ids), 3);
assert.equal(dropIndexForOver('b', ids), 1);
assert.equal(dropIndexForOver('missing', ids), 3);

assert.deepEqual(toggleSectionPreview(2, true, 2), { selected: 2, previewOpen: false });
assert.deepEqual(toggleSectionPreview(2, false, 2), { selected: 2, previewOpen: true });
assert.deepEqual(toggleSectionPreview(2, true, 4), { selected: 4, previewOpen: true });

assert.equal(remapSelectedAfterMove(2, 2, 0), 0);
assert.equal(remapSelectedAfterMove(0, 0, 3), 3);
assert.equal(remapSelectedAfterMove(2, 0, 3), 1);
assert.equal(remapSelectedAfterMove(2, 4, 1), 3);
assert.equal(remapSelectedAfterMove(2, 4, 5), 2);
assert.deepEqual(toggleSectionPreview(0, true, 0), { selected: 0, previewOpen: false });

console.log('cms-canvas-dnd.check: ok');
