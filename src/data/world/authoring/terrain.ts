import type { TileType } from '../../mapTypes';

function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

export function fillRect(grid: TileType[][], x: number, y: number, w: number, h: number, tile: TileType): void {
  for (let gy = y; gy < y + h; gy++) {
    const row = grid[gy];
    if (!row) continue;
    for (let gx = x; gx < x + w; gx++) {
      if (gx >= 0 && gx < row.length) row[gx] = tile;
    }
  }
}

export function paintPath(grid: TileType[][], x: number, y: number, w: number, h: number): void {
  fillRect(grid, x, y, w, h, 'path');
}

export function curvePath(
  grid: TileType[][],
  x0: number, y0: number,
  x1: number, y1: number,
  width: number, amp: number, freq: number,
  tile: TileType = 'path',
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const steps = Math.ceil(len);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseX = x0 + dx * t;
    const baseY = y0 + dy * t;
    const perpX = -dy / len;
    const perpY = dx / len;
    const offset = Math.sin(t * freq * Math.PI * 2) * amp;
    const cx = Math.round(baseX + perpX * offset);
    const cy = Math.round(baseY + perpY * offset);
    const hw = Math.floor(width / 2);
    for (let ox = -hw; ox <= hw; ox++) {
      for (let oy = -hw; oy <= hw; oy++) {
        const gx = cx + ox;
        const gy = cy + oy;
        if (gy >= 0 && gy < grid.length && gx >= 0 && gx < (grid[gy]?.length ?? 0)) {
          grid[gy][gx] = tile;
        }
      }
    }
  }
}

export function river(
  grid: TileType[][],
  x0: number, y0: number,
  x1: number, y1: number,
  width: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const steps = Math.ceil(len);
  const hw = Math.floor(width / 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(x0 + dx * t);
    const cy = Math.round(y0 + dy * t);
    for (let ox = -hw; ox <= hw; ox++) {
      for (let oy = -hw; oy <= hw; oy++) {
        const gx = cx + ox;
        const gy = cy + oy;
        if (gy >= 0 && gy < grid.length && gx >= 0 && gx < (grid[gy]?.length ?? 0)) {
          grid[gy][gx] = 'water';
        }
      }
    }
  }
}

export function pond(
  grid: TileType[][],
  cx: number, cy: number,
  rx: number, ry: number,
  ring: TileType,
): void {
  for (let gy = Math.floor(cy - ry - 1); gy <= Math.ceil(cy + ry + 1); gy++) {
    const row = grid[gy];
    if (!row) continue;
    for (let gx = Math.floor(cx - rx - 1); gx <= Math.ceil(cx + rx + 1); gx++) {
      if (gx < 0 || gx >= row.length) continue;
      const dx = (gx - cx) / rx;
      const dy = (gy - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d <= 1) row[gx] = 'water';
      else if (d <= 1.6) row[gx] = ring;
    }
  }
}

export function coastline(
  grid: TileType[][],
  edge: 'N' | 'S' | 'E' | 'W',
  depth: number,
  sandBand: number,
): void {
  const H = grid.length;
  const W = grid[0]?.length ?? 0;
  for (let gy = 0; gy < H; gy++) {
    const row = grid[gy];
    if (!row) continue;
    for (let gx = 0; gx < W; gx++) {
      let dist = 0;
      if (edge === 'N') dist = gy;
      else if (edge === 'S') dist = H - 1 - gy;
      else if (edge === 'W') dist = gx;
      else if (edge === 'E') dist = W - 1 - gx;
      if (dist < depth) row[gx] = 'water';
      else if (dist < depth + sandBand) row[gx] = 'sand';
    }
  }
}

export function bridge(
  grid: TileType[][],
  x: number, y: number,
  w: number, h: number,
): void {
  fillRect(grid, x, y, w, h, 'path');
}

export function dirtBorder(
  grid: TileType[][],
  tile: TileType,
  radius: number,
): void {
  const H = grid.length;
  const W = grid[0]?.length ?? 0;
  for (let gy = 0; gy < H; gy++) {
    const row = grid[gy];
    if (!row) continue;
    for (let gx = 0; gx < W; gx++) {
      if (row[gx] !== tile) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (ny >= 0 && ny < H && nx >= 0 && nx < (grid[ny]?.length ?? 0)) {
            if (grid[ny][nx] === 'grass' && (dx !== 0 || dy !== 0)) {
              const dist = Math.hypot(dx, dy);
              if (dist <= radius && hash(nx, ny, 99) % 100 < 60) {
                grid[ny][nx] = 'dirt';
              }
            }
          }
        }
      }
    }
  }
}
