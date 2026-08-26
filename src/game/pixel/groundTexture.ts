import * as THREE from 'three';
import type { GameMap } from '../../data/mapTypes';
import type { TileType } from '../../assets/tileRegistry';

const PPT = 8;

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0);
}

function pseudoRand(x: number, y: number, seed: number): number {
  return ((hash(x, y) ^ (seed * 99991)) >>> 0) % 100;
}

const GRASS_VARIANTS = [
  { base: '#4a8a42', blade: '#3d7a35', highlight: '#5a9a52', dark: '#2d6a25' },
  { base: '#468540', blade: '#3a7534', highlight: '#569550', dark: '#2a6524' },
  { base: '#4e8e46', blade: '#407e38', highlight: '#5e9e56', dark: '#306e28' },
  { base: '#488844', blade: '#3c7838', highlight: '#589854', dark: '#2c6828' },
  { base: '#4c8c44', blade: '#3e7c36', highlight: '#5c9c54', dark: '#2e6c26' },
];

function paintGrass(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const variantIdx = hash(tx, ty) % GRASS_VARIANTS.length;
  const v = GRASS_VARIANTS[variantIdx];

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, v.base);
    }
  }

  // One grass blade per tile — subtle vertical accent
  const r1 = pseudoRand(tx, ty, 1);
  if (r1 < 20) {
    const bx = r1 % PPT;
    p(bx, 0, v.dark);
    if (1 < PPT) p(bx, 1, v.dark);
  }

  // One highlight pixel
  const r2 = pseudoRand(tx, ty, 2);
  if (r2 < 12) {
    const bx = r2 % PPT;
    p(bx, 0, v.highlight);
  }
}

const FLOWER_COLORS = ['#c08888', '#c8a0a0', '#c8c078', '#d0c898', '#c09080', '#c09878'];

function paintFlowerCluster(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const variantIdx = hash(tx, ty) % GRASS_VARIANTS.length;
  const v = GRASS_VARIANTS[variantIdx];

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, v.base);
    }
  }

  const colorIdx = hash(tx * 3, ty * 7) % FLOWER_COLORS.length;
  const flowerColor = FLOWER_COLORS[colorIdx];
  // Compact cluster — 3-5 pixels in a tight group
  const clusterSize = 3 + (hash(tx, ty) % 3);
  const cx = 2 + (hash(tx * 5, ty * 9) % 4);
  const cy = 2 + (hash(tx * 7, ty * 11) % 4);

  for (let i = 0; i < clusterSize; i++) {
    const fx = cx + ((hash(tx + i, ty) % 3) - 1);
    const fy = cy + ((hash(tx, ty + i) % 3) - 1);
    if (fx >= 0 && fx < PPT && fy >= 0 && fy < PPT) {
      p(fx, fy, flowerColor);
    }
  }
}

function paintPath(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, '#b8a878');
    }
  }

  const r1 = pseudoRand(tx, ty, 10);
  if (r1 < 25) {
    p(1, 1, '#c8b898');
    p(2, 2, '#c8b898');
  }

  const r2 = pseudoRand(tx, ty, 11);
  if (r2 < 15) {
    p(r2 % 3 + 1, (r2 >> 2) % 3 + 1, '#807050');
  }

  const r3 = pseudoRand(tx, ty, 12);
  if (r3 < 10) {
    p(r3 % PPT, 0, '#a09068');
    p(0, r3 % PPT, '#a09068');
  }
}

function paintWater(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const waveRow = ty % 4;
  const baseColors = ['#3a6878', '#3d6b7b', '#3a6878', '#376575'];
  const base = baseColors[waveRow];

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, base);
    }
  }

  if (waveRow === 1 || waveRow === 3) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, 1, '#4a7888');
      if (dx + 2 < PPT) p(dx + 2, 2, '#5a8898');
    }
  }

  const r = pseudoRand(tx, ty, 20);
  if (r < 10) {
    p(r % PPT, (r >> 2) % PPT, '#8ab0c0');
  }

  if ((tx + ty) % 8 === 0) {
    p(1, 2, '#a0c8d8');
    p(2, 2, '#a0c8d8');
    p(3, 3, '#8ab0c0');
  }
}

function paintDirt(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const v = hash(tx, ty) % 3;
  const bases = ['#806040', '#756040', '#806040'];
  const base = bases[v];

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, base);
    }
  }

  const r1 = pseudoRand(tx, ty, 30);
  if (r1 < 15) {
    p(r1 % PPT, (r1 >> 2) % PPT, '#5a4028');
  }

  const r2 = pseudoRand(tx, ty, 31);
  if (r2 < 8) {
    p(r2 % PPT, (r2 >> 2) % PPT, '#988058');
  }
}

function paintSand(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) {
  const p = (dx: number, dy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  };

  const base = hash(tx, ty) % 2 === 0 ? '#c8b070' : '#c0a868';

  for (let dy = 0; dy < PPT; dy++) {
    for (let dx = 0; dx < PPT; dx++) {
      p(dx, dy, base);
    }
  }

  const r = pseudoRand(tx, ty, 40);
  if (r < 10) p(r % PPT, (r >> 2) % PPT, '#b8a058');
}

const painters: Record<TileType, (ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number) => void> = {
  grass: paintGrass,
  path: paintPath,
  water: paintWater,
  dirt: paintDirt,
  sand: paintSand,
};

const FLOWER_PROB = 0.03;

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

  const flowerRng = (tx: number, ty: number) => ((hash(tx * 2654435761, ty * 40503) >>> 0) % 10000) / 10000;

  for (let ty = 0; ty < mapData.height; ty++) {
    for (let tx = 0; tx < mapData.width; tx++) {
      const tileType: TileType = mapData.ground[ty]?.[tx] || 'grass';
      if (tileType !== 'grass') continue;

      if (flowerRng(tx, ty) < FLOWER_PROB) {
        const cx = tx;
        const cy = ty;
        const clusterSize = 3 + (hash(tx, ty) % 5);
        const clusterRadius = 2 + (hash(tx + 1, ty + 1) % 3);

        for (let i = 0; i < clusterSize; i++) {
          const fx = cx + ((hash(cx * 7 + i, cy * 13) % (clusterRadius * 2 + 1)) - clusterRadius);
          const fy = cy + ((hash(cx * 11, cy * 17 + i) % (clusterRadius * 2 + 1)) - clusterRadius);

          if (fx >= 0 && fx < mapData.width && fy >= 0 && fy < mapData.height) {
            const ft: TileType = mapData.ground[fy]?.[fx] || 'grass';
            if (ft === 'grass') {
              paintFlowerCluster(ctx, fx * PPT, fy * PPT, fx, fy);
            }
          }
        }
      }
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
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
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
