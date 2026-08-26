import type { GameMap, TileType, MapObject } from './mapTypes';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';
const D: TileType = 'dirt';

function makeGround(): TileType[][] {
  const grid: TileType[][] = Array.from({ length: 120 }, () =>
    Array.from({ length: 120 }, () => G),
  );

  // main paths (wide, ~8-10 cells = ~1-1.25 world units)
  for (let y = 0; y < 120; y++) {
    for (let x = 54; x <= 66; x++) grid[y][x] = P;
  }
  for (let x = 0; x < 120; x++) {
    for (let y = 56; y <= 64; y++) grid[y][x] = P;
  }

  // building pads (dirt)
  for (let y = 12; y <= 32; y++) {
    for (let x = 14; x <= 40; x++) grid[y][x] = D;
  }
  for (let y = 12; y <= 32; y++) {
    for (let x = 78; x <= 104; x++) grid[y][x] = D;
  }

  // house 1 doorstep
  for (let y = 33; y <= 36; y++) {
    for (let x = 24; x <= 30; x++) grid[y][x] = P;
  }

  // house 2 doorstep
  for (let y = 33; y <= 36; y++) {
    for (let x = 88; x <= 94; x++) grid[y][x] = P;
  }

  // water pond
  for (let y = 84; y <= 104; y++) {
    for (let x = 10; x <= 30; x++) grid[y][x] = W;
  }

  // exit path
  for (let y = 114; y <= 119; y++) {
    for (let x = 56; x <= 64; x++) grid[y][x] = P;
  }

  return grid;
}

const objects: MapObject[] = [
  // border trees (large, 2×3 world units each)
  ...Array.from({ length: 20 }, (_, i) => ({
    type: 'tree' as const, gx: i * 6, gy: 0, footprintW: 4, footprintH: 4,
    collision: true, spriteW: 2, spriteH: 3,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    type: 'tree' as const, gx: i * 6, gy: 116, footprintW: 4, footprintH: 4,
    collision: true, spriteW: 2, spriteH: 3,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    type: 'tree' as const, gx: 0, gy: i * 6, footprintW: 4, footprintH: 4,
    collision: true, spriteW: 2, spriteH: 3,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    type: 'tree' as const, gx: 116, gy: i * 6, footprintW: 4, footprintH: 4,
    collision: true, spriteW: 2, spriteH: 3,
  })),

  // House 1 (red) — large building
  { type: 'building', gx: 14, gy: 12, footprintW: 24, footprintH: 18, collision: true, spriteW: 4, spriteH: 4.5 },

  // House 2 (blue) — large building
  { type: 'building2', gx: 78, gy: 12, footprintW: 24, footprintH: 18, collision: true, spriteW: 4, spriteH: 4.5 },

  // fences around house 1 (long horizontal/vertical)
  { type: 'fence', gx: 10, gy: 10, footprintW: 30, footprintH: 2, collision: true, spriteW: 5, spriteH: 0.5 },
  { type: 'fence', gx: 10, gy: 32, footprintW: 30, footprintH: 2, collision: true, spriteW: 5, spriteH: 0.5 },
  { type: 'fence', gx: 8, gy: 12, footprintW: 2, footprintH: 20, collision: true, spriteW: 0.5, spriteH: 3 },
  { type: 'fence', gx: 42, gy: 12, footprintW: 2, footprintH: 20, collision: true, spriteW: 0.5, spriteH: 3 },

  // fences around house 2
  { type: 'fence', gx: 74, gy: 10, footprintW: 32, footprintH: 2, collision: true, spriteW: 5, spriteH: 0.5 },
  { type: 'fence', gx: 74, gy: 32, footprintW: 32, footprintH: 2, collision: true, spriteW: 5, spriteH: 0.5 },
  { type: 'fence', gx: 72, gy: 12, footprintW: 2, footprintH: 20, collision: true, spriteW: 0.5, spriteH: 3 },
  { type: 'fence', gx: 108, gy: 12, footprintW: 2, footprintH: 20, collision: true, spriteW: 0.5, spriteH: 3 },

  // scattered large trees
  { type: 'tree', gx: 6, gy: 42, footprintW: 4, footprintH: 4, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 108, gy: 40, footprintW: 4, footprintH: 4, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 4, gy: 70, footprintW: 4, footprintH: 4, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 110, gy: 74, footprintW: 4, footprintH: 4, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'small_tree', gx: 32, gy: 56, footprintW: 3, footprintH: 3, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 86, gy: 60, footprintW: 3, footprintH: 3, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },

  // bushes
  { type: 'bush', gx: 24, gy: 40, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 96, gy: 44, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 40, gy: 80, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 80, gy: 84, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },

  // flowers (non-blocking, animated)
  { type: 'flower', gx: 14, gy: 44, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 16, gy: 46, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 18, gy: 44, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 100, gy: 50, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 102, gy: 52, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 60, gy: 40, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 56, gy: 90, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 64, gy: 92, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },

  // sign
  { type: 'sign', gx: 52, gy: 100, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.6, spriteH: 1 },

  // rocks near water
  { type: 'rock', gx: 8, gy: 82, footprintW: 3, footprintH: 3, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 30, gy: 96, footprintW: 3, footprintH: 3, collision: true, spriteW: 1, spriteH: 0.7 },

  // water pond (large collision area)
  { type: 'water', gx: 10, gy: 84, footprintW: 20, footprintH: 20, collision: true, spriteW: 3, spriteH: 3 },
];

export const townMap: GameMap = {
  name: 'town',
  width: 120,
  height: 120,
  ground: makeGround(),
  objects,
  spawn: { x: 60, y: 76, facing: 'down' },
  exits: [
    { x: 56, y: 118, w: 8, h: 2, toMap: 'route1', spawnX: 80, spawnY: 4, facing: 'down' },
  ],
  npcPositions: [
    { x: 60, y: 44, name: 'Professor', dialogue: 'Welcome to PokéSpire! Choose your partner wisely.', color: '#42a5f5' },
    { x: 90, y: 40, name: 'Resident', dialogue: 'This town has been here for generations.', color: '#ab47bc' },
  ],
  backgroundType: 'town',
};
