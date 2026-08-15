import assert from 'node:assert/strict';
import { collectCmsFaqJsonLd } from './cms-faq';

const fromItems = collectCmsFaqJsonLd([
  {
    type: 'faq',
    props: {
      items: [{ question: 'When will it ship?', answerHtml: '<p>In 2–3 days.</p>' }],
    },
  },
]);
assert.equal(fromItems?.['@type'], 'FAQPage');

const fromEditor = collectCmsFaqJsonLd([
  {
    type: 'faq',
    props: {
      itemsJson: JSON.stringify([
        { question: 'Can I return it?', answerHtml: 'Yes, within 14 days.' },
      ]),
    },
  },
]);
assert.equal(fromEditor?.['@type'], 'FAQPage');
assert.equal(collectCmsFaqJsonLd([{ type: 'hero', props: {} }]), null);

console.log('cms-faq.check: ok');
