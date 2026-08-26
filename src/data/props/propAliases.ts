import type { PropId } from './propRegistry';
import type { LegacyPropId } from '../mapTypes';

/**
 * Legacy prop id migration.
 *
 * The original maps were authored against a hardcoded ObjectType union
 * ('tree', 'building', 'fence', ...). Those ids are mapped onto registry ids
 * here so existing map data keeps working while it is migrated, instead of
 * forcing a big-bang rewrite of both map files.
 *
 * Delete an entry once no map references it. `resolvePropId` is the single
 * choke point, so nothing else in the codebase needs to know legacy ids exist.
 */
const ALIASES: Record<LegacyPropId, PropId> = {
  tree: 'tree_oak',
  small_tree: 'tree_small',
  bush: 'bush',
  rock: 'rock_small',
  building: 'house_small',
  building2: 'house_large',
  fence: 'fence_wood',
};

export function resolvePropId(type: PropId | LegacyPropId): PropId {
  return (ALIASES as Record<string, PropId>)[type] ?? (type as PropId);
}
