import type { CatalogProduct } from '@/lib/catalog';

/** Product FAQ rows for PDP accordion + FAQPage JSON-LD (admin overrides or built-in). */
export function buildProductFaqItems(
  product: Pick<
    CatalogProduct,
    'faqItems' | 'personalization' | 'isReadyMadeHamper' | 'description'
  >,
): Array<{ question: string; answerText: string }> {
  if (product.faqItems && product.faqItems.length > 0) {
    return product.faqItems;
  }
  const items: Array<{ question: string; answerText: string }> = [];
  const canPersonalise = (product.personalization?.length ?? 0) > 0;

  if (canPersonalise) {
    const labels = product.personalization
      .map((o) => o.label)
      .filter(Boolean)
      .slice(0, 4);
    items.push({
      question: 'Can I personalise this gift?',
      answerText: labels.length
        ? `Yes — on this product you can set ${labels.join(', ')}. Turn on personalisation in the buy box before adding to cart; required fields must be filled to continue.`
        : 'Yes — toggle personalisation in the buy box and fill the fields before adding to cart. Required fields must be completed to continue.',
    });
  } else {
    items.push({
      question: 'Is this gift personalised?',
      answerText:
        'This listing ships as shown. For name embroidery or custom options, browse other Soft Gift products with a Personalise toggle, or build a custom box.',
    });
  }

  items.push({
    question: 'How long does shipping take?',
    answerText:
      'We prepare Soft Gift orders carefully and ship across India. Delivery timing is confirmed at checkout for your pincode; express options appear when available.',
  });

  items.push({
    question: 'What is your return policy?',
    answerText: canPersonalise
      ? 'Returns open for 14 days after delivery. Personalised items may have limited return eligibility — check your order page for status and how to request a return.'
      : 'Returns open for 14 days after delivery. Start a return from your order page once the gift is delivered.',
  });

  if (product.isReadyMadeHamper) {
    items.push({
      question: 'What comes in this hamper?',
      answerText:
        product.description?.trim() ||
        'This is a ready-made Soft Gift hamper — curated pieces packed together. See the description above for what’s included.',
    });
  } else {
    items.push({
      question: 'Can I send this as a gift?',
      answerText:
        'Yes. Buy now, add to cart, or add to gift box, then enter the recipient address at checkout. You can also Build Your Box for a custom mix of Soft Gift pieces.',
    });
  }

  return items;
}
