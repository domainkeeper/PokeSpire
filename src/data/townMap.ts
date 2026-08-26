import type { GameMap, TileType, MapObject } from './mapTypes';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';
const D: TileType = 'dirt';
const S: TileType = 'sand';

function makeGround(): TileType[][] {
  const W2 = 300;
  const H2 = 300;
  const grid: TileType[][] = Array.from({ length: H2 }, () =>
    Array.from({ length: W2 }, () => G),
  );

  // === MAIN ROADS ===
  // Main horizontal road (middle)
  for (let x = 4; x <= W2 - 4; x++) {
    for (let y = 144; y <= 156; y++) grid[y][x] = P;
  }
  // Main vertical road (center)
  for (let y = 4; y <= H2 - 4; y++) {
    for (let x = 144; x <= 156; x++) grid[y][x] = P;
  }

  // === TOWN CENTER ===
  // Central plaza paths
  for (let x = 120; x <= 180; x++) {
    for (let y = 120; y <= 180; y++) grid[y][x] = P;
  }
  // Plaza inner circle-ish dirt
  for (let x = 130; x <= 170; x++) {
    for (let y = 130; y <= 170; y++) grid[y][x] = D;
  }

  // === RESIDENTIAL DISTRICT (top-left) ===
  // Streets grid
  for (let x = 20; x <= 120; x++) { for (let y = 20; y <= 28; y++) grid[y][x] = P; }
  for (let x = 20; x <= 120; x++) { for (let y = 56; y <= 64; y++) grid[y][x] = P; }
  for (let x = 20; x <= 120; x++) { for (let y = 92; y <= 100; y++) grid[y][x] = P; }
  for (let y = 20; y <= 100; y++) { for (let x = 20; x <= 28; x++) grid[y][x] = P; }
  for (let y = 20; y <= 100; y++) { for (let x = 68; x <= 76; x++) grid[y][x] = P; }
  for (let y = 20; y <= 100; y++) { for (let x = 116; x <= 124; x++) grid[y][x] = P; }

  // === COMMERCIAL DISTRICT (top-right) ===
  for (let x = 180; x <= 280; x++) { for (let y = 20; y <= 28; y++) grid[y][x] = P; }
  for (let x = 180; x <= 280; x++) { for (let y = 56; y <= 64; y++) grid[y][x] = P; }
  for (let x = 180; x <= 280; x++) { for (let y = 92; y <= 100; y++) grid[y][x] = P; }
  for (let y = 20; y <= 100; y++) { for (let x = 180; x <= 188; x++) grid[y][x] = P; }
  for (let y = 20; y <= 100; y++) { for (let x = 228; x <= 236; x++) grid[y][x] = P; }
  for (let y = 20; y <= 100; y++) { for (let x = 276; x <= 284; x++) grid[y][x] = P; }

  // === PARK DISTRICT (bottom-left) ===
  for (let x = 20; x <= 120; x++) { for (let y = 200; y <= 208; y++) grid[y][x] = P; }
  for (let x = 20; x <= 120; x++) { for (let y = 248; y <= 256; y++) grid[y][x] = P; }
  for (let y = 200; y <= 256; y++) { for (let x = 20; x <= 28; x++) grid[y][x] = P; }
  for (let y = 200; y <= 256; y++) { for (let x = 116; x <= 124; x++) grid[y][x] = P; }

  // === DOCK AREA (bottom-right) ===
  for (let x = 200; x <= 280; x++) { for (let y = 230; y <= 238; y++) grid[y][x] = P; }
  for (let y = 200; y <= 260; y++) { for (let x = 200; x <= 208; x++) grid[y][x] = P; }
  for (let y = 200; y <= 260; y++) { for (let x = 276; x <= 284; x++) grid[y][x] = P; }

  // === DIRT PATCHES ===
  // Player house area
  for (let x = 30; x <= 56; x++) { for (let y = 30; y <= 52; y++) grid[y][x] = D; }
  // Professor lab area
  for (let x = 200; x <= 232; x++) { for (let y = 30; y <= 52; y++) grid[y][x] = D; }
  // Gym area
  for (let x = 196; x <= 228; x++) { for (let y = 126; y <= 154; y++) grid[y][x] = D; }
  // Market area
  for (let x = 30; x <= 60; x++) { for (let y = 126; y <= 154; y++) grid[y][x] = D; }

  // === LARGE LAKE (top-center) ===
  for (let y = 66; y <= 96; y++) {
    for (let x = 130; x <= 170; x++) {
      const cx = 150, cy = 81;
      const rx = 22, ry = 16;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[y][x] = W;
    }
  }
  // Lake shore sand
  for (let y = 64; y <= 98; y++) {
    for (let x = 128; x <= 172; x++) {
      if (grid[y][x] === G) {
        const cx = 150, cy = 81;
        const rx = 24, ry = 18;
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) grid[y][x] = S;
      }
    }
  }

  // === POND (residential) ===
  for (let y = 72; y <= 88; y++) {
    for (let x = 40; x <= 60; x++) {
      const cx = 50, cy = 80;
      const rx = 11, ry = 9;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[y][x] = W;
    }
  }

  // === RIVER (bottom, horizontal) ===
  for (let x = 4; x <= W2 - 4; x++) {
    for (let y = 268; y <= 280; y++) grid[y][x] = W;
  }
  for (let x = 4; x <= W2 - 4; x++) {
    if (grid[266]?.[x] === G) grid[266][x] = S;
    if (grid[282]?.[x] === G) grid[282][x] = S;
  }

  // === SMALL POND (park) ===
  for (let y = 216; y <= 232; y++) {
    for (let x = 56; x <= 80; x++) {
      const cx = 68, cy = 224;
      const rx = 13, ry = 9;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[y][x] = W;
    }
  }

  // === POND (commercial) ===
  for (let y = 70; y <= 86; y++) {
    for (let x = 240; x <= 264; x++) {
      const cx = 252, cy = 78;
      const rx = 13, ry = 9;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[y][x] = W;
    }
  }

  return grid;
}

