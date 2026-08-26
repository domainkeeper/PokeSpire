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

export function buildBlockedGrid(
  width: number,
  height: number,
  objects: { gx: number; gy: number; footprintW: number; footprintH: number; collision: boolean }[],
): boolean[][] {
  const grid: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false),
  );
  for (const obj of objects) {
    if (!obj.collision) continue;
    for (let dy = 0; dy < obj.footprintH; dy++) {
      for (let dx = 0; dx < obj.footprintW; dx++) {
        const gx = obj.gx + dx;
        const gy = obj.gy + dy;
        if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
          grid[gy][gx] = true;
        }
      }
    }
  }
  return grid;
}
