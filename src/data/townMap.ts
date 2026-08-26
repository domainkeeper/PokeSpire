import type { GameMap, TileType, MapObject } from './mapTypes';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';
const D: TileType = 'dirt';

function makeGround(): TileType[][] {
  const grid: TileType[][] = Array.from({ length: 60 }, () =>
    Array.from({ length: 60 }, () => G),
  );

  // main paths (4-6 cells wide)
  for (let y = 0; y < 60; y++) {
    for (let x = 24; x <= 34; x++) {
      grid[y][x] = P;
    }
  }
  for (let x = 0; x < 60; x++) {
    for (let y = 26; y <= 32; y++) {
      grid[y][x] = P;
    }
  }

  // building pads
  for (let y = 6; y <= 16; y++) {
    for (let x = 8; x <= 20; x++) {
      grid[y][x] = D;
    }
  }
  for (let y = 6; y <= 16; y++) {
    for (let x = 38; x <= 50; x++) {
      grid[y][x] = D;
    }
  }

  // house 1 doorstep
  for (let y = 17; y <= 18; y++) {
    for (let x = 13; x <= 15; x++) {
      grid[y][x] = P;
    }
  }

  // house 2 doorstep
  for (let y = 17; y <= 18; y++) {
    for (let x = 43; x <= 45; x++) {
      grid[y][x] = P;
    }
  }

  // flower patches
  for (let y = 22; y <= 24; y++) {
    for (let x = 6; x <= 10; x++) {
      grid[y][x] = G;
    }
  }

  // water pond
  for (let y = 42; y <= 50; y++) {
    for (let x = 6; x <= 14; x++) {
      grid[y][x] = W;
    }
  }

  // exit path at bottom
  for (let y = 55; y <= 59; y++) {
    for (let x = 27; x <= 31; x++) {
      grid[y][x] = P;
    }
  }

  return grid;
}

const objects: MapObject[] = [
  // border trees
  ...Array.from({ length: 60 }, (_, i) => ({ type: 'tree' as const, gx: i, gy: 0, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3 })),
  ...Array.from({ length: 60 }, (_, i) => ({ type: 'tree' as const, gx: i, gy: 58, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3 })),
  ...Array.from({ length: 60 }, (_, i) => ({ type: 'tree' as const, gx: 0, gy: i, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3 })),
  ...Array.from({ length: 60 }, (_, i) => ({ type: 'tree' as const, gx: 58, gy: i, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3 })),

  // House 1 (red)
  { type: 'building', gx: 8, gy: 6, footprintW: 12, footprintH: 10, collision: true, spriteW: 6, spriteH: 5 },

  // House 2 (blue)
  { type: 'building2', gx: 38, gy: 6, footprintW: 12, footprintH: 10, collision: true, spriteW: 6, spriteH: 5 },

  // fence around house 1
  { type: 'fence', gx: 6, gy: 5, footprintW: 16, footprintH: 1, collision: true, spriteW: 8, spriteH: 1 },
  { type: 'fence', gx: 6, gy: 17, footprintW: 16, footprintH: 1, collision: true, spriteW: 8, spriteH: 1 },
  { type: 'fence', gx: 5, gy: 6, footprintW: 1, footprintH: 12, collision: true, spriteW: 1, spriteH: 6 },
  { type: 'fence', gx: 22, gy: 6, footprintW: 1, footprintH: 12, collision: true, spriteW: 1, spriteH: 6 },

  // fence around house 2
  { type: 'fence', gx: 36, gy: 5, footprintW: 16, footprintH: 1, collision: true, spriteW: 8, spriteH: 1 },
  { type: 'fence', gx: 36, gy: 17, footprintW: 16, footprintH: 1, collision: true, spriteW: 8, spriteH: 1 },
  { type: 'fence', gx: 35, gy: 6, footprintW: 1, footprintH: 12, collision: true, spriteW: 1, spriteH: 6 },
  { type: 'fence', gx: 52, gy: 6, footprintW: 1, footprintH: 12, collision: true, spriteW: 1, spriteH: 6 },

  // scattered trees
  { type: 'tree', gx: 4, gy: 22, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 54, gy: 20, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 3, gy: 35, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 55, gy: 38, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'small_tree', gx: 16, gy: 28, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 42, gy: 30, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 2, animSway: true },

  // bushes
  { type: 'bush', gx: 12, gy: 20, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },
  { type: 'bush', gx: 48, gy: 22, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },
  { type: 'bush', gx: 20, gy: 40, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },
  { type: 'bush', gx: 40, gy: 42, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },

  // flowers
  { type: 'flower', gx: 8, gy: 22, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 9, gy: 23, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 10, gy: 22, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 50, gy: 25, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 51, gy: 26, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 30, gy: 20, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 28, gy: 45, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 32, gy: 46, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },

  // sign
  { type: 'sign', gx: 26, gy: 50, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 2 },

  // rocks near water
  { type: 'rock', gx: 5, gy: 41, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 1 },
  { type: 'rock', gx: 15, gy: 48, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 1 },

  // water pond (collision)
  { type: 'water', gx: 6, gy: 42, footprintW: 8, footprintH: 8, collision: true, spriteW: 4, spriteH: 4 },
];

export const townMap: GameMap = {
  name: 'town',
  width: 60,
  height: 60,
  ground: makeGround(),
  objects,
  spawn: { x: 30, y: 38, facing: 'down' },
  exits: [
    { x: 27, y: 58, w: 4, h: 1, toMap: 'route1', spawnX: 40, spawnY: 3, facing: 'down' },
  ],
  npcPositions: [
    { x: 30, y: 22, name: 'Professor', dialogue: 'Welcome to PokéSpire! Choose your partner wisely.', color: '#42a5f5' },
    { x: 45, y: 20, name: 'Resident', dialogue: 'This town has been here for generations.', color: '#ab47bc' },
  ],
  backgroundType: 'town',
};
