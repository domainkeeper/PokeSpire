import { TILE_SIZE } from './constants';

export function gridToWorld(gx: number, gy: number): [number, number, number] {
  return [gx * TILE_SIZE, 0, gy * TILE_SIZE];
}

export function worldToGrid(wx: number, wz: number): [number, number] {
  return [Math.round(wx / TILE_SIZE), Math.round(wz / TILE_SIZE)];
}

export function isWalkable(
  mapBlocked: boolean[][],
  gx: number,
  gy: number,
  mapWidth: number,
  mapHeight: number,
): boolean {
  if (gx < 0 || gx >= mapWidth || gy < 0 || gy >= mapHeight) return false;
  return !mapBlocked[gy]?.[gx];
}
