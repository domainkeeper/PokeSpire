import { TILE_SIZE, MAX_CLIMB_STEPS } from './constants';
import type { GameMap, MapObject, TileType } from '../data/mapTypes';
import { PROP_REGISTRY } from '../data/props/propRegistry';

export function gridToWorld(gx: number, gy: number): [number, number, number] {
  return [gx * TILE_SIZE, 0, gy * TILE_SIZE];
}

export function worldToGrid(wx: number, wz: number): [number, number] {
  return [Math.round(wx / TILE_SIZE), Math.round(wz / TILE_SIZE)];
}

/** Ground tile types that block movement regardless of props. */
const BLOCKING_TILES: ReadonlySet<TileType> = new Set<TileType>(['water']);

export function isBlockingTile(tile: TileType | undefined): boolean {
  return tile !== undefined && BLOCKING_TILES.has(tile);
}

/** Effective footprint for a placed object: explicit override, else registry. */
export function objectFootprint(obj: MapObject): { w: number; h: number } {
  const def = PROP_REGISTRY[obj.type as keyof typeof PROP_REGISTRY];
  return {
    w: obj.footprintW ?? def?.footprint.w ?? 1,
    h: obj.footprintH ?? def?.footprint.h ?? 1,
  };
}

export function objectIsSolid(obj: MapObject): boolean {
  return obj.solid ?? obj.collision ?? PROP_REGISTRY[obj.type as keyof typeof PROP_REGISTRY]?.solid ?? false;
}

/**
 * Flat collision grid. Uint8Array rather than boolean[][]: this is sampled from
 * useFrame twice per axis, and town is 300x300 / route1 400x300.
 */
export interface BlockedGrid {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
  /** Elevation steps per tile; used to reject unclimbable steps. */
  readonly steps: Int16Array;
}

/**
 * Builds collision from three independent sources:
 *   1. ground tile type (water)
 *   2. solid props, using their REGISTRY footprint - so a house's collider
 *      matches its visible walls by construction
 *   3. map bounds
 * Elevation is stored alongside so movement can reject cliff edges.
 */
export function buildBlockedGrid(mapData: GameMap): BlockedGrid {
  const { width, height } = mapData;
  const data = new Uint8Array(width * height);
  const steps = new Int16Array(width * height);

  for (let gy = 0; gy < height; gy++) {
    const row = mapData.ground[gy];
    const elev = mapData.elevation?.[gy];
    const base = gy * width;
    for (let gx = 0; gx < width; gx++) {
      if (isBlockingTile(row?.[gx])) data[base + gx] = 1;
      if (elev) steps[base + gx] = elev[gx] ?? 0;
    }
  }

  for (const obj of mapData.objects) {
    if (!objectIsSolid(obj)) continue;
    const fp = objectFootprint(obj);
    const x0 = Math.max(0, obj.gx);
    const y0 = Math.max(0, obj.gy);
    const x1 = Math.min(width, obj.gx + fp.w);
    const y1 = Math.min(height, obj.gy + fp.h);
    for (let gy = y0; gy < y1; gy++) {
      const base = gy * width;
      for (let gx = x0; gx < x1; gx++) data[base + gx] = 1;
    }
  }

  return { width, height, data, steps };
}

export function isBlocked(grid: BlockedGrid, gx: number, gy: number): boolean {
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return true;
  return grid.data[gy * grid.width + gx] === 1;
}

export function isWalkable(grid: BlockedGrid, gx: number, gy: number): boolean {
  return !isBlocked(grid, gx, gy);
}

export function stepsAt(grid: BlockedGrid, gx: number, gy: number): number {
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return 0;
  return grid.steps[gy * grid.width + gx];
}

/**
 * Movement test that also enforces terrain elevation: a step up or down larger
 * than MAX_CLIMB_STEPS is a cliff and cannot be crossed. This is what turns the
 * authored elevation layer into real level design (ledges, plateaus, sunken
 * gardens) with no extra collision authoring.
 */
export function canMoveTo(
  grid: BlockedGrid,
  fromGx: number,
  fromGy: number,
  toGx: number,
  toGy: number,
): boolean {
  if (isBlocked(grid, toGx, toGy)) return false;
  const delta = Math.abs(stepsAt(grid, toGx, toGy) - stepsAt(grid, fromGx, fromGy));
  return delta <= MAX_CLIMB_STEPS;
}

/**
 * Safety net for spawn points: resolve an authored/stored cell to the nearest
 * walkable one via an outward ring search. Guards against map edits and stale
 * saves alike.
 */
export function findNearestWalkable(
  grid: BlockedGrid,
  gx: number,
  gy: number,
  maxRadius = 64,
): [number, number] | null {
  if (isWalkable(grid, gx, gy)) return [gx, gy];

  for (let r = 1; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      const edge = dx === -r || dx === r;
      const ys = edge ? rangeInclusive(-r, r) : [-r, r];
      for (const dy of ys) {
        if (isWalkable(grid, gx + dx, gy + dy)) return [gx + dx, gy + dy];
      }
    }
  }
  return null;
}

function rangeInclusive(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}
