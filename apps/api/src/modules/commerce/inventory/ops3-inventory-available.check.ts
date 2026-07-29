import assert from 'node:assert/strict';

/** Mirrors InventoryService available rule for OPS-3. */
function wouldMakeAvailableNegative(onHand: number, reserved: number, delta: number): boolean {
  const next = onHand + delta;
  return next < 0 || next < reserved;
}

assert.equal(wouldMakeAvailableNegative(5, 2, -4), true); // 1 < 2
assert.equal(wouldMakeAvailableNegative(5, 2, -3), false); // 2 >= 2
assert.equal(wouldMakeAvailableNegative(5, 0, -6), true); // negative onHand
assert.equal(wouldMakeAvailableNegative(5, 0, 3), false);

console.log('ops3-inventory-available.check: ok');
