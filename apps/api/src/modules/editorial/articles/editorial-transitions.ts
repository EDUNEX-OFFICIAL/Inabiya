import { ArticleStatus } from '@prisma/client';

export type TransitionActor = { id: string; roles: string[] };

function isOps(roles: string[]): boolean {
  return roles.includes('CONTENT_ADMIN') || roles.includes('SUPER_ADMIN');
}

/** Content admin can edit live copy (commerce product save). Writer only in draft states. */
export function canEditArticleBody(
  status: ArticleStatus,
  actor: TransitionActor,
  assigneeId?: string | null,
): boolean {
  if (isOps(actor.roles)) return true;
  if (!actor.roles.includes('WRITER') || assigneeId !== actor.id) return false;
  return (
    status === ArticleStatus.ASSIGNED ||
    status === ArticleStatus.DRAFT ||
    status === ArticleStatus.CHANGES_REQUESTED
  );
}

/** Workflow buttons only — never PUBLISHED/SCHEDULED (those go through PublishingService). */
export function allowedArticleTransitions(
  from: ArticleStatus,
  medicalRequired: boolean,
  actor: TransitionActor,
  assigneeId?: string | null,
): ArticleStatus[] {
  const isWriter = isOps(actor.roles) || (actor.roles.includes('WRITER') && assigneeId === actor.id);
  const isSeo = actor.roles.includes('SEO_EDITOR') || isOps(actor.roles);
  const isMed = actor.roles.includes('MEDICAL_REVIEWER');

  const out: ArticleStatus[] = [];
  switch (from) {
    case ArticleStatus.ASSIGNED:
      if (isWriter) out.push(ArticleStatus.DRAFT);
      break;
    case ArticleStatus.DRAFT:
    case ArticleStatus.CHANGES_REQUESTED:
      if (isWriter) out.push(ArticleStatus.SEO_REVIEW);
      break;
    case ArticleStatus.SEO_REVIEW:
      if (isSeo) {
        out.push(ArticleStatus.CHANGES_REQUESTED);
        out.push(medicalRequired ? ArticleStatus.MEDICAL_REVIEW : ArticleStatus.APPROVED);
      }
      break;
    case ArticleStatus.MEDICAL_REVIEW:
      if (isMed) {
        out.push(ArticleStatus.CHANGES_REQUESTED);
        out.push(ArticleStatus.APPROVED);
      }
      break;
    case ArticleStatus.APPROVED:
    case ArticleStatus.SCHEDULED:
    case ArticleStatus.PUBLISHED:
      break;
    default:
      break;
  }
  return out;
}

export type PublishBlockCode = 'NOT_APPROVED' | 'MEDICAL_GATE_REQUIRED';

export function publishBlockReason(article: {
  status: ArticleStatus;
  medicalGateRequired: boolean;
  statusHistory: Array<{ status: ArticleStatus }>;
}): PublishBlockCode | null {
  if (article.status !== ArticleStatus.APPROVED && article.status !== ArticleStatus.SCHEDULED) {
    return 'NOT_APPROVED';
  }
  if (article.medicalGateRequired) {
    const passed = article.statusHistory.some((h) => h.status === ArticleStatus.MEDICAL_REVIEW);
    if (!passed) return 'MEDICAL_GATE_REQUIRED';
  }
  return null;
}
