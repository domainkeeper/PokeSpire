import * as THREE from 'three';
import type { GameMap } from '../../data/mapTypes';
import type { TileType } from '../../assets/tileRegistry';

const PPT = 4;

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0);
}

function pseudoRand(x: number, y: number, seed: number): number {
  return ((hash(x, y) ^ (seed * 99991)) >>> 0) % 100;
}

const G = {
  dark1: '#2d6b27', dark2: '#1f5a1a',
  base1: '#3a8c32', base2: '#3d8b37', base3: '#43a047', base4: '#358030',
  light1: '#5aad52', light2: '#66bb6a',
  highlight: '#81c784',
};

const P = {
  dark: '#8a7550', mid: '#a89068', base: '#c4b088', light: '#d8cca0',
};

const W = {
  deep: '#0d47a1', dark: '#1565c0', base: '#1976d2', mid: '#2196f3',
  light: '#42a5f5', sparkle: '#bbdefb', foam: '#e3f2fd',
};

const D = {
  dark: '#5d4428', mid: '#7d6040', base: '#8d6e4c', light: '#a88a60',
};

function paintGrass(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const v = (hash(tx, ty) % 4);
  const bases = [G.base1, G.base2, G.base3, G.base4];
  const base = bases[v];

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, base);
    }
  }

  const r = pseudoRand(tx, ty, 1);
  if (r < 12) {
    const bx = r % PPT;
    const by = (r >> 2) % PPT;
    p(bx, by, G.dark1);
    if (by + 1 < PPT) p(bx, by + 1, G.dark2);
  }

  const r2 = pseudoRand(tx, ty, 2);
  if (r2 < 8) {
    const bx = r2 % PPT;
    const by = (r2 >> 2) % PPT;
    p(bx, by, G.light1);
  }

  const r3 = pseudoRand(tx, ty, 3);
  if (r3 < 3) {
    const bx = r3 % PPT;
    p(bx, 0, '#f48fb1');
    p(bx, 1, '#e91e63');
  } else if (r3 < 5) {
    const bx = r3 % PPT;
    p(bx, 0, '#fff176');
    p(bx, 1, '#fdd835');
  }

  const r4 = pseudoRand(tx, ty, 5);
  if (r4 < 2) {
    p(0, r4 % PPT, G.highlight);
  }
}

function paintPath(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, P.base);
    }
  }

  p(0, 0, P.dark); p(3, 0, P.dark);
  p(0, 3, P.dark); p(3, 3, P.dark);

  const r = pseudoRand(tx, ty, 10);
  if (r < 30) {
    p(1, 1, P.light);
    p(2, 2, P.light);
  }

  const r2 = pseudoRand(tx, ty, 11);
  if (r2 < 20) {
    p(r2 % 3 + 1, (r2 >> 2) % 3 + 1, P.mid);
  }
}

function paintWater(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const waveRow = (ty % 4);
  const baseColors = [W.base, W.mid, W.base, W.dark];
  const base = baseColors[waveRow];

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, base);
    }
  }

  if (waveRow === 1 || waveRow === 3) {
    p(0, 1, W.light); p(1, 1, W.light);
    p(2, 1, W.light); p(3, 1, W.light);
  }

  const r = pseudoRand(tx, ty, 20);
  if (r < 10) {
    p(r % PPT, (r >> 2) % PPT, W.sparkle);
  }

  if ((tx + ty) % 8 === 0) {
    p(1, 2, W.foam); p(2, 2, W.foam);
  }
}

function paintDirt(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const v = hash(tx, ty) % 3;
  const bases = [D.base, D.mid, D.base];
  const base = bases[v];

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, base);
    }
  }

  const r = pseudoRand(tx, ty, 30);
  if (r < 15) {
    p(r % PPT, (r >> 2) % PPT, D.dark);
  }

  const r2 = pseudoRand(tx, ty, 31);
  if (r2 < 8) {
    p(r2 % PPT, (r2 >> 2) % PPT, D.light);
  }
}

function paintSand(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const base = hash(tx, ty) % 2 === 0 ? '#dbc07c' : '#d4b870';

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, base);
    }
  }

  const r = pseudoRand(tx, ty, 40);
  if (r < 10) p(r % PPT, (r >> 2) % PPT, '#c8a860');
}

const painters: Record<TileType, (ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) => void> = {
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

let shoreTex: THREE.CanvasTexture | null = null;
export function getShoreTexture(): THREE.CanvasTexture {
  if (shoreTex) return shoreTex;
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 8;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#8d6e4c';
  ctx.fillRect(0, 0, 8, 8);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(1, 1, 6, 6);
  ctx.fillStyle = '#c4b088';
  ctx.fillRect(2, 2, 4, 4);
  shoreTex = new THREE.CanvasTexture(c);
  shoreTex.magFilter = THREE.NearestFilter;
  shoreTex.minFilter = THREE.NearestFilter;
  shoreTex.generateMipmaps = false;
  return shoreTex;
}
