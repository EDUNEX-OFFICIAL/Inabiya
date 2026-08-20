export type ArticleTimelineKind =
  | 'status'
  | 'comment'
  | 'change_request'
  | 'edit'
  | 'details'
  | 'payment';

export type ArticleTimelineItem = {
  at: string;
  kind: ArticleTimelineKind;
  label: string;
  actorName: string | null;
  detail: string | null;
  status?: string;
  amountPaise?: number;
};

function iso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}

function actorLabel(actor: { displayName: string | null; email: string } | null | undefined): string | null {
  if (!actor) return null;
  return actor.displayName?.trim() || actor.email || null;
}

export function buildArticleTimeline(input: {
  statusHistory: Array<{
    status: string;
    note: string | null;
    createdAt: Date | string;
    actor?: { displayName: string | null; email: string } | null;
  }>;
  comments: Array<{
    kind: string;
    body: string;
    createdAt: Date | string;
    author: { displayName: string | null; email: string };
  }>;
  revisions: Array<{
    source: string;
    createdAt: Date | string;
    actor?: { displayName: string | null; email: string } | null;
  }>;
  payment?: {
    status: string;
    amountPaise: number;
    createdAt: Date | string;
    releasedAt: Date | string | null;
  } | null;
  includePayment: boolean;
}): ArticleTimelineItem[] {
  const items: ArticleTimelineItem[] = [];

  for (const h of input.statusHistory) {
    items.push({
      at: iso(h.createdAt),
      kind: 'status',
      label: h.status,
      status: h.status,
      actorName: actorLabel(h.actor),
      detail: h.note,
    });
  }

  for (const c of input.comments) {
    const change = c.kind === 'CHANGE_REQUEST';
    items.push({
      at: iso(c.createdAt),
      kind: change ? 'change_request' : 'comment',
      label: change ? 'Change request' : 'Comment',
      actorName: actorLabel(c.author),
      detail: c.body,
    });
  }

  for (const r of input.revisions) {
    if (r.source === 'AUTO') continue;
    const details = r.source === 'META';
    items.push({
      at: iso(r.createdAt),
      kind: details ? 'details' : 'edit',
      label: details ? 'Updated details' : 'Edited',
      actorName: actorLabel(r.actor),
      detail: null,
    });
  }

  if (input.includePayment && input.payment) {
    items.push({
      at: iso(input.payment.createdAt),
      kind: 'payment',
      label: 'Payment pending',
      actorName: null,
      detail: null,
      amountPaise: input.payment.amountPaise,
    });
    if (input.payment.releasedAt) {
      items.push({
        at: iso(input.payment.releasedAt),
        kind: 'payment',
        label: 'Payment released',
        actorName: null,
        detail: null,
        amountPaise: input.payment.amountPaise,
      });
    }
  }

  items.sort((a, b) => a.at.localeCompare(b.at));
  return items;
}
