import type { LayerElement } from '../../shared/types';

export type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ElementDiff {
  id: string;
  type: ChangeType;
  oldElement?: LayerElement;
  newElement?: LayerElement;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

export interface VersionDiffResult {
  oldVersionName: string;
  newVersionName: string;
  elementDiffs: ElementDiff[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

export function compareElements(
  oldElements: LayerElement[],
  newElements: LayerElement[]
): ElementDiff[] {
  const diffs: ElementDiff[] = [];
  const oldElementMap = new Map(oldElements.map((el) => [el.id, el]));
  const newElementMap = new Map(newElements.map((el) => [el.id, el]));
  const processedIds = new Set<string>();

  for (const newElement of newElements) {
    processedIds.add(newElement.id);
    const oldElement = oldElementMap.get(newElement.id);

    if (!oldElement) {
      diffs.push({
        id: newElement.id,
        type: 'added',
        newElement,
      });
    } else {
      const changes = detectElementChanges(oldElement, newElement);
      if (changes.length > 0) {
        diffs.push({
          id: newElement.id,
          type: 'modified',
          oldElement,
          newElement,
          changes,
        });
      } else {
        diffs.push({
          id: newElement.id,
          type: 'unchanged',
          oldElement,
          newElement,
        });
      }
    }
  }

  for (const oldElement of oldElements) {
    if (processedIds.has(oldElement.id)) continue;

    diffs.push({
      id: oldElement.id,
      type: 'removed',
      oldElement,
    });
  }

  return diffs;
}

function detectElementChanges(
  oldElement: LayerElement,
  newElement: LayerElement
): { field: string; oldValue: unknown; newValue: unknown }[] {
  const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];
  const fieldsToCheck: (keyof LayerElement)[] = ['x', 'y', 'width', 'height', 'text', 'visible', 'opacity'];

  for (const field of fieldsToCheck) {
    const oldValue = oldElement[field];
    const newValue = newElement[field];

    if (typeof oldValue === 'number' && typeof newValue === 'number') {
      if (Math.abs(oldValue - newValue) > 0.1) {
        changes.push({ field, oldValue, newValue });
      }
    } else if (oldValue !== newValue) {
      changes.push({ field, oldValue, newValue });
    }
  }

  return changes;
}

export function computeDiffSummary(diffs: ElementDiff[]) {
  return {
    added: diffs.filter((d) => d.type === 'added').length,
    removed: diffs.filter((d) => d.type === 'removed').length,
    modified: diffs.filter((d) => d.type === 'modified').length,
    unchanged: diffs.filter((d) => d.type === 'unchanged').length,
  };
}

export function getDiffBoundingBox(diffs: ElementDiff[]) {
  const changedElements = diffs.filter((d) => d.type !== 'unchanged');
  if (changedElements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const diff of changedElements) {
    const element = diff.newElement || diff.oldElement;
    if (!element) continue;

    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  }

  return {
    x: minX - 50,
    y: minY - 50,
    width: maxX - minX + 100,
    height: maxY - minY + 100,
  };
}

export const changeTypeColors: Record<ChangeType, { fill: string; stroke: string }> = {
  added: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22C55E' },
  removed: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444' },
  modified: { fill: 'rgba(245, 158, 11, 0.3)', stroke: '#F59E0B' },
  unchanged: { fill: 'transparent', stroke: 'transparent' },
};

export const changeTypeLabels: Record<ChangeType, string> = {
  added: '新增',
  removed: '删除',
  modified: '修改',
  unchanged: '未变',
};
