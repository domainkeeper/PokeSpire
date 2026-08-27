import type { TileType } from '../../mapTypes';

export function streetGrid(
  grid: TileType[][],
  startX: number, startY: number,
  cols: number, rows: number,
  blockW: number, blockH: number,
  roadW: number,
): void {
  const H = grid.length;
  const W = grid[0]?.length ?? 0;
  for (let r = 0; r <= rows; r++) {
    const y = startY + r * (blockH + roadW);
    for (let dy = 0; dy < roadW; dy++) {
      const gy = y + dy;
      if (gy < 0 || gy >= H) continue;
      for (let gx = startX; gx < startX + cols * (blockW + roadW) + roadW; gx++) {
        if (gx >= 0 && gx < W) grid[gy][gx] = 'path';
      }
    }
  }
  for (let c = 0; c <= cols; c++) {
    const x = startX + c * (blockW + roadW);
    for (let dx = 0; dx < roadW; dx++) {
      const gx = x + dx;
      if (gx < 0 || gx >= W) continue;
      for (let gy = startY; gy < startY + rows * (blockH + roadW) + roadW; gy++) {
        if (gy >= 0 && gy < H) grid[gy][gx] = 'path';
      }
    }
  }
}

export function block(
  grid: TileType[][],
  x: number, y: number,
  w: number, h: number,
  fill: TileType = 'grass',
): void {
  for (let gy = y; gy < y + h; gy++) {
    const row = grid[gy];
    if (!row) continue;
    for (let gx = x; gx < x + w; gx++) {
      if (gx >= 0 && gx < row.length) row[gx] = fill;
    }
  }
}

export function plaza(
  grid: TileType[][],
  x: number, y: number,
  w: number, h: number,
): void {
  for (let gy = y; gy < y + h; gy++) {
    const row = grid[gy];
    if (!row) continue;
    for (let gx = x; gx < x + w; gx++) {
      if (gx >= 0 && gx < row.length) {
        const edge = gx === x || gx === x + w - 1 || gy === y || gy === y + h - 1;
        row[gx] = edge ? 'dirt' : 'path';
      }
    }
  }
}
