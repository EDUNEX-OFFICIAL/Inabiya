/** Admin promotions condition helpers (Shopify-like gates + line match). */

export type CouponMatchField =
  'recipient' | 'age' | 'occasion' | 'hamper' | 'label' | 'onSale' | 'brand' | 'titleContains';

export type CouponMatchOp = 'is' | 'is_not' | 'contains';

export type CouponMatchCondition = {
  field: CouponMatchField;
  op: CouponMatchOp;
  value: string;
};

export type CouponMatchRules = { match: 'all' | 'any'; conditions: CouponMatchCondition[] };

export type CouponEligibilityField =
  | 'cartQty'
  | 'matchingQty'
  | 'maxSubtotalPaise'
  | 'firstOrder'
  | 'returningCustomer'
  | 'shippingMethod';

export type CouponEligibilityOp = 'is' | 'is_not' | 'gte' | 'lte';

export type CouponEligibilityCondition = {
  field: CouponEligibilityField;
  op: CouponEligibilityOp;
  value: string;
};

export type CouponEligibility = {
  match: 'all' | 'any';
  conditions: CouponEligibilityCondition[];
};

export const EMPTY_MATCH_RULES: CouponMatchRules = {
  match: 'all',
  conditions: [{ field: 'recipient', op: 'is', value: 'girl' }],
};

export const EMPTY_ELIGIBILITY: CouponEligibility = { match: 'all', conditions: [] };

export const MATCH_FIELD_OPTS: Array<{ value: CouponMatchField; label: string }> = [
  { value: 'recipient', label: 'Gift for' },
  { value: 'age', label: 'Age band' },
  { value: 'occasion', label: 'Occasion' },
  { value: 'hamper', label: 'Ready-made hamper' },
  { value: 'label', label: 'Storefront badge' },
  { value: 'onSale', label: 'On sale' },
  { value: 'brand', label: 'Brand' },
  { value: 'titleContains', label: 'Title' },
];

export const ELIGIBILITY_FIELD_OPTS: Array<{ value: CouponEligibilityField; label: string }> = [
  { value: 'cartQty', label: 'Cart units' },
  { value: 'matchingQty', label: 'Matching units' },
  { value: 'maxSubtotalPaise', label: 'Max eligible ₹' },
  { value: 'firstOrder', label: 'First order' },
  { value: 'returningCustomer', label: 'Returning customer' },
  { value: 'shippingMethod', label: 'Shipping' },
];

export function defaultMatchOp(field: CouponMatchField): CouponMatchOp {
  if (field === 'titleContains' || field === 'brand') return 'contains';
  return 'is';
}

export function defaultMatchValue(field: CouponMatchField): string {
  switch (field) {
    case 'recipient':
      return 'girl';
    case 'age':
      return 'newborn';
    case 'occasion':
      return 'welcome-baby';
    case 'hamper':
    case 'onSale':
      return 'yes';
    case 'label':
      return 'BESTSELLER';
    case 'brand':
    case 'titleContains':
      return '';
  }
}

export function matchValueOptions(
  field: CouponMatchField,
): Array<{ value: string; label: string }> | null {
  switch (field) {
    case 'recipient':
      return [
        { value: 'girl', label: 'Baby girl' },
        { value: 'boy', label: 'Baby boy' },
        { value: 'mom', label: 'Expecting / new mom' },
        { value: 'unisex', label: 'Unisex' },
      ];
    case 'age':
      return [
        { value: 'newborn', label: 'Newborn' },
        { value: 'infant', label: 'Infant' },
        { value: 'toddler', label: 'Toddler' },
        { value: 'any', label: 'Any age' },
      ];
    case 'occasion':
      return [
        { value: 'welcome-baby', label: 'Welcome baby' },
        { value: 'baby-shower', label: 'Baby shower' },
        { value: 'naming', label: 'Naming ceremony' },
        { value: 'birthday', label: 'Birthday' },
      ];
    case 'hamper':
    case 'onSale':
      return [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ];
    case 'label':
      return [
        { value: 'BESTSELLER', label: 'Bestseller' },
        { value: 'EDITORS_PICK', label: "Editor's pick" },
        { value: 'GIFT_SET', label: 'Gift set' },
      ];
    default:
      return null;
  }
}

export function matchOpOptions(
  field: CouponMatchField,
): Array<{ value: CouponMatchOp; label: string }> {
  if (field === 'titleContains') return [{ value: 'contains', label: 'contains' }];
  if (field === 'brand') {
    return [
      { value: 'contains', label: 'contains' },
      { value: 'is', label: 'is' },
      { value: 'is_not', label: 'is not' },
    ];
  }
  return [
    { value: 'is', label: 'include' },
    { value: 'is_not', label: 'exclude' },
  ];
}

export function defaultEligibilityOp(field: CouponEligibilityField): CouponEligibilityOp {
  if (field === 'cartQty' || field === 'matchingQty') return 'gte';
  if (field === 'maxSubtotalPaise') return 'lte';
  return 'is';
}

export function defaultEligibilityValue(field: CouponEligibilityField): string {
  switch (field) {
    case 'cartQty':
    case 'matchingQty':
      return '2';
    case 'maxSubtotalPaise':
      return '5000';
    case 'firstOrder':
    case 'returningCustomer':
      return 'yes';
    case 'shippingMethod':
      return 'STANDARD';
  }
}

export function eligibilityValueOptions(
  field: CouponEligibilityField,
): Array<{ value: string; label: string }> | null {
  if (field === 'firstOrder' || field === 'returningCustomer') {
    return [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ];
  }
  if (field === 'shippingMethod') {
    return [
      { value: 'STANDARD', label: 'Standard' },
      { value: 'EXPRESS', label: 'Express' },
    ];
  }
  return null;
}

export function eligibilityOpOptions(
  field: CouponEligibilityField,
): Array<{ value: CouponEligibilityOp; label: string }> {
  if (field === 'cartQty' || field === 'matchingQty') {
    return [
      { value: 'gte', label: 'at least' },
      { value: 'lte', label: 'at most' },
    ];
  }
  if (field === 'maxSubtotalPaise') return [{ value: 'lte', label: 'at most' }];
  return [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
  ];
}

export function eligibilityToApi(rules: CouponEligibility): CouponEligibility | undefined {
  const conditions = rules.conditions
    .filter((c) => c.value.trim())
    .map((c) => {
      if (c.field !== 'maxSubtotalPaise') return c;
      const rupees = Number(c.value);
      const paise = Math.round((Number.isFinite(rupees) ? rupees : 0) * 100);
      return { ...c, value: String(Math.max(1, paise)) };
    });
  if (!conditions.length) return undefined;
  return { match: rules.match, conditions };
}
