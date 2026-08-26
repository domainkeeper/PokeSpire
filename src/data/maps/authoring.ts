import type { MapObject } from '../mapTypes';
import type { PropId } from '../props/propRegistry';

/**
 * Shared map-authoring helpers.
 *
 * Map files describe intent ("a plateau here", "scatter woodland there") and this
 * module turns that into grid data. Keeping it generic means new maps reuse it
 * instead of copy-pasting nested loops, and elevation/prop authoring stays
 * consistent across regions.
 */

export function place(
  type: PropId,
  gx: number,
  gy: number,
  extra: Partial<MapObject> = {},
): MapObject {
  return { type, gx, gy, ...extra };
}

/* ------------------------------------------------------------ elevation --- */

export function makeElevation(width: number, height: number, base = 0): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => base));
}

export interface RectSpec {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Raise/set a rectangular plateau. */
export function elevateRect(
  elev: number[][],
  { x, y, w, h }: RectSpec,
  steps: number,
  mode: 'set' | 'add' = 'set',
): void {
  for (let gy = y; gy < y + h; gy++) {
    const row = elev[gy];
    if (!row) continue;
    for (let gx = x; gx < x + w; gx++) {
      if (gx < 0 || gx >= row.length) continue;
      row[gx] = mode === 'set' ? steps : row[gx] + steps;
    }
  }
}

/** Raise/set an elliptical hill or basin. */
export function elevateEllipse(
  elev: number[][],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  steps: number,
  mode: 'set' | 'add' = 'set',
): void {
  for (let gy = Math.floor(cy - ry); gy <= Math.ceil(cy + ry); gy++) {
    const row = elev[gy];
    if (!row) continue;
    for (let gx = Math.floor(cx - rx); gx <= Math.ceil(cx + rx); gx++) {
      if (gx < 0 || gx >= row.length) continue;
      const dx = (gx - cx) / rx;
      const dy = (gy - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      row[gx] = mode === 'set' ? steps : row[gx] + steps;
    }
  }
}

/**
 * Concentric terraces: an outer ring at `from` steps rising to `to` at the
 * centre. This is what produces readable multi-level hills rather than one
 * abrupt wall.
 */
export function terraceEllipse(
  elev: number[][],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
): void {
  const levels = Math.abs(to - from);
  if (levels === 0) {
    elevateEllipse(elev, cx, cy, rx, ry, to);
    return;
  }
  const dir = Math.sign(to - from);
  for (let i = 0; i <= levels; i++) {
    const t = 1 - i / (levels + 1);
    elevateEllipse(elev, cx, cy, rx * t, ry * t, from + dir * i);
  }
}

/**
 * Carve a walkable ramp so a plateau is reachable. Without this, elevation-aware
 * collision would seal the plateau off entirely (steps > MAX_CLIMB_STEPS block).
 */
export function carveRamp(
  elev: number[][],
  x: number,
  y: number,
  w: number,
  h: number,
  fromSteps: number,
  toSteps: number,
  axis: 'y' | 'x' = 'y',
): void {
  const span = axis === 'y' ? h : w;
  const levels = Math.abs(toSteps - fromSteps);
  if (span <= 0) return;

  for (let i = 0; i < span; i++) {
    const t = i / Math.max(1, span - 1);
    const step = Math.round(fromSteps + (toSteps - fromSteps) * t);
    // Clamp so a ramp never introduces an unclimbable jump.
    const clamped = levels === 0 ? toSteps : step;
    if (axis === 'y') {
      elevateRect(elev, { x, y: y + i, w, h: 1 }, clamped);
    } else {
      elevateRect(elev, { x: x + i, y, w: 1, h }, clamped);
    }
  }
}

/** Flatten a corridor so authored elevation never severs a road. */
export function flattenRect(elev: number[][], rect: RectSpec, steps = 0): void {
  elevateRect(elev, rect, steps);
}

/* ---------------------------------------------------------- scattering --- */

function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

export interface ScatterSpec {
  /** Weighted prop table. */
  table: readonly { id: PropId; weight: number }[];
  area: RectSpec;
  /** Grid pitch between candidate positions. */
  pitch: number;
  /** 0..1 chance a candidate becomes a prop. */
  density: number;
  seed: number;
  /** Reject a candidate (e.g. keep roads and water clear). */
  allow?: (gx: number, gy: number) => boolean;
}

/**
 * Deterministic weighted scatter. Same seed always yields the same world, so
 * maps are reproducible and diffable while still looking organic.
 */
export function scatter(spec: ScatterSpec): MapObject[] {
  const out: MapObject[] = [];
  const total = spec.table.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return out;

  for (let gy = spec.area.y; gy < spec.area.y + spec.area.h; gy += spec.pitch) {
    for (let gx = spec.area.x; gx < spec.area.x + spec.area.w; gx += spec.pitch) {
      const h = hash(gx, gy, spec.seed);
      if ((h % 1000) / 1000 > spec.density) continue;

      // Jitter off the lattice so scatter never looks like a grid.
      const jx = gx + ((h >> 10) % spec.pitch) - Math.floor(spec.pitch / 2);
      const jy = gy + ((h >> 16) % spec.pitch) - Math.floor(spec.pitch / 2);
      if (spec.allow && !spec.allow(jx, jy)) continue;

      let roll = ((h >> 22) % 1000) / 1000 * total;
      let chosen = spec.table[0].id;
      for (const e of spec.table) {
        roll -= e.weight;
        if (roll <= 0) {
          chosen = e.id;
          break;
        }
      }
      out.push(place(chosen, jx, jy));
    }
  }
  return out;
}

/** A straight run of a prop, e.g. a fence line or a row of lamps. */
export function line(
  type: PropId,
  from: readonly [number, number],
  to: readonly [number, number],
  spacing: number,
  extra: Partial<MapObject> = {},
): MapObject[] {
  const out: MapObject[] = [];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dist = Math.hypot(dx, dy);
  const count = Math.max(1, Math.floor(dist / spacing));
  const vertical = Math.abs(dy) > Math.abs(dx);

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    out.push(
      place(type, Math.round(from[0] + dx * t), Math.round(from[1] + dy * t), {
        // Fence runs need to face along the line.
        yaw: vertical ? Math.PI / 2 : 0,
        ...extra,
      }),
    );
  }
  return out;
}

/** Rectangular border of props (yard fences, plaza edging). */
export function border(
  type: PropId,
  rect: RectSpec,
  spacing: number,
  extra: Partial<MapObject> = {},
): MapObject[] {
  const { x, y, w, h } = rect;
  return [
    ...line(type, [x, y], [x + w, y], spacing, extra),
    ...line(type, [x, y + h], [x + w, y + h], spacing, extra),
    ...line(type, [x, y], [x, y + h], spacing, extra),
    ...line(type, [x + w, y], [x + w, y + h], spacing, extra),
  ];
}

/**
 * One row/column of the border tree wall, optionally leaving a gate so an exit
 * corridor stays walkable. Border trees are 6x6 on a pitch, which would
 * otherwise seal exits completely.
 */
export function treeWall(
  count: number,
  at: (i: number) => [number, number],
  pitch: number,
  footprint: number,
  gate?: { from: number; to: number; axis: 'x' | 'y' },
  id: PropId = 'tree_oak',
): MapObject[] {
  const out: MapObject[] = [];
  for (let i = 0; i < count; i++) {
    const [gx, gy] = at(i * pitch);
    if (gate) {
      const along = gate.axis === 'x' ? gx : gy;
      if (along + footprint - 1 >= gate.from && along <= gate.to) continue;
    }
    out.push(place(id, gx, gy));
  }
  return out;
}
