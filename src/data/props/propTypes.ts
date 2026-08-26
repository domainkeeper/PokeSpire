import type { Theme } from '../../theme/types';
import type { PropPart } from '../../game/entities/InstancedProps';

/**
 * Prop definition contract.
 *
 * Adding a prop to the game = adding ONE entry to PROP_REGISTRY. Nothing in the
 * renderer, collision system or map loader needs to change: MapObject.type is
 * typed as `keyof typeof PROP_REGISTRY`, so a new id is immediately available to
 * map data with full autocomplete, and the renderer instances it automatically.
 */

export interface PropBuildContext {
  theme: Theme;
  /** 0 .. def.variants-1 */
  variant: number;
}

export interface PropDef {
  /** Human label, for editors/debug overlays. */
  name: string;

  /** Collision footprint in micro-tiles. Also used to centre the visual. */
  footprint: { w: number; h: number };

  /** Blocks movement. Trees/houses/rocks true; flowers/grass false. */
  solid: boolean;

  /** Approximate visual height in world units. Used for camera/occlusion logic. */
  height: number;

  /** How many visual variants exist; instances are bucketed per variant. */
  variants: number;

  /** Allow deterministic random yaw per instance. */
  randomYaw?: boolean;

  /** [min, max] deterministic per-instance uniform scale. */
  scaleJitter?: readonly [number, number];

  /** Radius of the soft contact shadow blob, world units. 0/undefined = none. */
  contactShadow?: number;

  /**
   * Whether the prop should be re-grounded onto the terrain surface height.
   * Almost always true; false for things authored at an explicit height.
   */
  groundToTerrain?: boolean;

  /** Builds the instanceable parts. Called once per (theme, variant). */
  build: (ctx: PropBuildContext) => PropPart[];
}
