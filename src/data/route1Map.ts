import type { GameMap, MapObject, TileType } from './mapTypes';
import {
  place,
  line,
  scatter,
  treeWall,
  makeElevation,
  terraceEllipse,
  flattenRect,
} from './maps/authoring';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';
const S: TileType = 'sand';
const D: TileType = 'dirt';

const WIDTH = 400;
const HEIGHT = 300;

/** Main north-south path corridor. Also the town exit corridor. */
const MAIN_PATH_X0 = 192;
const MAIN_PATH_X1 = 208;

const NORTH_GATE = { from: MAIN_PATH_X0 - 4, to: MAIN_PATH_X1 + 4, axis: 'x' as const };

/* ---------------------------------------------------------------- ground --- */

function makeGround(): TileType[][] {
  const grid: TileType[][] = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => G),
  );

  const rect = (x0: number, y0: number, x1: number, y1: number, t: TileType) => {
    for (let y = Math.max(0, y0); y <= Math.min(HEIGHT - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(WIDTH - 1, x1); x++) grid[y][x] = t;
    }
  };

  const ellipse = (cx: number, cy: number, rx: number, ry: number, t: TileType, only?: TileType) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      if (y < 0 || y >= HEIGHT) continue;
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (x < 0 || x >= WIDTH) continue;
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        if (only && grid[y][x] !== only) continue;
        grid[y][x] = t;
      }
    }
  };

  // === MAIN PATH ===
  rect(MAIN_PATH_X0, 0, MAIN_PATH_X1, HEIGHT - 1, P);

  // === BRANCHES ===
  rect(40, 36, 208, 44, P);
  rect(80, 96, 360, 104, P);
  rect(20, 156, 360, 164, P);
  rect(60, 216, 340, 224, P);
  rect(80, 40, 88, 220, P);
  rect(316, 40, 324, 220, P);
  rect(160, 100, 168, 160, P);
  rect(240, 100, 248, 160, P);

  // Clearings.
  rect(150, 60, 180, 84, D);
  rect(268, 176, 300, 204, D);

  // === WATER ===
  ellipse(122, 130, 28, 20, W);
  ellipse(122, 130, 31, 23, S, G);
  ellipse(295, 60, 16, 11, W);
  ellipse(295, 60, 19, 14, S, G);
  ellipse(48, 192, 21, 13, W);
  ellipse(48, 192, 24, 16, S, G);
  ellipse(360, 130, 21, 11, W);
  ellipse(360, 130, 24, 14, S, G);

  // Meandering stream in the south-east.
  for (let x = 260; x <= 396; x++) {
    const wave = Math.sin(x * 0.1) * 2;
    for (let y = 230; y <= 242; y++) {
      if (y >= 232 + wave && y <= 238 + wave) grid[y][x] = W;
      else if (y >= 230 + wave && y <= 240 + wave && grid[y][x] === G) grid[y][x] = S;
    }
  }

  // === CAUSEWAY ===
  // Re-assert the main path so the route stays traversable end to end now that
  // water blocks movement.
  rect(MAIN_PATH_X0, 0, MAIN_PATH_X1, HEIGHT - 1, P);

  return grid;
}

const ground = makeGround();

const isType = (gx: number, gy: number, t: TileType): boolean => ground[gy]?.[gx] === t;
const isGrass = (gx: number, gy: number): boolean => isType(gx, gy, G);

/* ------------------------------------------------------------- elevation --- */

function makeElevationLayer(): number[][] {
  const elev = makeElevation(WIDTH, HEIGHT, 0);

  // Highland ridge along the west.
  terraceEllipse(elev, 42, 90, 40, 60, 0, 3);
  // Eastern plateau.
  terraceEllipse(elev, 356, 190, 44, 50, 0, 3);
  // Central knoll between the crossroads.
  terraceEllipse(elev, 204, 130, 30, 24, 0, 2);
  // Southern rise.
  terraceEllipse(elev, 140, 258, 46, 30, 0, 2);
  // Shallow dip around the big lake, so the shore reads as a basin.
  terraceEllipse(elev, 122, 130, 36, 26, 0, 0);

  // Paths stay level; where they cross a terrace this cuts a readable bank.
  flattenRect(elev, { x: MAIN_PATH_X0, y: 0, w: MAIN_PATH_X1 - MAIN_PATH_X0 + 1, h: HEIGHT }, 0);
  for (const y of [36, 96, 156, 216]) flattenRect(elev, { x: 0, y, w: WIDTH, h: 9 }, 0);
  for (const x of [80, 160, 240, 316]) flattenRect(elev, { x, y: 0, w: 9, h: HEIGHT }, 0);
  // Keep water basins and shores level.
  flattenRect(elev, { x: 86, y: 104, w: 76, h: 56 }, 0);
  flattenRect(elev, { x: 252, y: 224, w: 148, h: 30 }, 0);
  flattenRect(elev, { x: 334, y: 112, w: 56, h: 40 }, 0);
  flattenRect(elev, { x: 20, y: 172, w: 60, h: 40 }, 0);
  flattenRect(elev, { x: 274, y: 42, w: 46, h: 40 }, 0);

  return elev;
}

