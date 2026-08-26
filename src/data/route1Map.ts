import type { GameMap, TileType, MapObject } from './mapTypes';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';

function makeGround(): TileType[][] {
  const grid: TileType[][] = Array.from({ length: 120 }, () =>
    Array.from({ length: 160 }, () => G),
  );

  // Main vertical path
  for (let y = 0; y < 120; y++) {
    for (let x = 76; x <= 84; x++) grid[y][x] = P;
  }

  // Branching paths
  for (let x = 40; x <= 84; x++) {
    for (let y = 36; y <= 44; y++) grid[y][x] = P;
  }
  for (let x = 76; x <= 120; x++) {
    for (let y = 76; y <= 84; y++) grid[y][x] = P;
  }

  // Pond
  for (let y = 56; y <= 72; y++) {
    for (let x = 18; x <= 42; x++) grid[y][x] = W;
  }

  // Exit path
  for (let y = 0; y <= 6; y++) {
    for (let x = 76; x <= 84; x++) grid[y][x] = P;
  }

  return grid;
}

const objects: MapObject[] = [
  // === BORDER TREES (dense forest) ===
  ...Array.from({ length: 28 }, (_, i) => ({
    type: 'tree' as const, gx: i * 6, gy: 0, footprintW: 3, footprintH: 3,
    collision: true, spriteW: 2, spriteH: 3, animSway: true,
  })),
  ...Array.from({ length: 28 }, (_, i) => ({
    type: 'tree' as const, gx: i * 6, gy: 116, footprintW: 3, footprintH: 3,
    collision: true, spriteW: 2, spriteH: 3, animSway: true,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    type: 'tree' as const, gx: 0, gy: i * 6, footprintW: 3, footprintH: 3,
    collision: true, spriteW: 2, spriteH: 3, animSway: true,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    type: 'tree' as const, gx: 156, gy: i * 6, footprintW: 3, footprintH: 3,
    collision: true, spriteW: 2, spriteH: 3, animSway: true,
  })),

  // === SCATTERED TREES (throughout route) ===
  { type: 'tree', gx: 8, gy: 16, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 140, gy: 20, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 14, gy: 90, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 130, gy: 96, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 56, gy: 20, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 110, gy: 60, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 30, gy: 80, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 120, gy: 40, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 10, gy: 50, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 140, gy: 80, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 50, gy: 100, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },
  { type: 'tree', gx: 100, gy: 100, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true },

  // Small trees
  { type: 'small_tree', gx: 28, gy: 30, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 120, gy: 40, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 50, gy: 100, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 100, gy: 104, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 18, gy: 70, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 130, gy: 70, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 40, gy: 110, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },
  { type: 'small_tree', gx: 110, gy: 110, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true },

  // === BUSHES (many for density) ===
  { type: 'bush', gx: 22, gy: 24, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 124, gy: 30, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 36, gy: 84, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 116, gy: 90, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 70, gy: 60, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 96, gy: 56, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 12, gy: 36, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 140, gy: 36, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 20, gy: 100, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 130, gy: 100, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 60, gy: 50, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },
  { type: 'bush', gx: 90, gy: 50, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true },

  // === ROCKS ===
  { type: 'rock', gx: 50, gy: 50, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 104, gy: 70, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 30, gy: 104, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 120, gy: 50, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 40, gy: 30, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },
  { type: 'rock', gx: 110, gy: 30, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 },

  // === FLOWERS (colorful patches) ===
  { type: 'flower', gx: 14, gy: 40, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 16, gy: 42, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 110, gy: 44, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 60, gy: 96, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 120, gy: 80, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 44, gy: 70, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 90, gy: 70, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 20, gy: 60, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 130, gy: 60, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 50, gy: 40, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 100, gy: 40, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 30, gy: 90, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },
  { type: 'flower', gx: 110, gy: 90, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true },

  // === WATER POND ===
  { type: 'water', gx: 18, gy: 56, footprintW: 24, footprintH: 16, collision: true, spriteW: 4, spriteH: 3 },

  // === SIGNS ===
  { type: 'sign', gx: 88, gy: 10, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.6, spriteH: 1 },

  // === FENCE SECTIONS ===
  { type: 'fence', gx: 60, gy: 30, footprintW: 12, footprintH: 2, collision: true, spriteW: 2, spriteH: 0.5 },
  { type: 'fence', gx: 90, gy: 70, footprintW: 12, footprintH: 2, collision: true, spriteW: 2, spriteH: 0.5 },
  { type: 'fence', gx: 20, gy: 90, footprintW: 10, footprintH: 2, collision: true, spriteW: 1.5, spriteH: 0.5 },
  { type: 'fence', gx: 120, gy: 90, footprintW: 10, footprintH: 2, collision: true, spriteW: 1.5, spriteH: 0.5 },
];

export const route1Map: GameMap = {
  name: 'route1',
  width: 160,
  height: 120,
  ground: makeGround(),
  objects,
  spawn: { x: 80, y: 4, facing: 'down' },
  exits: [
    { x: 76, y: 0, w: 8, h: 2, toMap: 'town', spawnX: 60, spawnY: 114, facing: 'down' },
  ],
  npcPositions: [
    { x: 60, y: 40, name: 'Hiker', dialogue: 'This route leads to tall grass. Be careful!', color: '#8d6e63' },
    { x: 100, y: 60, name: 'Ranger', dialogue: 'I love hiking these trails!', color: '#4caf50' },
  ],
  pokemon: [
    { species: 'pikachu', gx: 30, gy: 20 },
    { species: 'eevee', gx: 100, gy: 24 },
    { species: 'pidgey', gx: 14, gy: 70 },
    { species: 'pidgey', gx: 146, gy: 30 },
    { species: 'rattata', gx: 56, gy: 56 },
    { species: 'rattata', gx: 110, gy: 88 },
    { species: 'caterpie', gx: 22, gy: 100 },
    { species: 'caterpie', gx: 120, gy: 104 },
  ],
  backgroundType: 'route',
};