function tree(gx: number, gy: number): MapObject {
  return { type: 'tree', gx, gy, footprintW: 3, footprintH: 3, collision: true, spriteW: 2, spriteH: 3, animSway: true };
}
function sTree(gx: number, gy: number): MapObject {
  return { type: 'small_tree', gx, gy, footprintW: 2, footprintH: 2, collision: true, spriteW: 1.2, spriteH: 2, animSway: true };
}
function bush(gx: number, gy: number): MapObject {
  return { type: 'bush', gx, gy, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.8, spriteH: 0.6, animSway: true };
}
function rock(gx: number, gy: number): MapObject {
  return { type: 'rock', gx, gy, footprintW: 2, footprintH: 2, collision: true, spriteW: 1, spriteH: 0.7 };
}
function flower(gx: number, gy: number): MapObject {
  return { type: 'flower', gx, gy, footprintW: 1, footprintH: 1, collision: false, spriteW: 0.4, spriteH: 0.5, animScale: true };
}
function fenceH(gx: number, gy: number, w: number): MapObject {
  return { type: 'fence', gx, gy, footprintW: w, footprintH: 2, collision: true, spriteW: w * 0.2, spriteH: 0.5 };
}
function fenceV(gx: number, gy: number, h: number): MapObject {
  return { type: 'fence', gx, gy, footprintW: 2, footprintH: h, collision: true, spriteW: 0.5, spriteH: h * 0.2 };
}
function building(gx: number, gy: number, w: number, h: number, sw: number, sh: number): MapObject {
  return { type: 'building', gx, gy, footprintW: w, footprintH: h, collision: true, spriteW: sw, spriteH: sh };
}
function building2(gx: number, gy: number, w: number, h: number, sw: number, sh: number): MapObject {
  return { type: 'building2', gx, gy, footprintW: w, footprintH: h, collision: true, spriteW: sw, spriteH: sh };
}
function sign(gx: number, gy: number): MapObject {
  return { type: 'sign', gx, gy, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.6, spriteH: 1 };
}