/* ----------------------------------------------------------------- props --- */

const FOREST = [
  { id: 'tree_oak' as const, weight: 46 },
  { id: 'tree_pine' as const, weight: 26 },
  { id: 'tree_small' as const, weight: 20 },
  { id: 'bush' as const, weight: 24 },
  { id: 'bush_berry' as const, weight: 10 },
  { id: 'rock_small' as const, weight: 16 },
  { id: 'rock_large' as const, weight: 8 },
  { id: 'boulder' as const, weight: 4 },
  { id: 'stump' as const, weight: 6 },
  { id: 'log' as const, weight: 6 },
  { id: 'grass_tuft' as const, weight: 40 },
  { id: 'flower' as const, weight: 22 },
  { id: 'mushroom' as const, weight: 10 },
];

const MEADOW = [
  { id: 'grass_tuft' as const, weight: 56 },
  { id: 'flower' as const, weight: 34 },
  { id: 'bush' as const, weight: 14 },
  { id: 'tree_small' as const, weight: 8 },
  { id: 'rock_small' as const, weight: 8 },
];

const SHORE = [
  { id: 'reed' as const, weight: 50 },
  { id: 'rock_small' as const, weight: 20 },
  { id: 'grass_tuft' as const, weight: 22 },
  { id: 'tree_palm' as const, weight: 12 },
  { id: 'log' as const, weight: 6 },
];

const objects: MapObject[] = [
  /* ---- forest border, gated at the northern exit ---- */
  ...treeWall(50, (i) => [i, 0], 8, 6, NORTH_GATE),
  ...treeWall(50, (i) => [i, 7], 8, 6, NORTH_GATE),
  ...treeWall(50, (i) => [i, 288], 8, 6),
  ...treeWall(50, (i) => [i, 281], 8, 6),
  ...treeWall(38, (i) => [0, i], 8, 6),
  ...treeWall(38, (i) => [7, i], 8, 6),
  ...treeWall(38, (i) => [388, i], 8, 6),
  ...treeWall(38, (i) => [381, i], 8, 6),

  /* ---- wayfinding ---- */
  place('sign', 186, 12),
  place('sign', 186, 282),
  place('sign', 10, 158),
  place('sign', 384, 158),
  place('sign', 186, 90),
  place('sign', 186, 210),
  place('sign', 74, 90),
  place('sign', 326, 90),

  /* ---- rest stops ---- */
  place('bench', 156, 66),
  place('bench', 172, 66),
  place('well', 164, 74),
  place('crate', 272, 182),
  place('barrel', 276, 186),
  place('bench', 288, 192),
  ...line('lamp_post', [194, 20], [194, 280], 60),
  ...line('fence_wood', [60, 32], [76, 32], 5),
  ...line('fence_wood', [280, 32], [296, 32], 5),
  ...line('fence_wood', [20, 152], [36, 152], 5),
  ...line('fence_wood', [300, 152], [316, 152], 5),

  /* ---- forests ---- */
  ...scatter({
    table: FOREST,
    area: { x: 10, y: 10, w: 170, h: 280 },
    pitch: 7,
    density: 0.34,
    seed: 201,
    allow: isGrass,
  }),
  ...scatter({
    table: FOREST,
    area: { x: 216, y: 10, w: 174, h: 280 },
    pitch: 7,
    density: 0.34,
    seed: 202,
    allow: isGrass,
  }),
  /* ---- meadows beside the main path ---- */
  ...scatter({
    table: MEADOW,
    area: { x: 168, y: 8, w: 64, h: 284 },
    pitch: 5,
    density: 0.3,
    seed: 203,
    allow: (x, y) => isGrass(x, y) || isType(x, y, D),
  }),
  /* ---- shores ---- */
  ...scatter({
    table: SHORE,
    area: { x: 84, y: 100, w: 80, h: 62 },
    pitch: 4,
    density: 0.36,
    seed: 204,
    allow: (x, y) => isType(x, y, S),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 250, y: 222, w: 150, h: 32 },
    pitch: 4,
    density: 0.34,
    seed: 205,
    allow: (x, y) => isType(x, y, S),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 330, y: 110, w: 60, h: 44 },
    pitch: 4,
    density: 0.32,
    seed: 206,
    allow: (x, y) => isType(x, y, S),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 18, y: 170, w: 64, h: 44 },
    pitch: 4,
    density: 0.32,
    seed: 207,
    allow: (x, y) => isType(x, y, S),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 270, y: 40, w: 54, h: 44 },
    pitch: 4,
    density: 0.32,
    seed: 208,
    allow: (x, y) => isType(x, y, S),
  }),
];

