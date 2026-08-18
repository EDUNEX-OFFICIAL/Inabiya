import type { CollisionDetection, UniqueIdentifier } from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';

const CANVAS_DROP_IDS = new Set<UniqueIdentifier>(['canvas-drop', 'canvas-end']);

export function isCanvasDropId(id: UniqueIdentifier | undefined | null): boolean {
  return id != null && CANVAS_DROP_IDS.has(id);
}

/** Prefer a real section over canvas droppables so rows can make space. */
export function collisionsWithoutCanvasDrop<T extends { id: UniqueIdentifier }>(
  collisions: T[],
): T[] {
  return collisions.filter((c) => !isCanvasDropId(c.id));
}

export const cmsCanvasCollision: CollisionDetection = (args) => {
  const closestHits = collisionsWithoutCanvasDrop(closestCenter(args));
  if (closestHits.length > 0) return closestHits;
  return closestCenter(args);
};

export function dropIndexForOver(overId: UniqueIdentifier, clientIds: string[]): number {
  if (isCanvasDropId(overId)) return clientIds.length;
  const i = clientIds.indexOf(String(overId));
  return i >= 0 ? i : clientIds.length;
}

export function toggleSectionPreview(
  selected: number,
  previewOpen: boolean,
  clicked: number,
): { selected: number; previewOpen: boolean } {
  if (clicked === selected && previewOpen) {
    return { selected, previewOpen: false };
  }
  return { selected: clicked, previewOpen: true };
}

export function remapSelectedAfterMove(
  selected: number,
  oldIndex: number,
  newIndex: number,
): number {
  if (selected === oldIndex) return newIndex;
  if (oldIndex < selected && newIndex >= selected) return selected - 1;
  if (oldIndex > selected && newIndex <= selected) return selected + 1;
  return selected;
}
