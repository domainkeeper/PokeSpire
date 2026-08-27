import * as THREE from 'three';
import type { GameMap, TileType } from '../../data/mapTypes';
import type { Theme, Ramp } from '../../theme/types';
import { TILE_SIZE } from '../../utils/constants';

/** Ground texture pixels per micro-tile. Updated per-map inside makeGroundTexture. */
let PPT = 8;

/** World size of one ground-texture pixel for a given map. */
export function groundPixelSize(mapData: GameMap): number {
  return TILE_SIZE / (mapData.pixelsPerTile ?? 8);
}

/*
 * Theme-driven ground texture.
 *
 * Written into an ImageData buffer and blitted once. The previous version issued
 * one ctx.fillRect(x, y, 1, 1) per pixel (5.76M calls for town) with a hardcoded
 * palette. Now colours come from the Theme and the whole thing is ~65ms.
 */

function hex(c: string): number {
  return parseInt(c.slice(1), 16);
}

interface RampInts {
  b: number[];
}

function rampInts(r: Ramp): RampInts {
  return { b: [hex(r.darkest), hex(r.dark), hex(r.base), hex(r.light), hex(r.lightest)] };
}

function h2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

function px(buf: Uint8ClampedArray, stride: number, x: number, y: number, c: number): void {
  const i = (y * stride + x) << 2;
  buf[i] = (c >> 16) & 0xff;
  buf[i + 1] = (c >> 8) & 0xff;
  buf[i + 2] = c & 0xff;
  buf[i + 3] = 0xff;
}

function fillTile(buf: Uint8ClampedArray, stride: number, ox: number, oy: number, c: number): void {
  const r = (c >> 16) & 0xff;
  const g = (c >> 8) & 0xff;
  const b = c & 0xff;
  for (let dy = 0; dy < PPT; dy++) {
    let i = ((oy + dy) * stride + ox) << 2;
    for (let dx = 0; dx < PPT; dx++) {
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 0xff;
      i += 4;
    }
  }
}

type Painter = (
  buf: Uint8ClampedArray,
  stride: number,
  ox: number,
  oy: number,
  tx: number,
  ty: number,
) => void;

function makePainters(theme: Theme): Record<TileType, Painter> {
  const grass = rampInts(theme.palette.grass);
  const path = rampInts(theme.palette.path);
  const dirt = rampInts(theme.palette.dirt);
  const sand = rampInts(theme.palette.sand);
  const bed = rampInts(theme.palette.waterBed);

  /* Grass: dithered base with blade accents and clover clumps. */
  const paintGrass: Painter = (buf, stride, ox, oy, tx, ty) => {
    // Two base bands alternating per tile breaks up large flat areas.
    fillTile(buf, stride, ox, oy, grass.b[1 + (h2(tx, ty, 1) % 2)]);

    // Dither a fraction of pixels one band up/down for texture.
    for (let dy = 0; dy < PPT; dy++) {
      for (let dx = 0; dx < PPT; dx++) {
        const n = h2(ox + dx, oy + dy, 2) % 100;
        if (n < 16) px(buf, stride, ox + dx, oy + dy, grass.b[0]);
        else if (n < 30) px(buf, stride, ox + dx, oy + dy, grass.b[3]);
      }
    }
    // Blade tufts.
    const r = h2(tx, ty, 3) % 100;
    if (r < 34) {
      const bx = ox + (r % (PPT - 1));
      px(buf, stride, bx, oy + 1, grass.b[4]);
      px(buf, stride, bx, oy + 2, grass.b[3]);
      px(buf, stride, bx + 1, oy + 2, grass.b[0]);
    }
  };

  const paintPath: Painter = (buf, stride, ox, oy, tx, ty) => {
    fillTile(buf, stride, ox, oy, path.b[2]);
    for (let dy = 0; dy < PPT; dy++) {
      for (let dx = 0; dx < PPT; dx++) {
        const n = h2(ox + dx, oy + dy, 5) % 100;
        if (n < 12) px(buf, stride, ox + dx, oy + dy, path.b[1]);
        else if (n < 22) px(buf, stride, ox + dx, oy + dy, path.b[3]);
      }
    }
    // Occasional pebble.
    const r = h2(tx, ty, 6) % 100;
    if (r < 18) {
      px(buf, stride, ox + (r % 6) + 1, oy + ((r >> 3) % 6) + 1, path.b[0]);
      px(buf, stride, ox + (r % 6) + 2, oy + ((r >> 3) % 6) + 1, path.b[4]);
    }
  };

  const paintDirt: Painter = (buf, stride, ox, oy, tx, ty) => {
    fillTile(buf, stride, ox, oy, dirt.b[2]);
    for (let dy = 0; dy < PPT; dy++) {
      for (let dx = 0; dx < PPT; dx++) {
        const n = h2(ox + dx, oy + dy, 7) % 100;
        if (n < 14) px(buf, stride, ox + dx, oy + dy, dirt.b[1]);
        else if (n < 24) px(buf, stride, ox + dx, oy + dy, dirt.b[3]);
      }
    }
    const r = h2(tx, ty, 8) % 100;
    if (r < 14) px(buf, stride, ox + (r % PPT), oy + ((r >> 3) % PPT), dirt.b[0]);
  };

  const paintSand: Painter = (buf, stride, ox, oy, tx, ty) => {
    fillTile(buf, stride, ox, oy, sand.b[2]);
    for (let dy = 0; dy < PPT; dy++) {
      for (let dx = 0; dx < PPT; dx++) {
        const n = h2(ox + dx, oy + dy, 9) % 100;
        if (n < 12) px(buf, stride, ox + dx, oy + dy, sand.b[3]);
        else if (n < 20) px(buf, stride, ox + dx, oy + dy, sand.b[1]);
      }
    }
    const r = h2(tx, ty, 10) % 100;
    if (r < 10) {
      px(buf, stride, ox + (r % 6), oy + ((r >> 3) % 6), sand.b[4]);
      px(buf, stride, ox + (r % 6) + 1, oy + ((r >> 3) % 6), sand.b[4]);
    }
  };

  /* Water is painted as the murky bed; the animated surface is separate geometry. */
  const paintWaterBed: Painter = (buf, stride, ox, oy, tx, ty) => {
    fillTile(buf, stride, ox, oy, bed.b[1 + (h2(tx, ty, 11) % 2)]);
    for (let dy = 0; dy < PPT; dy++) {
      for (let dx = 0; dx < PPT; dx++) {
        const n = h2(ox + dx, oy + dy, 12) % 100;
        if (n < 12) px(buf, stride, ox + dx, oy + dy, bed.b[0]);
        else if (n < 20) px(buf, stride, ox + dx, oy + dy, bed.b[3]);
      }
    }
  };

  return {
    grass: paintGrass,
    path: paintPath,
    dirt: paintDirt,
    sand: paintSand,
    water: paintWaterBed,
  };
}

