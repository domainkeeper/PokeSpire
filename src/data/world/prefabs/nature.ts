import type { MapObject } from '../../mapTypes';
import type { PropId } from '../../props/propRegistry';
import { scatter } from '../../maps/authoring';

function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

export function forestCluster(opts: {
  x: number; y: number; w: number; h: number;
  density?: number; seed?: number;
}): MapObject[] {
  const { x, y, w, h, density = 0.4, seed = 0 } = opts;
  return scatter({
    table: [
      { id: 'tree_oak' as PropId, weight: 5 },
      { id: 'tree_pine' as PropId, weight: 3 },
    ],
    area: { x, y, w, h }, pitch: 5, density, seed,
  });
}

export function grove(opts: {
  x: number; y: number; count: number; radius: number;
  seed?: number;
}): MapObject[] {
  const { x, y, count, radius, seed = 0 } = opts;
  const out: MapObject[] = [];
  for (let i = 0; i < count; i++) {
    const h = hash(x + i, y, seed);
    const angle = ((h % 1000) / 1000) * Math.PI * 2;
    const dist = (((h >> 10) % 1000) / 1000) * radius;
    const gx = x + Math.round(Math.cos(angle) * dist);
    const gy = y + Math.round(Math.sin(angle) * dist);
    const id: PropId = h % 3 === 0 ? 'tree_pine' : 'tree_oak';
    out.push({ type: id, gx, gy });
  }
  return out;
}

export function pondProps(opts: {
  cx: number; cy: number; radius: number;
  seed?: number;
}): MapObject[] {
  const { cx, cy, radius, seed = 0 } = opts;
  const out: MapObject[] = [];
  const count = Math.floor(radius * 1.5);
  for (let i = 0; i < count; i++) {
    const h = hash(cx + i, cy, seed);
    const angle = ((h % 1000) / 1000) * Math.PI * 2;
    const dist = radius + 1 + (((h >> 8) % 1000) / 1000) * 2;
    const gx = cx + Math.round(Math.cos(angle) * dist);
    const gy = cy + Math.round(Math.sin(angle) * dist);
    out.push({ type: 'bush_round' as PropId, gx, gy });
  }
  return out;
}

export function flowerField(opts: {
  x: number; y: number; w: number; h: number;
  density?: number; seed?: number;
}): MapObject[] {
  const { x, y, w, h, density = 0.15, seed = 0 } = opts;
  return scatter({
    table: [{ id: 'flower_bush' as PropId, weight: 1 }],
    area: { x, y, w, h }, pitch: 3, density, seed,
  });
}

export function rockFormation(opts: {
  x: number; y: number; count: number;
  seed?: number;
}): MapObject[] {
  const { x, y, count, seed = 0 } = opts;
  const out: MapObject[] = [];
  for (let i = 0; i < count; i++) {
    const h = hash(x + i * 3, y + i * 2, seed);
    const id: PropId = h % 2 === 0 ? 'boulder' : 'rock_small';
    out.push({ type: id, gx: x + (i % 5) * 3, gy: y + Math.floor(i / 5) * 3 });
  }
  return out;
}
