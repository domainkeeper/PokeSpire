import type { MapObject } from '../../mapTypes';
import type { PropId } from '../../props/propRegistry';

export function streetCorner(opts: {
  x: number; y: number; seed?: number;
}): MapObject[] {
  return [
    { type: 'lamp_post' as PropId, gx: opts.x, gy: opts.y },
  ];
}

export function lampRow(opts: {
  from: readonly [number, number];
  to: readonly [number, number];
  spacing?: number;
}): MapObject[] {
  const { from, to, spacing = 8 } = opts;
  const out: MapObject[] = [];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dist = Math.hypot(dx, dy);
  const count = Math.max(1, Math.floor(dist / spacing));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    out.push({
      type: 'lamp_post' as PropId,
      gx: Math.round(from[0] + dx * t),
      gy: Math.round(from[1] + dy * t),
    });
  }
  return out;
}

export function fenceYard(opts: {
  x: number; y: number; w: number; h: number;
  seed?: number;
}): MapObject[] {
  const { x, y, w, h } = opts;
  const out: MapObject[] = [];
  for (let gx = x; gx < x + w; gx += 3) {
    out.push({ type: 'fence_wood' as PropId, gx, gy: y });
    out.push({ type: 'fence_wood' as PropId, gx, gy: y + h });
  }
  for (let gy = y; gy < y + h; gy += 3) {
    out.push({ type: 'fence_wood' as PropId, gx: x, gy });
    out.push({ type: 'fence_wood' as PropId, gx: x + w, gy });
  }
  return out;
}

export function windmill(opts: {
  x: number; y: number;
}): MapObject[] {
  return [
    { type: 'house_large' as PropId, gx: opts.x, gy: opts.y },
    { type: 'lamp_post' as PropId, gx: opts.x + 2, gy: opts.y - 2 },
  ];
}
