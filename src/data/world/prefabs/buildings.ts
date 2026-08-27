import type { MapObject } from '../../mapTypes';
import type { PropId } from '../../props/propRegistry';

function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

export function houseRow(opts: {
  x: number; y: number; count: number; gap: number;
  size?: 'small' | 'large'; seed?: number;
}): MapObject[] {
  const { x, y, count, gap, size = 'small', seed: _seed = 0 } = opts;
  const id: PropId = size === 'large' ? 'house_large' : 'house_small';
  const out: MapObject[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ type: id, gx: x + i * gap, gy: y });
  }
  return out;
}

export function cityBlock(opts: {
  x: number; y: number; w: number; h: number;
  seed?: number;
}): MapObject[] {
  const { x, y, w, h, seed = 0 } = opts;
  const out: MapObject[] = [];
  for (let gy = y; gy < y + h; gy += 12) {
    for (let gx = x; gx < x + w; gx += 14) {
      const r = hash(gx, gy, seed) % 100;
      const id: PropId = r < 60 ? 'house_small' : r < 85 ? 'house_large' : 'shop';
      out.push({ type: id, gx, gy });
    }
  }
  return out;
}

export function plazaProps(opts: {
  x: number; y: number; w: number; h: number;
}): MapObject[] {
  const { x, y, w, h } = opts;
  const out: MapObject[] = [];
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  out.push({ type: 'well' as PropId, gx: cx, gy: cy });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const lx = cx + Math.round(Math.cos(angle) * 6);
    const ly = cy + Math.round(Math.sin(angle) * 6);
    out.push({ type: 'lamp_post' as PropId, gx: lx, gy: ly });
  }
  return out;
}

export function shopFront(opts: {
  x: number; y: number;
  sign?: string; seed?: number;
}): MapObject[] {
  const { x, y, seed: _seed = 0 } = opts;
  return [
    { type: 'shop' as PropId, gx: x, gy: y },
    { type: 'lamp_post' as PropId, gx: x - 2, gy: y + 1 },
    { type: 'lamp_post' as PropId, gx: x + 4, gy: y + 1 },
  ];
}

export function marketStalls(opts: {
  x: number; y: number; count: number; gap: number;
  seed?: number;
}): MapObject[] {
  const { x, y, count, gap, seed = 0 } = opts;
  const out: MapObject[] = [];
  for (let i = 0; i < count; i++) {
    const sx = x + i * gap;
    out.push({ type: 'crate' as PropId, gx: sx, gy: y });
    out.push({ type: 'barrel' as PropId, gx: sx + 1, gy: y });
    if (hash(sx, y, seed) % 2 === 0) {
      out.push({ type: 'lamp_post' as PropId, gx: sx, gy: y - 2 });
    }
  }
  return out;
}
