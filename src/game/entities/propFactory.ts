import type { PropPart } from './InstancedProps';
import type { Theme } from '../../theme/types';
import { PROP_REGISTRY, type PropId } from '../../data/props/propRegistry';

/**
 * Builds and caches a prop's instanceable parts per (theme, prop, variant).
 *
 * Every prop's geometry, materials and textures are created exactly once per
 * theme. Previously each of ~640 tree *instances* allocated its own four
 * materials and re-rasterised its own canvases.
 */
const cache = new Map<string, PropPart[]>();

export function getPropParts(theme: Theme, id: PropId, variant: number): PropPart[] {
  const def = PROP_REGISTRY[id];
  const v = def.variants <= 1 ? 0 : ((variant % def.variants) + def.variants) % def.variants;
  const key = `${theme.id}|${id}|${v}`;

  const hit = cache.get(key);
  if (hit) return hit;

  const parts = def.build({ theme, variant: v });
  cache.set(key, parts);
  return parts;
}

/** Drop all cached prop geometry/materials. Call after a theme switch. */
export function clearPropCache(): void {
  for (const parts of cache.values()) {
    for (const p of parts) p.material.dispose();
  }
  cache.clear();
}

export function propVariantCount(id: PropId): number {
  return Math.max(1, PROP_REGISTRY[id].variants);
}