const FLOWER_PROB = 0.035;

/** Cache key includes the theme, so a palette swap regenerates correctly. */
const cache = new Map<string, THREE.CanvasTexture>();

export function makeGroundTexture(mapData: GameMap, theme: Theme): THREE.CanvasTexture {
  PPT = mapData.pixelsPerTile ?? 8;
  const key = `${theme.id}|${mapData.name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const w = mapData.width * PPT;
  const h = mapData.height * PPT;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const image = ctx.createImageData(w, h);
  const buf = image.data;
  const painters = makePainters(theme);
  const flowerInts = theme.palette.flowers.map(hex);
  const grass = rampInts(theme.palette.grass);

  for (let ty = 0; ty < mapData.height; ty++) {
    const row = mapData.ground[ty];
    const oy = ty * PPT;
    for (let tx = 0; tx < mapData.width; tx++) {
      (painters[row?.[tx] ?? 'grass'] ?? painters.grass)(buf, w, tx * PPT, oy, tx, ty);
    }
  }

  // Flower clusters scattered over grass.
  for (let ty = 0; ty < mapData.height; ty++) {
    const row = mapData.ground[ty];
    for (let tx = 0; tx < mapData.width; tx++) {
      if ((row?.[tx] ?? 'grass') !== 'grass') continue;
      if ((h2(tx, ty, 21) % 10000) / 10000 >= FLOWER_PROB) continue;

      const color = flowerInts[h2(tx, ty, 22) % flowerInts.length];
      const count = 4 + (h2(tx, ty, 23) % 6);
      const radius = 2 + (h2(tx, ty, 24) % 3);
      const span = radius * 2 + 1;

      for (let i = 0; i < count; i++) {
        const fx = tx + ((h2(tx + i, ty, 25) % span) - radius);
        const fy = ty + ((h2(tx, ty + i, 26) % span) - radius);
        if (fx < 0 || fx >= mapData.width || fy < 0 || fy >= mapData.height) continue;
        if ((mapData.ground[fy]?.[fx] ?? 'grass') !== 'grass') continue;

        const ox = fx * PPT;
        const oy = fy * PPT;
        const cx = 2 + (h2(fx, fy, 27) % 4);
        const cy = 2 + (h2(fx, fy, 28) % 4);
        px(buf, w, ox + cx, oy + cy, color);
        px(buf, w, ox + cx + 1, oy + cy, color);
        px(buf, w, ox + cx, oy + cy + 1, color);
        px(buf, w, ox + cx + 1, oy + cy + 1, grass.b[0]);
      }
    }
  }

  ctx.putImageData(image, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  // Mipmaps kill the shimmer on a 2400px+ texture minified at this camera pitch.
  tex.minFilter = THREE.NearestMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  cache.set(key, tex);
  return tex;
}

/**
 * Per-tile water mask, used as the water surface alphaMap so one plane can cover
 * every lake / pond / river shape in a single draw call.
 */
const maskCache = new Map<string, THREE.Texture>();

export function buildWaterMask(mapData: GameMap): THREE.Texture {
  const hit = maskCache.get(mapData.name);
  if (hit) return hit;

  const { width, height } = mapData;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(width, height);
  const buf = image.data;

  for (let ty = 0; ty < height; ty++) {
    const row = mapData.ground[ty];
    for (let tx = 0; tx < width; tx++) {
      const v = row?.[tx] === 'water' ? 255 : 0;
      const i = (ty * width + tx) << 2;
      buf[i] = v;
      buf[i + 1] = v;
      buf[i + 2] = v;
      buf[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  maskCache.set(mapData.name, tex);
  return tex;
}

export function hasWater(mapData: GameMap): boolean {
  for (let ty = 0; ty < mapData.height; ty++) {
    const row = mapData.ground[ty];
    if (!row) continue;
    for (let tx = 0; tx < mapData.width; tx++) if (row[tx] === 'water') return true;
  }
  return false;
}

export function disposeGroundTexture(name: string): void {
  for (const [k, v] of cache) if (k.endsWith('|' + name)) { v.dispose(); cache.delete(k); }
}

export function disposeWaterMask(name: string): void {
  const t = maskCache.get(name); if (t) { t.dispose(); maskCache.delete(name); }
}
