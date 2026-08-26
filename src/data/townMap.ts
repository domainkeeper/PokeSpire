import type { GameMap, MapObject, TileType } from './mapTypes';
import {
  place,
  line,
  border,
  scatter,
  treeWall,
  makeElevation,
  terraceEllipse,
  flattenRect,
  elevateRect,
} from './maps/authoring';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';
const D: TileType = 'dirt';
const S: TileType = 'sand';

const WIDTH = 300;
const HEIGHT = 300;

/** Main north-south road corridor. Also the Route 1 exit corridor. */
const MAIN_ROAD_X0 = 144;
const MAIN_ROAD_X1 = 156;
/** Main east-west road corridor. */
const MAIN_ROAD_Y0 = 144;
const MAIN_ROAD_Y1 = 156;

/**
 * Gap left in the southern border-tree wall so the Route 1 exit is reachable.
 * Border trees are 6x6 on an 8-tile pitch, which otherwise walls the corridor off.
 */
const SOUTH_GATE = { from: MAIN_ROAD_X0 - 4, to: MAIN_ROAD_X1 + 4, axis: 'x' as const };

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

  // === MAIN ROADS ===
  rect(4, MAIN_ROAD_Y0, WIDTH - 4, MAIN_ROAD_Y1, P);
  rect(MAIN_ROAD_X0, 4, MAIN_ROAD_X1, HEIGHT - 4, P);

  // === TOWN CENTRE PLAZA ===
  rect(118, 118, 182, 182, P);
  rect(128, 128, 172, 172, D);

  // === DISTRICT STREETS ===
  for (const y of [20, 56, 92]) {
    rect(20, y, 120, y + 8, P);
    rect(180, y, 280, y + 8, P);
  }
  for (const x of [20, 68, 116]) rect(x, 20, x + 8, 100, P);
  for (const x of [180, 228, 276]) rect(x, 20, x + 8, 100, P);
  for (const y of [200, 248]) rect(20, y, 120, y + 8, P);
  for (const x of [20, 116]) rect(x, 200, x + 8, 256, P);
  rect(200, 230, 280, 238, P);
  for (const x of [200, 276]) rect(x, 200, x + 8, 260, P);

  // === YARDS ===
  rect(30, 30, 56, 52, D);
  rect(200, 30, 232, 52, D);
  rect(196, 126, 228, 154, D);
  rect(30, 126, 60, 154, D);

  // === WATER ===
  ellipse(150, 81, 22, 16, W);
  ellipse(150, 81, 25, 19, S, G);
  ellipse(50, 80, 11, 9, W);
  ellipse(50, 80, 14, 12, S, G);
  ellipse(252, 78, 13, 9, W);
  ellipse(252, 78, 16, 12, S, G);
  ellipse(68, 224, 13, 9, W);
  ellipse(68, 224, 16, 12, S, G);

  // River across the south.
  rect(4, 268, WIDTH - 4, 280, W);
  rect(4, 264, WIDTH - 4, 267, S);
  rect(4, 281, WIDTH - 4, 284, S);

  // === BRIDGES / CAUSEWAYS ===
  // Water is painted after the roads, so it severs the main north-south road in
  // two places. Now that water blocks movement, those cuts would strand the
  // whole southern half of town - and therefore the Route 1 exit. Re-assert the
  // road across both crossings.
  rect(MAIN_ROAD_X0, 262, MAIN_ROAD_X1, 286, P);
  rect(MAIN_ROAD_X0, 60, MAIN_ROAD_X1, 102, P);

  return grid;
}

const ground = makeGround();

const isType = (gx: number, gy: number, t: TileType): boolean =>
  ground[gy]?.[gx] === t;
const isGrass = (gx: number, gy: number): boolean => isType(gx, gy, G);

/* ------------------------------------------------------------- elevation --- */

/**
 * Elevation is authored as concentric 1-step terraces. Adjacent levels differ by
 * exactly one step, which is within MAX_CLIMB_STEPS, so hills read as real
 * multi-level terrain while staying fully walkable. Road corridors are flattened
 * last so authored relief can never sever a route.
 */
function makeElevationLayer(): number[][] {
  const elev = makeElevation(WIDTH, HEIGHT, 0);

  // Terraced highland behind the commercial district.
  terraceEllipse(elev, 248, 58, 46, 40, 0, 3);
  // Park rise in the south-west.
  terraceEllipse(elev, 70, 226, 44, 34, 0, 2);
  // Western bluff.
  terraceEllipse(elev, 46, 150, 28, 24, 0, 2);
  // Gentle mound south-east of the plaza.
  terraceEllipse(elev, 200, 196, 24, 20, 0, 1);
  // Raised lakeside lawn on the north shore.
  elevateRect(elev, { x: 120, y: 52, w: 60, h: 8 }, 1);

  // Roads and plaza stay level; this also cuts readable banks where a road
  // passes through a terrace.
  flattenRect(elev, { x: 0, y: MAIN_ROAD_Y0, w: WIDTH, h: MAIN_ROAD_Y1 - MAIN_ROAD_Y0 + 1 }, 0);
  flattenRect(elev, { x: MAIN_ROAD_X0, y: 0, w: MAIN_ROAD_X1 - MAIN_ROAD_X0 + 1, h: HEIGHT }, 0);
  flattenRect(elev, { x: 118, y: 118, w: 65, h: 65 }, 0);
  // Keep the water basins and their shores level so shorelines read cleanly.
  flattenRect(elev, { x: 0, y: 260, w: WIDTH, h: 40 }, 0);
  flattenRect(elev, { x: 124, y: 58, w: 54, h: 46 }, 0);

  return elev;
}

