import * as THREE from 'three';
import { resolveAsset } from '../../../assets/registry';

export type Dir8 =
  | 'down'
  | 'down_right'
  | 'right'
  | 'up_right'
  | 'up'
  | 'up_left'
  | 'left'
  | 'down_left';
export type WalkFrame = number;

export const ALL_DIRS: Dir8[] = [
  'down',
  'down_right',
  'right',
  'up_right',
  'up',
  'up_left',
  'left',
  'down_left',
];

/**
 * Directional sprite manifest.
 *
 * Generalised so a future actor can ship 1, 4 or 8 directions and optionally
 * mirror to fill the gaps (PLAN.md 5). Today the player sheet has all 8; NPCs
 * and Pokemon use `directions: ['down']` and fall back to it for every facing.
 * Adding a properly 8-directional Pokemon sheet later is a manifest entry, not a
 * code change.
 */
export interface SpriteManifest {
  /** Asset registry id prefix; full id is `${assetPrefix}.${dir}`. */
  assetPrefix: string;
  /** Directions with real art. */
  directions: Dir8[];
  /** Frames per direction. */
  frames: number;
  /** Seconds per frame while moving. */
  frameDuration: number;
  /** Mirror east-facing art to cover west-facing directions. */
  mirrorHorizontal?: boolean;
}

export const PLAYER_MANIFEST: SpriteManifest = {
  assetPrefix: 'char.player',
  directions: ALL_DIRS,
  frames: 4,
  frameDuration: 0.12,
};

/** Nearest available direction when a manifest lacks the requested one. */
const FALLBACK_ORDER: Record<Dir8, Dir8[]> = {
  down: ['down', 'down_right', 'down_left'],
  down_right: ['down_right', 'right', 'down'],
  right: ['right', 'down_right', 'up_right'],
  up_right: ['up_right', 'right', 'up'],
  up: ['up', 'up_right', 'up_left'],
  up_left: ['up_left', 'left', 'up'],
  left: ['left', 'up_left', 'down_left'],
  down_left: ['down_left', 'left', 'down'],
};

export function resolveDirection(manifest: SpriteManifest, dir: Dir8): Dir8 {
  if (manifest.directions.includes(dir)) return dir;
  for (const alt of FALLBACK_ORDER[dir]) {
    if (manifest.directions.includes(alt)) return alt;
  }
  return manifest.directions[0];
}

/* ------------------------------------------------------------- loading ---- */

/*
 * Images are cached once per asset id; every consumer gets its OWN THREE.Texture
 * pointing at the shared image.
 *
 * Animating a frame means mutating `texture.offset.x`. Sharing one Texture per
 * direction made all 21 NPCs animate in lockstep with the player's walk cycle.
 */
const imageCache = new Map<string, HTMLImageElement>();
const imageLoads = new Map<string, Promise<HTMLImageElement | null>>();
const pending = new Map<string, THREE.Texture[]>();

function configure(tex: THREE.Texture, frames: number): THREE.Texture {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1 / frames, 1);
  tex.offset.set(0, 0);
  return tex;
}

function loadImage(assetId: string): Promise<HTMLImageElement | null> {
  const existing = imageLoads.get(assetId);
  if (existing) return existing;

  const { path } = resolveAsset(assetId);
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(assetId, img);
      for (const tex of pending.get(assetId) ?? []) {
        tex.image = img;
        tex.needsUpdate = true;
      }
      pending.delete(assetId);
      resolve(img);
    };
    img.onerror = () => {
      console.error(`[sprites] failed to load ${assetId} -> ${path}`);
      pending.delete(assetId);
      resolve(null);
    };
    img.src = path;
  });

  imageLoads.set(assetId, promise);
  return promise;
}

/** Independent, mutable texture. Caller owns it and should dispose on unmount. */
export function createDirectionTexture(manifest: SpriteManifest, dir: Dir8): THREE.Texture {
  const assetId = `${manifest.assetPrefix}.${resolveDirection(manifest, dir)}`;
  const tex = configure(new THREE.Texture(), manifest.frames);
  const img = imageCache.get(assetId);
  if (img) {
    tex.image = img;
    tex.needsUpdate = true;
  } else {
    const list = pending.get(assetId);
    if (list) list.push(tex);
    else pending.set(assetId, [tex]);
    void loadImage(assetId);
  }
  return tex;
}

/** Shared, never-animated texture for static actors (NPCs). */
const idleCache = new Map<string, THREE.Texture>();
export function getIdleTexture(manifest: SpriteManifest, dir: Dir8): THREE.Texture {
  const key = `${manifest.assetPrefix}.${resolveDirection(manifest, dir)}`;
  let tex = idleCache.get(key);
  if (!tex) {
    tex = createDirectionTexture(manifest, dir);
    idleCache.set(key, tex);
  }
  return tex;
}

export function setFrame(tex: THREE.Texture, manifest: SpriteManifest, frame: number): void {
  tex.offset.x = (frame % manifest.frames) / manifest.frames;
}

/** Legacy player-facing names kept while Player migrates to SpriteManifest. */
export const createCharacterTexture = (dir: Dir8): THREE.Texture =>
  createDirectionTexture(PLAYER_MANIFEST, dir);
export const setCharacterFrame = (tex: THREE.Texture, frame: number): void =>
  setFrame(tex, PLAYER_MANIFEST, frame);
export const ensureCharacterTexturesLoaded = (): void => preloadManifest(PLAYER_MANIFEST);
export const getIdleCharacterTexture = (dir: Dir8): THREE.Texture =>
  getIdleTexture(PLAYER_MANIFEST, dir);

export function preloadManifest(manifest: SpriteManifest): void {
  for (const dir of manifest.directions) void loadImage(`${manifest.assetPrefix}.${dir}`);
}

/** Loads a single-image (non-sheet) sprite, e.g. a Pokemon front sprite. */
const singleCache = new Map<string, THREE.Texture>();
export function getSingleSprite(assetId: string): THREE.Texture {
  let tex = singleCache.get(assetId);
  if (tex) return tex;

  tex = new THREE.Texture();
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  singleCache.set(assetId, tex);

  const { path } = resolveAsset(assetId);
  const img = new Image();
  const target = tex;
  img.onload = () => {
    target.image = img;
    target.needsUpdate = true;
  };
  img.onerror = () => console.error(`[sprites] failed to load ${assetId} -> ${path}`);
  img.src = path;

  return tex;
}
