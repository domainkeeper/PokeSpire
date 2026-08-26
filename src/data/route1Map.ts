import type { GameMap, TileType, MapObject } from './mapTypes';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';

function makeGround(): TileType[][] {
  const grid: TileType[][] = Array.from({ length: 60 }, () =>
    Array.from({ length: 80 }, () => G),
  );

  // main path running vertically
  for (let y = 0; y < 60; y++) {
    for (let x = 38; x <= 42; x++) {
      grid[y][x] = P;
    }
  }

  // branching paths
  for (let x = 20; x <= 42; x++) {
    for (let y = 18; y <= 22; y++) {
      grid[y][x] = P;
    }
  }

  for (let x = 38; x <= 60; x++) {
    for (let y = 38; y <= 42; y++) {
      grid[y][x] = P;
    }
  }

  // pond
  for (let y = 28; y <= 36; y++) {
    for (let x = 10; x <= 22; x++) {
      grid[y][x] = W;
    }
  }

  // exit path at top
  for (let y = 0; y <= 4; y++) {
    for (let x = 38; x <= 42; x++) {
      grid[y][x] = P;
    }
  }

  return grid;
}

const objects: MapObject[] = [
  // border trees top
  ...Array.from({ length: 80 }, (_, i) => ({ type: 'tree' as const, gx: i, gy: 0, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3 })),
  // border trees bottom
  ...Array.from({ length: 80 }, (_, i) => ({ type: 'tree' as const, gx: i, gy: 58, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3 })),
  // border trees left
  ...Array.from({ length: 60 }, (_, i) => ({ type: 'tree' as const, gx: 0, gy: i, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3 })),
  // border trees right
  ...Array.from({ length: 60 }, (_, i) => ({ type: 'tree' as const, gx: 78, gy: i, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3 })),

  // scattered trees
  { type: 'tree', gx: 5, gy: 8, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 70, gy: 10, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 8, gy: 45, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 65, gy: 48, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 30, gy: 10, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 55, gy: 30, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'small_tree', gx: 15, gy: 15, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 60, gy: 20, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 25, gy: 50, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 50, gy: 52, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 2, animSway: true },

  // bushes
  { type: 'bush', gx: 12, gy: 12, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },
  { type: 'bush', gx: 62, gy: 15, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },
  { type: 'bush', gx: 18, gy: 42, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },
  { type: 'bush', gx: 58, gy: 45, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },
  { type: 'bush', gx: 35, gy: 30, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },
  { type: 'bush', gx: 48, gy: 28, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 1, animSway: true },

  // rocks
  { type: 'rock', gx: 25, gy: 25, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 1 },
  { type: 'rock', gx: 52, gy: 35, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 1 },
  { type: 'rock', gx: 15, gy: 52, footprintW: 2, footprintH: 2, collision: true, spriteW: 2, spriteH: 1 },

  // flowers
  { type: 'flower', gx: 8, gy: 20, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 9, gy: 21, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 55, gy: 22, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 30, gy: 48, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 60, gy: 40, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },
  { type: 'flower', gx: 22, gy: 35, footprintW: 1, footprintH: 1, collision: false, spriteW: 1, spriteH: 1, animScale: true },

  // water pond (collision)
  { type: 'water', gx: 10, gy: 28, footprintW: 12, footprintH: 8, collision: true, spriteW: 6, spriteH: 4 },

  // sign at entrance
  { type: 'sign', gx: 44, gy: 5, footprintW: 1, footprintH: 1, collision: true, spriteW: 1, spriteH: 2 },

  // fence sections
  { type: 'fence', gx: 30, gy: 15, footprintW: 6, footprintH: 1, collision: true, spriteW: 3, spriteH: 1 },
  { type: 'fence', gx: 45, gy: 35, footprintW: 6, footprintH: 1, collision: true, spriteW: 3, spriteH: 1 },
];

export const route1Map: GameMap = {
  name: 'route1',
  width: 80,
  height: 60,
  ground: makeGround(),
  objects,
  spawn: { x: 40, y: 3, facing: 'down' },
  exits: [
    { x: 38, y: 0, w: 4, h: 1, toMap: 'town', spawnX: 30, spawnY: 55, facing: 'down' },
  ],
  npcPositions: [
    { x: 30, y: 20, name: 'Hiker', dialogue: 'This route leads to tall grass. Be careful!', color: '#8d6e63' },
  ],
  backgroundType: 'route',
};
