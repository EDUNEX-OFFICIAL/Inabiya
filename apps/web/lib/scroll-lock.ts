/**
 * Lock background scroll without layout shift.
 *
 * Requires `html { scrollbar-gutter: stable }` in globals.css.
 * Never add paddingRight on top of the gutter — that double-compensates and
 * creates horizontal overflow (the “weird” shift + bottom scrollbar).
 */
export function lockPageScroll(): () => void {
  const html = document.documentElement;
  const prevOverflow = html.style.overflow;
  const prevOverscroll = html.style.overscrollBehavior;

  html.classList.add('scroll-locked');
  html.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';

  return () => {
    html.classList.remove('scroll-locked');
    html.style.overflow = prevOverflow;
    html.style.overscrollBehavior = prevOverscroll;
  };
}
