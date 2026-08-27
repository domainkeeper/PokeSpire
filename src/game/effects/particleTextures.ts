import * as THREE from 'three';
import { toPixelTexture, makeCanvas } from '../pixel/textureLib';
import type { ParticleTexture } from './types';

const textureCache = new Map<string, THREE.Texture>();

function cacheKey(kind: string, color: string, size: number): string {
  return `${kind}|${color}|${size}`;
}

function getOrCreate(key: string, builder: () => HTMLCanvasElement): THREE.Texture {
  const hit = textureCache.get(key);
  if (hit) return hit;
  const tex = toPixelTexture(builder());
  textureCache.set(key, tex);
  return tex;
}

function circleCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 0.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > r) continue;
      const a = d > r - 1 ? 1 - (d - (r - 1)) : 1;
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

function squareCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  // Slight edge highlight
  const lighter = lighten(color, 30);
  ctx.fillStyle = lighter;
  ctx.fillRect(0, 0, size, 1);
  ctx.fillRect(0, 0, 1, size);
  return c;
}

function diamondCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d > cx) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function starCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 0.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const a = Math.atan2(y - cy, x - cx);
      const d = Math.hypot(x - cx, y - cy);
      // 4-point star
      const starR = r * (0.4 + 0.6 * Math.abs(Math.cos(a * 2)));
      if (d > starR) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function leafCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const w = Math.floor(size * 0.6);
  const h = size;
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const widthAt = Math.floor(w * Math.sin(t * Math.PI));
    const startX = Math.floor((size - widthAt) / 2);
    for (let x = startX; x < startX + widthAt; x++) {
      if (x < 0 || x >= size) continue;
      // Vein highlight
      const isVein = x === Math.floor(size / 2) && y > 1 && y < h - 1;
      ctx.fillStyle = isVein ? lighten(color, 40) : color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function dropCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  // Top half: tapered
  for (let y = 0; y < size; y++) {
    const t = y / size;
    let widthAt: number;
    if (t < 0.35) {
      widthAt = Math.floor(size * 0.15 * (t / 0.35));
    } else {
      widthAt = Math.floor(size * 0.15 + (size * 0.85) * ((t - 0.35) / 0.65));
    }
    widthAt = Math.max(1, widthAt);
    const startX = Math.floor(cx - widthAt / 2);
    for (let x = startX; x < startX + widthAt; x++) {
      if (x < 0 || x >= size) continue;
      const edge = x === startX || x === startX + widthAt - 1;
      ctx.fillStyle = edge ? darken(color, 20) : color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Highlight
  ctx.fillStyle = lighten(color, 50);
  ctx.globalAlpha = 0.5;
  ctx.fillRect(Math.floor(cx) - 1, Math.floor(size * 0.6), 1, 1);
  ctx.globalAlpha = 1;
  return c;
}

function shardCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  // Angular crystal shard shape
  const points = [
    [size * 0.5, 0],
    [size * 0.8, size * 0.4],
    [size * 0.6, size],
    [size * 0.4, size],
    [size * 0.2, size * 0.4],
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (pointInPolygon(x, y, points)) {
        const edge = isEdge(x, y, points, size);
        ctx.fillStyle = edge ? lighten(color, 30) : color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

function ringCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= r - 1 && d <= r) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

function smokeCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy) / (size / 2);
      if (d > 1) continue;
      // Wobbly blob
      const a = Math.atan2(y - cy, x - cx);
      const wobble = 0.8 + 0.2 * Math.sin(a * 3);
      if (d > wobble) continue;
      const alpha = Math.max(0, 1 - d * 1.2);
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

function sparkCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;
  // Cross-shaped spark
  ctx.fillStyle = color;
  ctx.fillRect(cx - 0.5, 0, 1, size);
  ctx.fillRect(0, cy - 0.5, size, 1);
  // Bright center
  ctx.fillStyle = lighten(color, 60);
  ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);
  return c;
}

function waveCanvas(color: string, size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wave = Math.sin((x / size) * Math.PI * 2) * (size * 0.15);
      const dy = Math.abs(y - (size / 2 + wave));
      if (dy < size * 0.2) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

function pointInPolygon(x: number, y: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isEdge(x: number, y: number, polygon: number[][], _size: number): boolean {
  const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
  for (const [nx, ny] of neighbors) {
    if (!pointInPolygon(nx, ny, polygon)) return true;
  }
  return false;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return '#' +
    Math.min(255, r + amount).toString(16).padStart(2, '0') +
    Math.min(255, g + amount).toString(16).padStart(2, '0') +
    Math.min(255, b + amount).toString(16).padStart(2, '0');
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return '#' +
    Math.max(0, r - amount).toString(16).padStart(2, '0') +
    Math.max(0, g - amount).toString(16).padStart(2, '0') +
    Math.max(0, b - amount).toString(16).padStart(2, '0');
}

const builders: Record<ParticleTexture, (color: string, size: number) => HTMLCanvasElement> = {
  circle: circleCanvas,
  square: squareCanvas,
  diamond: diamondCanvas,
  star: starCanvas,
  leaf: leafCanvas,
  drop: dropCanvas,
  shard: shardCanvas,
  ring: ringCanvas,
  smoke: smokeCanvas,
  spark: sparkCanvas,
  wave: waveCanvas,
};

const PARTICLE_SIZE = 8;

export function getParticleTexture(kind: ParticleTexture, color: string): THREE.Texture {
  const key = cacheKey(kind, color, PARTICLE_SIZE);
  return getOrCreate(key, () => builders[kind](color, PARTICLE_SIZE));
}

export function clearParticleTextures(): void {
  for (const t of textureCache.values()) t.dispose();
  textureCache.clear();
}
