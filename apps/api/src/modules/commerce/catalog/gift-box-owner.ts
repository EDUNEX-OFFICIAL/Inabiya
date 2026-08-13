/** Actor that may own a gift box: logged-in user, or guest token (never both in where). */

export type GiftBoxActor = {
  userId?: string;
  guestToken?: string;
};

/** Prefer userId when signed in so a stale guest token cannot IDOR another box. */
export function giftBoxOwnerWhere(
  actor: GiftBoxActor,
): { userId: string } | { guestToken: string } | null {
  if (actor.userId) return { userId: actor.userId };
  const token = actor.guestToken?.trim();
  if (!token || token.length > 80) return null;
  return { guestToken: token };
}

export function giftBoxAccessWhere(
  boxId: string,
  actor: GiftBoxActor,
): { id: string; userId: string } | { id: string; guestToken: string } | null {
  const owner = giftBoxOwnerWhere(actor);
  if (!owner) return null;
  return { id: boxId, ...owner };
}
