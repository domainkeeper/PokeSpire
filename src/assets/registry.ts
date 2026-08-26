/**
 * Asset registry - PLAN.md B.1.
 *
 * Hard rule: gameplay and rendering code must NEVER reference a downloaded file
 * path directly. Everything goes through a symbolic id resolved here.
 *
 * Why it matters: swapping an art pack later touches only this file, not the
 * dozens of components that draw with it. Previously paths were hardcoded in
 * characterSprites.ts, pokemonSprites.ts and tileRegistry.ts, so a pack swap
 * meant a grep-and-pray across the render layer.
 */

export type AssetKind = 'spritesheet' | 'sprite' | 'tile' | 'sfx' | 'music' | 'model' | 'font';

export interface AssetEntry {
  path: string;
  kind: AssetKind;
  /** Frame size in source pixels, for spritesheets. */
  frameW?: number;
  frameH?: number;
  /** Frames per row. */
  frames?: number;
  /** Free-form provenance, surfaced in docs/ASSET_SOURCES.md. */
  credit?: string;
  license?: string;
}

const CHAR_BASE = '/assets/characters/TopDownCharacter/Character';
const MON_BASE = '/assets/pokemon';

/**
 * NOTE ON LICENSING: the TopDownCharacter art below is currently UNDOCUMENTED -
 * it ships no license file and is not listed in docs/ASSET_SOURCES.md, which
 * instead wrongly claims characters are "procedural". Flagged here so it is
 * impossible to miss. Resolve provenance before any public distribution
 * (PLAN.md 2.C / 2.E).
 */
const UNVERIFIED = 'UNVERIFIED - provenance not documented, see PLAN.md 2.C';

export const ASSET_REGISTRY: Record<string, AssetEntry> = {
  /* ------------------------------------------------ player / npc sheets --- */
  'char.player.down':       { path: `${CHAR_BASE}/Character_Down.png`,      kind: 'spritesheet', frameW: 32, frameH: 32, frames: 4, license: UNVERIFIED },
  'char.player.down_right': { path: `${CHAR_BASE}/Character_DownRight.png`, kind: 'spritesheet', frameW: 32, frameH: 32, frames: 4, license: UNVERIFIED },
  'char.player.right':      { path: `${CHAR_BASE}/Character_Right.png`,     kind: 'spritesheet', frameW: 32, frameH: 32, frames: 4, license: UNVERIFIED },
  'char.player.up_right':   { path: `${CHAR_BASE}/Character_UpRight.png`,   kind: 'spritesheet', frameW: 32, frameH: 32, frames: 4, license: UNVERIFIED },
  'char.player.up':         { path: `${CHAR_BASE}/Character_Up.png`,        kind: 'spritesheet', frameW: 32, frameH: 32, frames: 4, license: UNVERIFIED },
  'char.player.up_left':    { path: `${CHAR_BASE}/Character_UpLeft.png`,    kind: 'spritesheet', frameW: 32, frameH: 32, frames: 4, license: UNVERIFIED },
  'char.player.left':       { path: `${CHAR_BASE}/Character_Left.png`,      kind: 'spritesheet', frameW: 32, frameH: 32, frames: 4, license: UNVERIFIED },
  'char.player.down_left':  { path: `${CHAR_BASE}/Character_DownLeft.png`,  kind: 'spritesheet', frameW: 32, frameH: 32, frames: 4, license: UNVERIFIED },
};

/** Pokemon sprites are registered programmatically from the species table. */
export function registerPokemonSprite(key: string, file: string): void {
  ASSET_REGISTRY[`mon.${key}.front`] = {
    path: `${MON_BASE}/${file}`,
    kind: 'sprite',
    frameW: 96,
    frameH: 96,
    frames: 1,
    credit: 'PokeAPI/sprites',
    license: 'CC0 on the compilation only; character designs remain Nintendo/Game Freak IP (PLAN.md 2.D)',
  };
}

export function resolveAsset(id: string): AssetEntry {
  const entry = ASSET_REGISTRY[id];
  if (!entry) throw new Error(`[assets] unknown asset id: ${id}`);
  return entry;
}

export function tryResolveAsset(id: string): AssetEntry | undefined {
  return ASSET_REGISTRY[id];
}

export function assetPath(id: string): string {
  return resolveAsset(id).path;
}

/** Every id currently registered; useful for preload passes and audits. */
export function allAssetIds(): string[] {
  return Object.keys(ASSET_REGISTRY);
}
