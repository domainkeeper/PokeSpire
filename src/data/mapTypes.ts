import type { Direction } from '../types/game';
import type { PokemonSpeciesKey } from './pokemon/pokemonSprites';
import type { PropId } from './props/propRegistry';
import type { Theme } from '../theme/types';
import type { EncounterZone } from './world/worldTypes';

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export type TileType = 'grass' | 'path' | 'water' | 'dirt' | 'sand';

/**
 * A placed prop. `type` is keyed into PROP_REGISTRY, so the collision footprint,
 * height, variant count and geometry all come from the registry - map data only
 * says WHAT and WHERE.
 */
export type LegacyPropId = 'tree' | 'small_tree' | 'bush' | 'rock' | 'building' | 'building2' | 'fence';

export interface MapObject {
  type: PropId | LegacyPropId;
  gx: number;
  gy: number;
  /**
   * Optional override of the registry footprint (rare; e.g. a stretched fence
   * run). Collision and visual centring both use the effective footprint.
   */
  footprintW?: number;
  footprintH?: number;
  /** Optional override of the registry `solid` flag. */
  solid?: boolean;
  /** Pin a specific visual variant instead of deriving one from position. */
  variant?: number;
  /** Extra yaw in radians, on top of any deterministic random yaw. */
  yaw?: number;
  /** Uniform scale multiplier. */
  scale?: number;
  /** Legacy authored fields accepted during map migration. */
  collision?: boolean;
  spriteW?: number;
  spriteH?: number;
  anchorX?: number;
  anchorY?: number;
  animScale?: boolean;
  animSway?: boolean;
}

export interface MapExit {
  x: number;
  y: number;
  w: number;
  h: number;
  toMap: string;
  spawnX: number;
  spawnY: number;
  facing: Direction;
}

export interface PokemonEncounter {
  species: PokemonSpeciesKey;
  gx: number;
  gy: number;
}

export interface NpcSpawn {
  x: number;
  y: number;
  name: string;
  dialogue: string;
  /** Explicit tint; falls back to a role tint derived from `name`. */
  color?: string;
}

export interface ThemeRegion {
  /** X range (inclusive) where this theme applies. */
  x0: number;
  x1: number;
  themeId: string;
}

export interface GameMap {
  name: string;
  width: number;
  height: number;
  /** Which registered Theme this map renders with. */
  themeId?: string;
  /** Per-region themes. If set, overrides themeId based on player X position. */
  regionThemes?: ThemeRegion[];
  /** Legacy scene hint; themeId is authoritative for new maps. */
  backgroundType?: 'town' | 'route';
  /** Ground texture pixels per micro-tile. Default 8. Must keep width*ppt<=4096. */
  pixelsPerTile?: number;
  /** Per-map partial theme patch, deep-merged onto the base theme at render. */
  themeOverride?: DeepPartial<Theme>;
  /** Inert encounter data (no battle logic yet). */
  encounterZones?: EncounterZone[];
  /** Region id, for the region atlas. */
  regionId?: string;
  /** Tile offset of this map within its region atlas. */
  layout?: { worldX: number; worldY: number };
  ground: TileType[][];
  /**
   * Terrain elevation in integer steps per micro-tile. Positive = higher.
   * Omitted means flat. Differences greater than MAX_CLIMB_STEPS become cliffs
   * and block movement automatically.
   */
  elevation?: number[][];
  objects: MapObject[];
  spawn: { x: number; y: number; facing: Direction };
  exits: MapExit[];
  npcPositions: NpcSpawn[];
  pokemon?: PokemonEncounter[];
}

/** Resolve the theme for a given X position on a map. */
export function resolveThemeId(map: GameMap, playerX?: number): string | undefined {
  if (map.regionThemes && playerX !== undefined) {
    for (const r of map.regionThemes) {
      if (playerX >= r.x0 && playerX <= r.x1) return r.themeId;
    }
  }
  return map.themeId;
}
