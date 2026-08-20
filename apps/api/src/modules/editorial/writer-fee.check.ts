import assert from 'node:assert/strict';
import {
  canSeeWriterFee,
  defaultWriterFeePaise,
  writerFeeForPayment,
  WRITER_FEE_PAISE_FALLBACK,
} from './writer-fee';

assert.equal(defaultWriterFeePaise(), WRITER_FEE_PAISE_FALLBACK);
assert.equal(writerFeeForPayment(75000), 75000);
assert.equal(writerFeeForPayment(-1), WRITER_FEE_PAISE_FALLBACK);
assert.equal(writerFeeForPayment(1.5 as unknown as number), WRITER_FEE_PAISE_FALLBACK);
assert.equal(canSeeWriterFee(['WRITER']), false);
assert.equal(canSeeWriterFee(['SEO_EDITOR']), false);
assert.equal(canSeeWriterFee(['MEDICAL_REVIEWER']), false);
assert.equal(canSeeWriterFee(['CONTENT_ADMIN']), true);
assert.equal(canSeeWriterFee(['FINANCE']), true);
assert.equal(canSeeWriterFee(['SUPER_ADMIN']), true);

console.log('writer-fee.check: ok');
