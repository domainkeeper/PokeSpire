import type { Direction } from '../types/game';
import type { PokemonSpeciesKey } from './pokemon/pokemonSprites';
import type { PropId } from './props/propRegistry';

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

export interface GameMap {
  name: string;
  width: number;
  height: number;
  /** Which registered Theme this map renders with. */
  themeId?: string;
  /** Legacy scene hint; themeId is authoritative for new maps. */
  backgroundType?: 'town' | 'route';
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
