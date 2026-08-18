import { Star } from 'lucide-react';

export const TESTIMONIAL_TONES = ['pink', 'mint', 'sky'] as const;

export type TestimonialItem = {
  quote: string;
  author: string;
  role: string;
  rating: number;
  dated: string;
  idx: number;
};

export function testimonialTone(idx: number) {
  return TESTIMONIAL_TONES[idx % TESTIMONIAL_TONES.length] ?? 'pink';
}

/** Seed/demo authors — CMS `dated` wins when present. */
export const TESTIMONIAL_FALLBACK_DATES: Record<string, string> = {
  Anaya: '2026-07-18',
  Rohan: '2026-07-04',
  Kavya: '2026-06-22',
  Meera: '2026-06-11',
  Arjun: '2026-05-28',
  Nisha: '2026-05-14',
  Vikram: '2026-04-30',
  Diya: '2026-04-12',
  Priya: '2026-03-26',
  Sameer: '2026-03-08',
  Tara: '2026-02-19',
  Ishaan: '2026-02-03',
};

export function resolveTestimonialDated(author: string, dated: string): string {
  const explicit = dated.trim();
  if (explicit) return explicit;
  return TESTIMONIAL_FALLBACK_DATES[author] ?? '';
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function formatTestimonialDate(raw: string): { label: string; dateTime?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { label: '' };
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return { label: trimmed };
  const d = new Date(ms);
  // UTC so Node ICU vs Chrome Intl cannot drift (React #425).
  const label = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return {
    label,
    dateTime: trimmed.length <= 10 ? trimmed : d.toISOString().slice(0, 10),
  };
}

export function TestimonialCard({ item, loopCopy }: { item: TestimonialItem; loopCopy?: boolean }) {
  const tone = testimonialTone(item.idx);
  const initials = item.author
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const stamp = item.dated ? formatTestimonialDate(item.dated) : null;
  return (
    <li
      className={
        {
          pink: 'gift-testimonial-card gift-testimonial-card--pink',
          mint: 'gift-testimonial-card gift-testimonial-card--mint',
          sky: 'gift-testimonial-card gift-testimonial-card--sky',
        }[tone] + (loopCopy ? ' gift-testimonial-card--loop' : '')
      }
      aria-hidden={loopCopy || undefined}
    >
      <span className="gift-testimonial-card__mark" aria-hidden>
        “
      </span>
      <div className="gift-testimonial-card__top">
        <div className="gift-testimonial-card__stars" aria-label={`${item.rating} out of 5 stars`}>
          {Array.from({ length: item.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
          ))}
        </div>
        {stamp?.label ? (
          <time className="gift-testimonial-card__date" dateTime={stamp.dateTime}>
            {stamp.label}
          </time>
        ) : null}
      </div>
      <p className="gift-testimonial-card__quote">{item.quote}</p>
      <div className="gift-testimonial-card__author-row">
        <span className="gift-testimonial-card__avatar" aria-hidden>
          {initials}
        </span>
        <div className="gift-testimonial-card__who">
          <p className="gift-testimonial-card__author">{item.author}</p>
          {item.role ? <p className="gift-testimonial-card__role">{item.role}</p> : null}
        </div>
      </div>
    </li>
  );
}
