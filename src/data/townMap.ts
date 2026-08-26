import type { GameMap, TileType, MapObject } from './mapTypes';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';
const D: TileType = 'dirt';

function makeGround(): TileType[][] {
  const grid: TileType[][] = Array.from({ length: 120 }, () =>
    Array.from({ length: 120 }, () => G),
  );

  // Main horizontal path through town center
  for (let x = 10; x <= 110; x++) {
    for (let y = 56; y <= 64; y++) grid[y][x] = P;
  }

  // Vertical path from player house to lab
  for (let y = 20; y <= 100; y++) {
    for (let x = 56; x <= 64; x++) grid[y][x] = P;
  }

  // Path to route 1 exit (south)
  for (let y = 100; y <= 118; y++) {
    for (let x = 56; x <= 64; x++) grid[y][x] = P;
  }

  // Dirt patches near buildings
  for (let x = 20; x <= 36; x++) {
    for (let y = 24; y <= 36; y++) grid[y][x] = D;
  }
  for (let x = 80; x <= 96; x++) {
    for (let y = 24; y <= 36; y++) grid[y][x] = D;
  }

  // Water pond (bottom-left)
  for (let y = 84; y <= 100; y++) {
    for (let x = 10; x <= 30; x++) grid[y][x] = W;
  }

  // Water edge tiles (lighter blue)
  for (let x = 9; x <= 31; x++) {
    if (grid[83]?.[x] === G) grid[83][x] = W;
    if (grid[101]?.[x] === G) grid[101][x] = W;
  }
  for (let y = 83; y <= 101; y++) {
    if (grid[y]?.[9] === G) grid[y][9] = W;
    if (grid[y]?.[31] === G) grid[y][31] = W;
  }

  return grid;
}