const objects: MapObject[] = [
  // === DENSE FOREST BORDER ===
  // Top
  ...Array.from({ length: 75 }, (_, i) => tree(i * 4, 0)),
  ...Array.from({ length: 75 }, (_, i) => tree(i * 4, 4)),
  // Bottom (above river)
  ...Array.from({ length: 75 }, (_, i) => tree(i * 4, 292)),
  ...Array.from({ length: 75 }, (_, i) => tree(i * 4, 288)),
  // Left
  ...Array.from({ length: 75 }, (_, i) => tree(0, i * 4)),
  ...Array.from({ length: 75 }, (_, i) => tree(4, i * 4)),
  // Right
  ...Array.from({ length: 75 }, (_, i) => tree(292, i * 4)),
  ...Array.from({ length: 75 }, (_, i) => tree(288, i * 4)),

  // === RESIDENTIAL BUILDINGS (top-left) ===
  // Player's house
  building(32, 32, 14, 12, 4.5, 5),
  // Neighbor houses
  building(72, 32, 12, 10, 4, 4.5),
  building(32, 68, 12, 10, 4, 4.5),
  building(72, 68, 12, 10, 4, 4.5),
  building(32, 104, 12, 10, 4, 4.5),
  building(72, 104, 12, 10, 4, 4.5),

  // === COMMERCIAL BUILDINGS (top-right) ===
  // Professor's Lab
  building2(202, 32, 16, 12, 5, 5.5),
  // Poké Center
  building2(244, 32, 14, 12, 4.5, 5),
  // Shop
  building(202, 68, 12, 10, 4, 4.5),
  // Museum
  building2(244, 68, 14, 12, 4.5, 5),
  // More shops
  building(202, 104, 10, 8, 3.5, 4),
  building(244, 104, 10, 8, 3.5, 4),

  // === GYM (center-right) ===
  building2(200, 128, 20, 16, 6, 6.5),
  // Gym garden
  fenceH(196, 124, 28),
  fenceH(196, 148, 28),
  fenceV(196, 124, 26),
  fenceV(218, 124, 26),
  flower(200, 130), flower(204, 130), flower(208, 130), flower(212, 130),
  flower(200, 144), flower(204, 144), flower(208, 144), flower(212, 144),

  // === MARKET (center-left) ===
  building(32, 128, 14, 12, 4.5, 5),
  building(56, 128, 10, 10, 3.5, 4),
  building(32, 148, 10, 8, 3.5, 4),

  // === PARK (bottom-left) ===
  // Park entrance arch
  sign(24, 198),
  // Flower gardens in park
  ...Array.from({ length: 8 }, (_, i) => flower(40 + i * 2, 210)),
  ...Array.from({ length: 8 }, (_, i) => flower(40 + i * 2, 214)),
  ...Array.from({ length: 8 }, (_, i) => flower(40 + i * 2, 240)),
  ...Array.from({ length: 8 }, (_, i) => flower(40 + i * 2, 244)),
  ...Array.from({ length: 6 }, (_, i) => flower(30, 220 + i * 2)),
  ...Array.from({ length: 6 }, (_, i) => flower(106, 220 + i * 2)),

  // === DOCK (bottom-right) ===
  sign(200, 198),

  // === FENCES around building areas ===
  // Player house yard
  fenceH(28, 28, 20), fenceH(28, 46, 20), fenceV(28, 28, 20), fenceV(48, 28, 20),
  // Lab yard
  fenceH(198, 28, 24), fenceH(198, 46, 24), fenceV(198, 28, 20), fenceV(222, 28, 20),
  // Shop yard
  fenceH(28, 124, 18), fenceH(28, 142, 18), fenceV(28, 124, 20), fenceV(46, 124, 20),

  // === SCATTERED TREES (residential) ===
  tree(8, 16), tree(16, 8), tree(8, 52), tree(16, 56),
  tree(8, 88), tree(16, 92), tree(8, 120), tree(16, 124),
  tree(100, 16), tree(108, 8), tree(100, 52), tree(108, 56),
  tree(100, 88), tree(108, 92), tree(100, 120), tree(108, 124),

  // === SCATTERED TREES (commercial) ===
  tree(180, 16), tree(188, 8), tree(180, 52), tree(188, 56),
  tree(270, 16), tree(278, 8), tree(270, 52), tree(278, 56),
  tree(270, 88), tree(278, 92), tree(270, 120), tree(278, 124),

  // === SCATTERED TREES (park) ===
  tree(12, 210), tree(12, 230), tree(12, 250),
  tree(112, 210), tree(112, 230), tree(112, 250),
  tree(30, 260), tree(50, 262), tree(70, 260), tree(90, 262),

  // === SMALL TREES scattered ===
  sTree(14, 38), sTree(58, 14), sTree(96, 38), sTree(14, 78),
  sTree(58, 78), sTree(96, 78), sTree(14, 114), sTree(58, 114), sTree(96, 114),
  sTree(186, 38), sTree(230, 14), sTree(268, 38), sTree(186, 78),
  sTree(268, 78), sTree(186, 114), sTree(268, 114),
  sTree(40, 200), sTree(60, 200), sTree(80, 200), sTree(100, 200),
  sTree(40, 254), sTree(60, 254), sTree(80, 254), sTree(100, 254),

  // === BUSHES (many, throughout) ===
  // Residential
  bush(26, 42), bush(28, 44), bush(60, 30), bush(62, 32),
  bush(26, 80), bush(28, 82), bush(60, 80), bush(62, 82),
  bush(110, 30), bush(112, 32), bush(110, 70), bush(112, 72),
  bush(26, 110), bush(60, 110), bush(110, 110),
  // Commercial
  bush(196, 42), bush(226, 30), bush(264, 42),
  bush(196, 82), bush(226, 70), bush(264, 82),
  bush(196, 118), bush(264, 118),
  // Park
  bush(34, 206), bush(50, 206), bush(86, 206), bush(106, 206),
  bush(34, 250), bush(50, 250), bush(86, 250), bush(106, 250),
  bush(24, 226), bush(24, 238), bush(114, 226), bush(114, 238),
  // Near lake
  bush(126, 66), bush(174, 66), bush(126, 96), bush(174, 96),
  bush(128, 72), bush(172, 72), bush(128, 90), bush(172, 90),

  // === ROCKS (scattered) ===
  rock(44, 48), rock(84, 48), rock(44, 84), rock(84, 84),
  rock(210, 48), rock(250, 48), rock(210, 84), rock(250, 84),
  rock(50, 236), rock(86, 236), rock(50, 260), rock(86, 260),
  rock(130, 160), rock(170, 160), rock(130, 200), rock(170, 200),
  rock(220, 200), rock(260, 200),

  // === FLOWERS (many patches) ===
  // Garden near player house
  flower(34, 48), flower(36, 48), flower(38, 48), flower(40, 48),
  flower(34, 50), flower(36, 50), flower(38, 50), flower(40, 50),
  // Garden near lab
  flower(206, 48), flower(208, 48), flower(210, 48), flower(212, 48),
  flower(206, 50), flower(208, 50), flower(210, 50), flower(212, 50),
  // Along main road
  flower(10, 146), flower(10, 154), flower(286, 146), flower(286, 154),
  flower(146, 10), flower(154, 10), flower(146, 286), flower(154, 286),
  // Near pond
  flower(38, 68), flower(62, 68), flower(38, 92), flower(62, 92),
  // Scattered
  flower(20, 160), flower(40, 170), flower(60, 160), flower(80, 170),
  flower(200, 160), flower(220, 170), flower(240, 160), flower(260, 170),
  flower(120, 200), flower(140, 210), flower(160, 200), flower(180, 210),

  // === SIGNS ===
  sign(158, 18),   // North entrance
  sign(158, 278),  // South (river) entrance
  sign(18, 148),   // West entrance
  sign(278, 148),  // East entrance
  sign(148, 118),  // Center plaza
];

