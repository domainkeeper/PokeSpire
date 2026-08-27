import type { GameMap } from '../mapTypes';
import type { MapModule } from './worldTypes';
import { disposeTerrain } from '../../game/terrain/heightfield';
import { disposeGroundTexture, disposeWaterMask } from '../../game/terrain/groundTexture';
import { invalidateWorldBitmap } from '../../game/ui/worldBitmapCache';
import { compileExitsFor, CONNECTIONS } from './connections';

const modules = new Map<string, MapModule>();
const loaded = new Map<string, GameMap>();

export function registerMapModule(mod: MapModule): void {
  if (mod.meta.name !== mod.meta.id) {
    throw new Error(`[mapRegistry] meta.name must equal meta.id for "${mod.meta.id}"`);
  }
  const px = mod.meta.width * mod.meta.pixelsPerTile;
  const py = mod.meta.height * mod.meta.pixelsPerTile;
  if (px > 4096 || py > 4096) {
    throw new Error(`[mapRegistry] "${mod.meta.id}" ground texture ${px}x${py} exceeds 4096`);
  }
  modules.set(mod.meta.id, mod);
}

/** Synchronous: builds arrays on first call, then caches. */
export function loadMap(id: string): GameMap | undefined {
  const hit = loaded.get(id);
  if (hit) return hit;
  const mod = modules.get(id);
  if (!mod) return undefined;
  const map = mod.build();
  map.exits = [...map.exits, ...compileExitsFor(id)];
  loaded.set(id, map);
  return map;
}

export function getMapMeta(id: string) { return modules.get(id)?.meta; }
export function allMapIds(): string[] { return [...modules.keys()]; }
export function isLoaded(id: string): boolean { return loaded.has(id); }

export function disposeMap(id: string): void {
  loaded.delete(id);
  disposeTerrain(id);
  disposeGroundTexture(id);
  disposeWaterMask(id);
  invalidateWorldBitmap(id);
}

/** Return the set of map ids that should stay loaded: the current map + its direct neighbors. */
export function keepSetFor(mapId: string): Set<string> {
  const keep = new Set<string>([mapId]);
  for (const c of CONNECTIONS) {
    if (c.a.map === mapId) keep.add(c.b.map);
    if (c.b.map === mapId) keep.add(c.a.map);
  }
  return keep;
}

/** Dispose all loaded maps NOT in the keep set. */
export function disposeNonNeighbors(currentMapId: string): void {
  const keep = keepSetFor(currentMapId);
  for (const id of [...loaded.keys()]) {
    if (!keep.has(id)) disposeMap(id);
  }
}
