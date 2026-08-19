import { ARTICLE_STATUS_LABEL } from '@/lib/editorial-nav';

const PIPELINE = ['ASSIGNED', 'DRAFT', 'SEO_REVIEW', 'MEDICAL_REVIEW', 'APPROVED', 'PUBLISHED'];

export function EditorialStatusRail({
  status,
  medicalGate,
  spread = false,
}: {
  status: string;
  medicalGate: boolean;
  spread?: boolean;
}) {
  const steps = medicalGate ? PIPELINE : PIPELINE.filter((s) => s !== 'MEDICAL_REVIEW');
  const current =
    status === 'SCHEDULED' ? 'PUBLISHED' : status === 'CHANGES_REQUESTED' ? 'DRAFT' : status;
  const idx = steps.indexOf(current);

  return (
    <ol
      className={`editorial-rail${spread ? ' editorial-rail--spread' : ''}`}
      aria-label="Workflow"
    >
      {steps.map((s, i) => {
        const kind = idx < 0 ? 'is-todo' : i < idx ? 'is-done' : i === idx ? 'is-current' : 'is-todo';
        return (
          <li key={s} className={kind}>
            {ARTICLE_STATUS_LABEL[s] ?? s}
          </li>
        );
      })}
      {status === 'CHANGES_REQUESTED' ? (
        <li className="is-current">{ARTICLE_STATUS_LABEL.CHANGES_REQUESTED}</li>
      ) : null}
      {status === 'SCHEDULED' ? (
        <li className="is-current">{ARTICLE_STATUS_LABEL.SCHEDULED}</li>
      ) : null}
    </ol>
  );
}