export const route1Map: GameMap = {
  name: 'route1',
  themeId: 'coastal-day',
  width: WIDTH,
  height: HEIGHT,
  ground,
  elevation: makeElevationLayer(),
  objects,
  spawn: { x: 200, y: 14, facing: 'down' },
  exits: [
    // Northern gate through the forest border, on the main path.
    { x: MAIN_PATH_X0, y: 0, w: 16, h: 2, toMap: 'town', spawnX: 150, spawnY: 288, facing: 'down' },
  ],
  npcPositions: [
    { x: 100, y: 40, name: 'Hiker', dialogue: 'This route leads through dense forest. Stay on the path!' },
    { x: 300, y: 40, name: 'Ranger', dialogue: "I patrol these woods every day. It's beautiful!" },
    { x: 86, y: 100, name: 'Fisherman', dialogue: 'The big lake has some rare Pokemon.' },
    { x: 320, y: 100, name: 'Bug Catcher', dialogue: 'I love finding bugs in the tall grass!' },
    { x: 164, y: 160, name: 'Ace Trainer', dialogue: 'Only the strongest trainers make it through here.' },
    { x: 244, y: 160, name: 'Picnicker', dialogue: 'This spot is perfect for a break.' },
    { x: 200, y: 220, name: 'Hiker', dialogue: 'Watch out for wild Pokemon in the grass!' },
    { x: 84, y: 220, name: 'Lass', dialogue: 'My Pokemon and I love this route.' },
    { x: 320, y: 220, name: 'Youngster', dialogue: "I'm training to be the very best!" },
  ],
  pokemon: [
    { species: 'pidgey', gx: 186, gy: 24 },
    { species: 'pidgey', gx: 214, gy: 24 },
    { species: 'pidgey', gx: 182, gy: 52 },
    { species: 'rattata', gx: 216, gy: 52 },
    { species: 'rattata', gx: 186, gy: 30 },
    { species: 'rattata', gx: 212, gy: 66 },
    { species: 'caterpie', gx: 188, gy: 46 },
    { species: 'caterpie', gx: 212, gy: 46 },
    { species: 'caterpie', gx: 190, gy: 78 },
    { species: 'pikachu', gx: 176, gy: 22 },
    { species: 'pikachu', gx: 222, gy: 22 },
    { species: 'eevee', gx: 178, gy: 56 },
    { species: 'eevee', gx: 220, gy: 56 },
    { species: 'bulbasaur', gx: 172, gy: 44 },
    { species: 'bulbasaur', gx: 226, gy: 44 },
    { species: 'charmander', gx: 174, gy: 68 },
    { species: 'charmander', gx: 224, gy: 68 },
    { species: 'squirtle', gx: 170, gy: 86 },
    { species: 'squirtle', gx: 228, gy: 86 },
    { species: 'pidgey', gx: 186, gy: 112 },
    { species: 'rattata', gx: 214, gy: 112 },
    { species: 'caterpie', gx: 186, gy: 140 },
    { species: 'pikachu', gx: 214, gy: 140 },
    { species: 'bulbasaur', gx: 186, gy: 172 },
    { species: 'charmander', gx: 214, gy: 172 },
    { species: 'squirtle', gx: 186, gy: 200 },
    { species: 'eevee', gx: 214, gy: 200 },
    { species: 'pikachu', gx: 186, gy: 236 },
    { species: 'pidgey', gx: 214, gy: 236 },
    { species: 'rattata', gx: 186, gy: 264 },
    { species: 'squirtle', gx: 104, gy: 116 },
    { species: 'squirtle', gx: 140, gy: 148 },
    { species: 'bulbasaur', gx: 96, gy: 150 },
    { species: 'eevee', gx: 60, gy: 180 },
    { species: 'caterpie', gx: 288, gy: 216 },
    { species: 'pikachu', gx: 344, gy: 116 },
    { species: 'charmander', gx: 300, gy: 46 },
  ],
};
