import type { MapObject } from '../../mapTypes';
import type { PropId } from '../../props/propRegistry';

export function dock(opts: {
  x: number; y: number; length: number;
  direction?: 'horizontal' | 'vertical'; seed?: number;
}): MapObject[] {
  const { x, y, length, direction = 'horizontal', seed: _seed = 0 } = opts;
  const out: MapObject[] = [];
  for (let i = 0; i < length; i++) {
    const gx = direction === 'horizontal' ? x + i : x;
    const gy = direction === 'horizontal' ? y : y + i;
    out.push({ type: 'crate' as PropId, gx, gy });
  }
  return out;
}

export function boardwalk(opts: {
  x: number; y: number; length: number;
  direction?: 'horizontal' | 'vertical';
}): MapObject[] {
  const { x, y, length, direction = 'horizontal' } = opts;
  const out: MapObject[] = [];
  for (let i = 0; i < length; i++) {
    const gx = direction === 'horizontal' ? x + i : x;
    const gy = direction === 'horizontal' ? y : y + i;
    out.push({ type: 'crate' as PropId, gx, gy, footprintW: 1, footprintH: 1, solid: false });
  }
  return out;
}

export function shorelineDetail(opts: {
  x: number; y: number; w: number; h: number;
  seed?: number;
}): MapObject[] {
  const { x, y, w, h, seed = 0 } = opts;
  const out: MapObject[] = [];
  for (let i = 0; i < Math.floor(w * h * 0.02); i++) {
    let h2 = (i * 374761393 + seed * 668265263) | 0;
    h2 = ((h2 ^ (h2 >> 13)) * 1274126177) | 0;
    h2 = (h2 ^ (h2 >> 16)) >>> 0;
    const gx = x + (h2 % w);
    const gy = y + ((h2 >> 8) % h);
    out.push({ type: 'rock_small' as PropId, gx, gy });
  }
  return out;
}