/* ----------------------------------------------------------------- props --- */

const WOODLAND = [
  { id: 'tree_oak' as const, weight: 42 },
  { id: 'tree_small' as const, weight: 22 },
  { id: 'tree_pine' as const, weight: 14 },
  { id: 'bush' as const, weight: 26 },
  { id: 'bush_berry' as const, weight: 8 },
  { id: 'rock_small' as const, weight: 14 },
  { id: 'rock_large' as const, weight: 6 },
  { id: 'stump' as const, weight: 5 },
  { id: 'log' as const, weight: 4 },
  { id: 'grass_tuft' as const, weight: 34 },
  { id: 'flower' as const, weight: 26 },
  { id: 'mushroom' as const, weight: 7 },
];

const GARDEN = [
  { id: 'flower' as const, weight: 60 },
  { id: 'bush' as const, weight: 20 },
  { id: 'grass_tuft' as const, weight: 22 },
  { id: 'tree_small' as const, weight: 10 },
  { id: 'bench' as const, weight: 5 },
  { id: 'mushroom' as const, weight: 6 },
];

const SHORE = [
  { id: 'reed' as const, weight: 46 },
  { id: 'rock_small' as const, weight: 20 },
  { id: 'grass_tuft' as const, weight: 24 },
  { id: 'tree_palm' as const, weight: 10 },
  { id: 'log' as const, weight: 5 },
];

const objects: MapObject[] = [
  /* ---- forest border, gated at the southern exit ---- */
  ...treeWall(38, (i) => [i, 0], 8, 6),
  ...treeWall(38, (i) => [i, 7], 8, 6),
  ...treeWall(38, (i) => [i, 288], 8, 6, SOUTH_GATE),
  ...treeWall(38, (i) => [i, 281], 8, 6, SOUTH_GATE),
  ...treeWall(38, (i) => [0, i], 8, 6),
  ...treeWall(38, (i) => [7, i], 8, 6),
  ...treeWall(38, (i) => [288, i], 8, 6),
  ...treeWall(38, (i) => [281, i], 8, 6),

  /* ---- residential district ---- */
  place('house_large', 32, 32),
  place('house_small', 72, 32, { variant: 1 }),
  place('house_small', 32, 68),
  place('house_small', 72, 68, { variant: 1 }),
  place('house_small', 32, 104, { variant: 1 }),
  place('house_small', 72, 104),
  place('well', 58, 58),
  ...border('fence_wood', { x: 28, y: 28, w: 22, h: 20 }, 5),

  /* ---- commercial district, on the terraced rise ---- */
  place('shop', 200, 30),
  place('shop', 240, 30, { variant: 1 }),
  place('house_small', 200, 68, { variant: 1 }),
  place('house_large', 240, 66),
  place('house_small', 200, 104),
  place('house_small', 240, 104, { variant: 1 }),
  ...line('lamp_post', [184, 26], [278, 26], 22),
  ...line('lamp_post', [184, 62], [278, 62], 22),
  place('crate', 236, 44),
  place('crate', 239, 46),
  place('barrel', 233, 45),

  /* ---- civic centre ---- */
  place('house_large', 198, 128, { variant: 1 }),
  ...border('fence_stone', { x: 194, y: 124, w: 30, h: 28 }, 5),
  place('house_large', 32, 128),
  place('shop', 56, 128, { variant: 1 }),
  place('well', 148, 136),
  ...line('bench', [130, 176], [170, 176], 14),
  ...line('lamp_post', [124, 124], [176, 124], 26),
  ...line('lamp_post', [124, 178], [176, 178], 26),

  /* ---- park ---- */
  place('sign', 24, 196),
  ...line('bench', [40, 210], [104, 210], 22),
  ...line('bench', [40, 244], [104, 244], 22),
  ...line('lamp_post', [30, 204], [110, 204], 26),

  /* ---- dock ---- */
  place('sign', 200, 196),
  place('crate', 210, 240),
  place('crate', 213, 242),
  place('barrel', 218, 241),
  place('barrel', 222, 243),

  /* ---- wayfinding ---- */
  place('sign', 158, 18),
  place('sign', 158, 276),
  place('sign', 18, 148),
  place('sign', 278, 148),
  place('sign', 148, 116),

  /* ---- scattered nature ---- */
  ...scatter({
    table: WOODLAND,
    area: { x: 10, y: 10, w: 280, h: 110 },
    pitch: 7,
    density: 0.3,
    seed: 101,
    allow: isGrass,
  }),
  ...scatter({
    table: WOODLAND,
    area: { x: 10, y: 186, w: 280, h: 74 },
    pitch: 7,
    density: 0.34,
    seed: 102,
    allow: isGrass,
  }),
  ...scatter({
    table: GARDEN,
    area: { x: 22, y: 200, w: 100, h: 58 },
    pitch: 5,
    density: 0.34,
    seed: 103,
    allow: isGrass,
  }),
  ...scatter({
    table: GARDEN,
    area: { x: 120, y: 118, w: 64, h: 64 },
    pitch: 6,
    density: 0.2,
    seed: 104,
    allow: (x, y) => isGrass(x, y) || isType(x, y, D),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 122, y: 58, w: 58, h: 48 },
    pitch: 4,
    density: 0.36,
    seed: 105,
    allow: (x, y) => isType(x, y, S),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 4, y: 258, w: 292, h: 30 },
    pitch: 5,
    density: 0.32,
    seed: 106,
    allow: (x, y) => isType(x, y, S),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 32, y: 62, w: 40, h: 40 },
    pitch: 4,
    density: 0.3,
    seed: 107,
    allow: (x, y) => isType(x, y, S),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 232, y: 60, w: 44, h: 40 },
    pitch: 4,
    density: 0.3,
    seed: 108,
    allow: (x, y) => isType(x, y, S),
  }),
  ...scatter({
    table: SHORE,
    area: { x: 48, y: 206, w: 44, h: 40 },
    pitch: 4,
    density: 0.3,
    seed: 109,
    allow: (x, y) => isType(x, y, S),
  }),
];

