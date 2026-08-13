import assert from 'node:assert/strict';

/** Mirrors OrdersService addressRisk — keep in sync for OPS-4. */
function addressRisk(addr: unknown): boolean {
  if (!addr || typeof addr !== 'object') return true;
  const a = addr as Record<string, unknown>;
  const line1 = String(a.line1 ?? a.addressLine1 ?? '').trim();
  const city = String(a.city ?? '').trim();
  const phone = String(a.phone ?? a.mobile ?? '').trim();
  const pincode = String(a.pincode ?? a.postalCode ?? a.zip ?? '').trim();
  return !line1 || !city || !phone || !pincode;
}

assert.equal(addressRisk(null), true);
assert.equal(addressRisk({}), true);
assert.equal(addressRisk({ line1: '1 St', city: 'Pune', phone: '999', pincode: '411001' }), false);
assert.equal(addressRisk({ line1: '1 St', city: 'Pune', phone: '999' }), true);

console.log('ops4-address-risk.check: ok');