const objects: MapObject[] = [
  // === BORDER TREES (dense forest border) ===
  // Top border
  ...Array.from({ length: 30 }, (_, i) => ({
    type: 'tree' as const, gx: i * 4, gy: 0, footprintW: 3, footprintH: 3,
    collision: true, spriteW: 2, spriteH: 3, animSway: true,
  })),
  // Bottom border
  ...Array.from({ length: 30 }, (_, i) => ({
    type: 'tree' as const, gx: i * 4, gy: 116, footprintW: 3, footprintH: 3,
    collision: true, spriteW: 2, spriteH: 3, animSway: true,
  })),
  // Left border
  ...Array.from({ length: 30 }, (_, i) => ({
    type: 'tree' as const, gx: 0, gy: i * 4, footprintW: 3, footprintH: 3,
    collision: true, spriteW: 2, spriteH: 3, animSway: true,
  })),
  // Right border
  ...Array.from({ length: 30 }, (_, i) => ({
    type: 'tree' as const, gx: 116, gy: i * 4, footprintW: 3, footprintH: 3,
    collision: true, spriteW: 2, spriteH: 3, animSway: true,
  })),

  // === SCATTERED TREES (throughout town) ===
  { type: 'tree', gx: 8, gy: 12, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 108, gy: 12, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 8, gy: 48, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 108, gy: 48, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 36, gy: 72, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 84, gy: 72, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 40, gy: 108, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 80, gy: 108, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },

  // Small trees
  { type: 'small_tree', gx: 16, gy: 20, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 100, gy: 20, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 16, gy: 80, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 100, gy: 80, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 44, gy: 40, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 76, gy: 40, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },

  // === BUILDINGS ===
  // Player's house (top-left area)
  { type: 'building', gx: 20, gy: 20, footprintW: 12, footprintH: 10, collision: true, spriteW: 4, spriteH: 4.5 },

  // Professor's Lab (top-right area)
  { type: 'building2', gx: 80, gy: 20, footprintW: 14, footprintH: 10, collision: true, spriteW: 4.5, spriteH: 5 },

  // Shop (center-left)
  { type: 'building', gx: 20, gy: 44, footprintW: 10, footprintH: 8, collision: true, spriteW: 3.5, spriteH: 4 },

  // === FENCES (around buildings and garden areas) ===
  // Player house fence
  { type: 'fence', gx: 16, gy: 16, footprintW: 18, footprintH: 2, collision: true, spriteW: 2.5, spriteH: 0.5 },
  { type: 'fence', gx: 16, gy: 32, footprintW: 18, footprintH: 2, collision: true, spriteW: 2.5, spriteH: 0.5 },
  { type: 'fence', gx: 16, gy: 16, footprintW: 2, footprintH: 18, collision: true, spriteW: 0.5, spriteH: 2.5 },
  { type: 'fence', gx: 32, gy: 16, footprintW: 2, footprintH: 18, collision: true, spriteW: 0.5, spriteH: 2.5 },

  // Lab fence
  { type: 'fence', gx: 76, gy: 16, footprintW: 20, footprintH: 2, collision: true, spriteW: 3, spriteH: 0.5 },
  { type: 'fence', gx: 76, gy: 32, footprintW: 20, footprintH: 2, collision: true, spriteW: 3, spriteH: 0.5 },
  { type: 'fence', gx: 76, gy: 16, footprintW: 2, footprintH: 18, collision: true, spriteW: 0.5, spriteH: 2.5 },
  { type: 'fence', gx: 94, gy: 16, footprintW: 2, footprintH: 18, collision: true, spriteW: 0.5, spriteH: 2.5 },

  // Garden fence (center)
  { type: 'fence', gx: 44, gy: 48, footprintW: 12, footprintH: 2, collision: true, spriteW: 2, spriteH: 0.5 },
  { type: 'fence', gx: 44, gy: 54, footprintW: 12, footprintH: 2, collision: true, spriteW: 2, spriteH: 0.5 },
  { type: 'fence', gx: 44, gy: 48, footprintW: 2, footprintH: 8, collision: true, spriteW: 0.5, spriteH: 2 },
  { type: 'fence', gx: 54, gy: 48, footprintW: 2, footprintH: 8, collision: true, spriteW: 0.5, spriteH: 2 },

  // === BUSHES (many, scattered for density) ===
  { type: 'bush', gx: 12, gy: 40, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 14, gy: 42, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 104, gy: 40, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 106, gy: 42, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 36, gy: 68, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 84, gy: 68, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 40, gy: 76, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 80, gy: 76, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 48, gy: 36, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 72, gy: 36, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 52, gy: 96, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 68, gy: 96, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },

  // === FLOWERS (many, colorful patches) ===
  // Garden flowers
  { type: 'flower', gx: 46, gy: 50, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 48, gy: 50, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 50, gy: 50, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 52, gy: 50, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 46, gy: 52, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 48, gy: 52, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 50, gy: 52, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 52, gy: 52, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },

  // Scattered flowers
  { type: 'flower', gx: 14, gy: 44, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 16, gy: 46, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 102, gy: 44, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 104, gy: 46, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 38, gy: 70, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 82, gy: 70, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 42, gy: 80, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 78, gy: 80, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 34, gy: 108, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 86, gy: 108, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },

  // === ROCKS ===
  { type: 'rock', gx: 38, gy: 68, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 82, gy: 68, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 34, gy: 110, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 86, gy: 110, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },

  // === SIGNS ===
  { type: 'sign', gx: 66, gy: 18, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.6, spriteH: 1 },
  { type: 'sign', gx: 52, gy: 98, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.6, spriteH: 1 },

  // === WATER POND (large) ===
  { type: 'water', gx: 10, gy: 84, footprintW: 20, footprintH: 16, collision: true, spriteW: 4, spriteH: 3 },
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
    { x: 40, y: 56, name: 'Professor', dialogue: 'Welcome to PokéSpire! Choose your partner wisely.', color: '#42a5f5' },
    { x: 80, y: 56, name: 'Resident', dialogue: 'This town has been here for generations.', color: '#ab47bc' },
    { x: 30, y: 68, name: 'Gardener', dialogue: 'I love flowers! They make the town so beautiful.', color: '#66bb6a' },
  ],
  backgroundType: 'town',
};