export const townMap: GameMap = {
  name: 'town',
  width: 300,
  height: 300,
  ground: makeGround(),
  objects,
  spawn: { x: 150, y: 150, facing: 'down' },
  exits: [
    { x: 144, y: 296, w: 12, h: 2, toMap: 'route1', spawnX: 200, spawnY: 6, facing: 'down' },
  ],
  npcPositions: [
    { x: 50, y: 56, name: 'Professor', dialogue: 'Welcome to PokéSpire! Choose your partner wisely.', color: '#42a5f5' },
    { x: 220, y: 56, name: 'Resident', dialogue: 'This town has been here for generations.', color: '#ab47bc' },
    { x: 40, y: 148, name: 'Gardener', dialogue: 'I love flowers! They make the town so beautiful.', color: '#66bb6a' },
    { x: 210, y: 140, name: 'Gym Leader', dialogue: 'Think you can beat my Pokémon? Let\'s battle!', color: '#f44336' },
    { x: 150, y: 130, name: 'Elder', dialogue: 'This plaza was built 500 years ago.', color: '#795548' },
    { x: 70, y: 220, name: 'Fisherman', dialogue: 'The fish in this pond are wonderful.', color: '#2196f3' },
    { x: 260, y: 148, name: 'Merchant', dialogue: 'Best deals in town, guaranteed!', color: '#ff9800' },
    { x: 100, y: 240, name: 'Ranger', dialogue: 'The park is a safe haven for Pokémon.', color: '#4caf50' },
    { x: 230, y: 80, name: 'Scientist', dialogue: 'I\'m studying the lake\'s ecosystem.', color: '#00bcd4' },
    { x: 80, y: 36, name: 'Resident', dialogue: 'Nice neighborhood, quiet and peaceful.', color: '#9c27b0' },
    { x: 260, y: 36, name: 'Nurse', dialogue: 'Need healing? Poké Center is right here!', color: '#e91e63' },
    { x: 150, y: 270, name: 'Sailor', dialogue: 'The river connects to the southern routes.', color: '#3f51b5' },
  ],
  pokemon: [
    // Lake pokemon
    { species: 'squirtle', gx: 140, gy: 76 },
    { species: 'squirtle', gx: 160, gy: 86 },
    { species: 'bulbasaur', gx: 146, gy: 72 },
    { species: 'bulbasaur', gx: 154, gy: 90 },
    { species: 'pikachu', gx: 148, gy: 82 },
    { species: 'charmander', gx: 156, gy: 78 },
    // Pond pokemon
    { species: 'pidgey', gx: 48, gy: 78 },
    { species: 'rattata', gx: 54, gy: 82 },
    // River pokemon
    { species: 'squirtle', gx: 100, gy: 274 },
    { species: 'bulbasaur', gx: 180, gy: 274 },
    { species: 'eevee', gx: 250, gy: 276 },
    // Town wandering pokemon (near spawn)
    { species: 'pikachu', gx: 148, gy: 158 },
    { species: 'pikachu', gx: 152, gy: 162 },
    { species: 'eevee', gx: 146, gy: 164 },
    { species: 'eevee', gx: 154, gy: 156 },
    { species: 'pidgey', gx: 140, gy: 150 },
    { species: 'pidgey', gx: 160, gy: 150 },
    { species: 'rattata', gx: 140, gy: 170 },
    { species: 'rattata', gx: 160, gy: 170 },
    { species: 'charmander', gx: 130, gy: 160 },
    { species: 'charmander', gx: 170, gy: 160 },
    { species: 'bulbasaur', gx: 130, gy: 150 },
    { species: 'bulbasaur', gx: 170, gy: 150 },
    { species: 'squirtle', gx: 130, gy: 170 },
    { species: 'squirtle', gx: 170, gy: 170 },
    { species: 'caterpie', gx: 142, gy: 155 },
    { species: 'caterpie', gx: 158, gy: 165 },
    // More spread out
    { species: 'pikachu', gx: 60, gy: 60 },
    { species: 'eevee', gx: 220, gy: 60 },
    { species: 'charmander', gx: 40, gy: 130 },
    { species: 'bulbasaur', gx: 210, gy: 130 },
    { species: 'pidgey', gx: 80, gy: 220 },
    { species: 'rattata', gx: 100, gy: 240 },
    { species: 'caterpie', gx: 200, gy: 240 },
    { species: 'squirtle', gx: 260, gy: 220 },
  ],
  backgroundType: 'town',
};