export const townMap: GameMap = {
  name: 'town',
  themeId: 'coastal-day',
  width: WIDTH,
  height: HEIGHT,
  ground,
  elevation: makeElevationLayer(),
  objects,
  spawn: { x: 150, y: 150, facing: 'down' },
  exits: [
    // Southern gate through the forest border, on the main road.
    { x: MAIN_ROAD_X0, y: 296, w: 12, h: 2, toMap: 'route1', spawnX: 200, spawnY: 14, facing: 'down' },
  ],
  npcPositions: [
    { x: 50, y: 56, name: 'Professor', dialogue: 'Welcome to PokeSpire! Choose your partner wisely.' },
    { x: 220, y: 56, name: 'Resident', dialogue: 'This town has been here for generations.' },
    { x: 40, y: 148, name: 'Gardener', dialogue: 'I love flowers! They make the town so beautiful.' },
    { x: 210, y: 140, name: 'Gym Leader', dialogue: "Think you can beat my Pokemon? Let's battle!" },
    { x: 150, y: 130, name: 'Elder', dialogue: 'This plaza was built 500 years ago.' },
    { x: 70, y: 214, name: 'Fisherman', dialogue: 'The fish in this pond are wonderful.' },
    { x: 260, y: 148, name: 'Merchant', dialogue: 'Best deals in town, guaranteed!' },
    { x: 100, y: 240, name: 'Ranger', dialogue: 'The park is a safe haven for Pokemon.' },
    { x: 230, y: 100, name: 'Scientist', dialogue: "I'm studying the lake's ecosystem." },
    { x: 80, y: 36, name: 'Resident', dialogue: 'Nice neighborhood, quiet and peaceful.' },
    { x: 260, y: 36, name: 'Nurse', dialogue: 'Need healing? Poke Center is right here!' },
    { x: 150, y: 262, name: 'Sailor', dialogue: 'The river connects to the southern routes.' },
  ],
  pokemon: [
    { species: 'squirtle', gx: 132, gy: 76 },
    { species: 'squirtle', gx: 168, gy: 86 },
    { species: 'bulbasaur', gx: 138, gy: 106 },
    { species: 'pikachu', gx: 176, gy: 96 },
    { species: 'charmander', gx: 124, gy: 96 },
    { species: 'pidgey', gx: 40, gy: 70 },
    { species: 'rattata', gx: 62, gy: 92 },
    { species: 'squirtle', gx: 100, gy: 262 },
    { species: 'bulbasaur', gx: 180, gy: 262 },
    { species: 'eevee', gx: 250, gy: 262 },
    { species: 'pikachu', gx: 138, gy: 190 },
    { species: 'eevee', gx: 164, gy: 188 },
    { species: 'pidgey', gx: 128, gy: 168 },
    { species: 'pidgey', gx: 174, gy: 166 },
    { species: 'rattata', gx: 132, gy: 196 },
    { species: 'rattata', gx: 170, gy: 198 },
    { species: 'caterpie', gx: 122, gy: 186 },
    { species: 'caterpie', gx: 180, gy: 180 },
    { species: 'pikachu', gx: 60, gy: 62 },
    { species: 'eevee', gx: 218, gy: 62 },
    { species: 'charmander', gx: 40, gy: 132 },
    { species: 'bulbasaur', gx: 212, gy: 132 },
    { species: 'pidgey', gx: 84, gy: 218 },
    { species: 'rattata', gx: 104, gy: 238 },
    { species: 'caterpie', gx: 200, gy: 240 },
    { species: 'squirtle', gx: 262, gy: 220 },
  ],
};
