import * as THREE from 'three';
import type { GameMap } from '../../data/mapTypes';
import type { TileType } from '../../assets/tileRegistry';

const PPT = 4;

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) % 1000;
}

const GRASS_BASES = ['#3a7d32', '#3d8b37', '#43a047', '#358030', '#2e7d32'];
const GRASS_DARK = ['#1b5e20', '#2e7d32', '#1a5c1a', '#256b25'];
const GRASS_LIGHT = ['#66bb6a', '#81c784', '#5aad52', '#73c46e'];
const GRASS_BLADE = ['#2d6e27', '#348232', '#2a6424'];

const PATH_BASES = ['#c8b68e', '#bca87a', '#b8a270', '#c4b088'];
const PATH_DARK = ['#a08860', '#9a8058', '#8e7650'];
const PATH_LIGHT = ['#d8cca0', '#d4c898', '#cec090'];
const PATH_STONE = ['#b0a070', '#a89868'];

const WATER_BASES = ['#1976d2', '#1e88e5', '#1565c0'];
const WATER_MID = ['#2196f3', '#42a5f5', '#2196f3'];
const WATER_LIGHT = ['#64b5f6', '#90caf9', '#bbdefb'];
const WATER_DARK = ['#0d47a1', '#1565c0'];

const DIRT_BASES = ['#8d6e4c', '#7d6040', '#9a7a58', '#846545'];
const DIRT_DARK = ['#6d5030', '#5d4428', '#644a2e'];
const DIRT_LIGHT = ['#a88a60', '#b09468'];

function pick<T>(arr: T[], h: number): T {
  return arr[h % arr.length];
}

function paintGrass(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number) {
  const h = hash(tx, ty);
  const base = pick(GRASS_BASES, h);

  for (let py = 0; py < PPT; py++) {
    for (let px = 0; px < PPT; px++) {
      const ph = hash(tx * 137 + px, ty * 251 + py);
      let color = base;

      if (ph % 18 === 0) color = pick(GRASS_DARK, ph);
      else if (ph % 22 === 0) color = pick(GRASS_BLADE, ph);
      else if (ph % 25 === 0) color = pick(GRASS_LIGHT, ph);
      else if (ph % 60 === 0) color = '#f48fb1';
      else if (ph % 70 === 0) color = '#fff176';
      else if (ph % 80 === 0) color = '#ce93d8';

      ctx.fillStyle = color;
      ctx.fillRect(cx + px, cy + py, 1, 1);
    }
  }
}

function paintPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number) {
  const h = hash(tx, ty);
  const base = pick(PATH_BASES, h);

  for (let py = 0; py < PPT; py++) {
    for (let px = 0; px < PPT; px++) {
      const ph = hash(tx * 97 + px, ty * 193 + py);
      let color = base;

      if ((px === 0 || py === 0) && ph % 3 === 0) color = pick(PATH_DARK, ph);
      else if (px === 2 && py === 2 && ph % 2 === 0) color = pick(PATH_LIGHT, ph);
      else if (ph % 12 === 0) color = pick(PATH_STONE, ph);
      else if (ph % 30 === 0) color = pick(PATH_DARK, ph);

      ctx.fillStyle = color;
      ctx.fillRect(cx + px, cy + py, 1, 1);
    }
  }
}

function paintWater(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number) {
  const h = hash(tx, ty);
  const base = pick(WATER_BASES, h);

  for (let py = 0; py < PPT; py++) {
    for (let px = 0; px < PPT; px++) {
      const ph = hash(tx * 53 + px, ty * 101 + py);
      let color = base;

      if (py === 1 || py === 3) {
        if (ph % 3 === 0) color = pick(WATER_MID, ph);
        else if (ph % 5 === 0) color = pick(WATER_LIGHT, ph);
      } else if (py === 0 && ph % 4 === 0) {
        color = pick(WATER_LIGHT, ph);
      } else if (py === 2 && ph % 6 === 0) {
        color = pick(WATER_DARK, ph);
      }

      ctx.fillStyle = color;
      ctx.fillRect(cx + px, cy + py, 1, 1);
    }
  }
}

function paintDirt(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number) {
  const h = hash(tx, ty);
  const base = pick(DIRT_BASES, h);

  for (let py = 0; py < PPT; py++) {
    for (let px = 0; px < PPT; px++) {
      const ph = hash(tx * 83 + px, ty * 167 + py);
      let color = base;

      if (ph % 8 === 0) color = pick(DIRT_DARK, ph);
      else if (ph % 15 === 0) color = pick(DIRT_LIGHT, ph);

      ctx.fillStyle = color;
      ctx.fillRect(cx + px, cy + py, 1, 1);
    }
  }
}

function paintSand(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number) {
  const h = hash(tx, ty);
  const bases = ['#dbc07c', '#e0c880', '#d4b870'];

  for (let py = 0; py < PPT; py++) {
    for (let px = 0; px < PPT; px++) {
      const ph = hash(tx * 113 + px, ty * 211 + py);
      let color = pick(bases, h);

      if (ph % 10 === 0) color = '#c8a860';
      else if (ph % 14 === 0) color = '#e8d898';

      ctx.fillStyle = color;
      ctx.fillRect(cx + px, cy + py, 1, 1);
    }
  }
}

const painters: Record<TileType, (ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number) => void> = {
  grass: paintGrass,
  path: paintPath,
  water: paintWater,
  dirt: paintDirt,
  sand: paintSand,
};

export function makeGroundTexture(mapData: GameMap): THREE.CanvasTexture {
  const w = mapData.width * PPT;
  const h = mapData.height * PPT;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let ty = 0; ty < mapData.height; ty++) {
    for (let tx = 0; tx < mapData.width; tx++) {
      const tileType: TileType = mapData.ground[ty]?.[tx] || 'grass';
      const painter = painters[tileType] || paintGrass;
      painter(ctx, tx * PPT, ty * PPT, tx, ty);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

let shadowTex: THREE.CanvasTexture | null = null;
export function getShadowTexture(): THREE.CanvasTexture {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 4;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const pattern = [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
  ];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      if (pattern[y][x]) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  shadowTex = new THREE.CanvasTexture(c);
  shadowTex.magFilter = THREE.NearestFilter;
  shadowTex.minFilter = THREE.NearestFilter;
  shadowTex.generateMipmaps = false;
  return shadowTex;
}
