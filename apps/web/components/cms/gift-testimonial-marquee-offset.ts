/** Pixel speed — left column slower, right a bit faster (not frantic). */
export const TESTIMONIAL_MARQUEE_PX = { slow: 16, fast: 24 } as const;

/** When the lead card has fully left, shift offset so moving it to the end is seamless. */
export function shiftMarqueeOffset(
  offset: number,
  leadHeight: number,
): { offset: number; shift: boolean } {
  if (leadHeight <= 0 || offset < leadHeight) return { offset, shift: false };
  return { offset: offset - leadHeight, shift: true };
}
