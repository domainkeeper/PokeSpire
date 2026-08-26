import type { GameMap, TileType, MapObject } from './mapTypes';

const G: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';
const S: TileType = 'sand';

function makeGround(): TileType[][] {
  const W2 = 400;
  const H2 = 300;
  const grid: TileType[][] = Array.from({ length: H2 }, () =>
    Array.from({ length: W2 }, () => G),
  );

  // === MAIN PATH (vertical, center) ===
  for (let y = 0; y < H2; y++) {
    for (let x = 192; x <= 208; x++) grid[y][x] = P;
  }

  // === BRANCHING PATHS ===
  // Horizontal at y=40
  for (let x = 40; x <= 208; x++) { for (let y = 36; y <= 44; y++) grid[y][x] = P; }
  // Horizontal at y=100
  for (let x = 80; x <= 360; x++) { for (let y = 96; y <= 104; y++) grid[y][x] = P; }
  // Horizontal at y=160
  for (let x = 20; x <= 360; x++) { for (let y = 156; y <= 164; y++) grid[y][x] = P; }
  // Horizontal at y=220
  for (let x = 60; x <= 340; x++) { for (let y = 216; y <= 224; y++) grid[y][x] = P; }
  // Vertical branch left
  for (let y = 40; y <= 220; y++) { for (let x = 80; x <= 88; x++) grid[y][x] = P; }
  // Vertical branch right
  for (let y = 40; y <= 220; y++) { for (let x = 316; x <= 324; x++) grid[y][x] = P; }
  // Vertical branch mid-left
  for (let y = 100; y <= 160; y++) { for (let x = 160; x <= 168; x++) grid[y][x] = P; }
  // Vertical branch mid-right
  for (let y = 100; y <= 160; y++) { for (let x = 240; x <= 248; x++) grid[y][x] = P; }

  // === LARGE LAKE (center-left) ===
  for (let y = 112; y <= 148; y++) {
    for (let x = 96; x <= 148; x++) {
      const cx = 122, cy = 130;
      const rx = 28, ry = 20;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[y][x] = W;
    }
  }
  // Lake shore
  for (let y = 110; y <= 150; y++) {
    for (let x = 94; x <= 150; x++) {
      if (grid[y][x] === G) {
        const cx = 122, cy = 130;
        const rx = 30, ry = 22;
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) grid[y][x] = S;
      }
    }
  }

  // === SMALL POND (top-right) ===
  for (let y = 50; y <= 70; y++) {
    for (let x = 280; x <= 310; x++) {
      const cx = 295, cy = 60;
      const rx = 16, ry = 11;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[y][x] = W;
    }
  }

  // === POND (bottom-left) ===
  for (let y = 180; y <= 204; y++) {
    for (let x = 28; x <= 68; x++) {
      const cx = 48, cy = 192;
      const rx = 21, ry = 13;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[y][x] = W;
    }
  }

  // === STREAM (bottom-right area) ===
  for (let y = 230; y <= 240; y++) {
    for (let x = 260; x <= 396; x++) {
      const wave = Math.sin(x * 0.1) * 2;
      if (y >= 232 + wave && y <= 238 + wave) grid[y][x] = W;
    }
  }

  // === POND (far east) ===
  for (let y = 120; y <= 140; y++) {
    for (let x = 340; x <= 380; x++) {
      const cx = 360, cy = 130;
      const rx = 21, ry = 11;
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
function sign(gx: number, gy: number): MapObject {
  return { type: 'sign', gx, gy, footprintW: 2, footprintH: 2, collision: true, spriteW: 0.6, spriteH: 1 };
}

const objects: MapObject[] = [
  // === DENSE FOREST BORDER ===
  ...Array.from({ length: 100 }, (_, i) => tree(i * 4, 0)),
  ...Array.from({ length: 100 }, (_, i) => tree(i * 4, 4)),
  ...Array.from({ length: 100 }, (_, i) => tree(i * 4, 292)),
  ...Array.from({ length: 100 }, (_, i) => tree(i * 4, 288)),
  ...Array.from({ length: 75 }, (_, i) => tree(0, i * 4)),
  ...Array.from({ length: 75 }, (_, i) => tree(4, i * 4)),
  ...Array.from({ length: 75 }, (_, i) => tree(392, i * 4)),
  ...Array.from({ length: 75 }, (_, i) => tree(396, i * 4)),

  // === SCATTERED TREES ===
  // Top section
  tree(12, 16), tree(30, 24), tree(50, 12), tree(70, 20),
  tree(110, 16), tree(130, 24), tree(150, 12), tree(170, 20),
  tree(240, 16), tree(260, 24), tree(340, 12), tree(360, 20),
  tree(12, 60), tree(50, 56), tree(110, 64), tree(150, 56),
  tree(240, 60), tree(340, 56), tree(370, 64),
  // Middle section
  tree(12, 110), tree(50, 116), tree(70, 108),
  tree(250, 108), tree(270, 116), tree(340, 110),
  tree(12, 148), tree(50, 152), tree(170, 112),
  tree(260, 148), tree(340, 152), tree(370, 148),
  tree(180, 140), tree(220, 140),
  // Bottom section
  tree(12, 176), tree(50, 180), tree(70, 172),
  tree(110, 176), tree(150, 180), tree(170, 172),
  tree(250, 176), tree(270, 180), tree(340, 172), tree(370, 176),
  tree(12, 240), tree(50, 244), tree(70, 236),
  tree(110, 240), tree(150, 244), tree(170, 236),
  tree(250, 240), tree(270, 244), tree(340, 236), tree(370, 240),
  tree(12, 268), tree(50, 272), tree(100, 268),
  tree(150, 272), tree(250, 268), tree(300, 272), tree(370, 268),

  // === SMALL TREES scattered ===
  sTree(20, 30), sTree(60, 30), sTree(100, 30), sTree(140, 30),
  sTree(230, 30), sTree(300, 30), sTree(350, 30),
  sTree(20, 80), sTree(60, 80), sTree(140, 80),
  sTree(230, 80), sTree(300, 80), sTree(350, 80),
  sTree(20, 130), sTree(50, 150),
  sTree(250, 130), sTree(300, 150), sTree(370, 130),
  sTree(20, 190), sTree(80, 186), sTree(150, 190),
  sTree(230, 186), sTree(300, 190), sTree(370, 186),
  sTree(20, 250), sTree(80, 254), sTree(150, 250),
  sTree(230, 254), sTree(300, 250), sTree(370, 254),

  // === BUSHES (many) ===
  bush(16, 48), bush(44, 48), bush(76, 48),
  bush(104, 48), bush(136, 48), bush(176, 48),
  bush(220, 48), bush(256, 48), bush(330, 48), bush(368, 48),
  bush(16, 108), bush(44, 108), bush(76, 108),
  bush(220, 108), bush(256, 108), bush(330, 108), bush(368, 108),
  bush(16, 168), bush(44, 168), bush(76, 168),
  bush(220, 168), bush(256, 168), bush(330, 168), bush(368, 168),
  bush(16, 228), bush(44, 228), bush(76, 228),
  bush(220, 228), bush(256, 228), bush(330, 228), bush(368, 228),
  bush(90, 120), bush(90, 140), bush(156, 120), bush(156, 140),
  bush(244, 120), bush(244, 140),
  bush(24, 200), bush(72, 200), bush(100, 200),
  bush(264, 200), bush(336, 200),

  // === ROCKS ===
  rock(34, 52), rock(66, 52), rock(118, 52), rock(158, 52),
  rock(246, 52), rock(348, 52),
  rock(34, 112), rock(66, 112), rock(246, 112), rock(348, 112),
  rock(34, 172), rock(66, 172), rock(246, 172), rock(348, 172),
  rock(34, 232), rock(66, 232), rock(246, 232), rock(348, 232),
  rock(100, 140), rock(144, 140), rock(252, 140), rock(376, 140),

  // === FLOWERS ===
  flower(24, 44), flower(26, 44), flower(28, 44),
  flower(56, 44), flower(58, 44), flower(60, 44),
  flower(112, 44), flower(114, 44), flower(116, 44),
  flower(236, 44), flower(238, 44), flower(240, 44),
  flower(344, 44), flower(346, 44), flower(348, 44),
  flower(24, 104), flower(26, 104), flower(28, 104),
  flower(56, 104), flower(58, 104), flower(60, 104),
  flower(236, 104), flower(238, 104), flower(240, 104),
  flower(344, 104), flower(346, 104), flower(348, 104),
  flower(24, 164), flower(26, 164), flower(28, 164),
  flower(56, 164), flower(58, 164), flower(60, 164),
  flower(236, 164), flower(238, 164), flower(240, 164),
  flower(344, 164), flower(346, 164), flower(348, 164),
  flower(24, 224), flower(26, 224), flower(28, 224),
  flower(56, 224), flower(58, 224), flower(60, 224),
  flower(236, 224), flower(238, 224), flower(240, 224),
  flower(344, 224), flower(346, 224), flower(348, 224),
  // Near lake
  flower(92, 116), flower(92, 144), flower(152, 116), flower(152, 144),
  // Near ponds
  flower(276, 56), flower(276, 64), flower(312, 56), flower(312, 64),
  flower(24, 186), flower(24, 198), flower(70, 186), flower(70, 198),

  // === FENCES ===
  fenceH(60, 32, 16), fenceH(60, 46, 16),
  fenceH(280, 32, 16), fenceH(280, 46, 16),
  fenceH(20, 152, 16), fenceH(20, 166, 16),
  fenceH(300, 152, 16), fenceH(300, 166, 16),

  // === SIGNS ===
  sign(194, 10),   // Town entrance (north)
  sign(194, 284),  // South end
  sign(10, 158),   // West end
  sign(386, 158),  // East end
  sign(194, 98),   // At main crossroad
  sign(194, 218),  // At south crossroad
  sign(84, 98),    // Left branch
  sign(320, 98),   // Right branch
];

export const route1Map: GameMap = {
  name: 'route1',
  width: 400,
  height: 300,
  ground: makeGround(),
  objects,
  spawn: { x: 200, y: 6, facing: 'down' },
  exits: [
    { x: 192, y: 0, w: 16, h: 2, toMap: 'town', spawnX: 150, spawnY: 290, facing: 'down' },
  ],
  npcPositions: [
    { x: 100, y: 40, name: 'Hiker', dialogue: 'This route leads through dense forest. Stay on the path!', color: '#8d6e63' },
    { x: 300, y: 40, name: 'Ranger', dialogue: 'I patrol these woods every day. It\'s beautiful!', color: '#4caf50' },
    { x: 86, y: 100, name: 'Fisherman', dialogue: 'The big lake has some rare Pokémon.', color: '#2196f3' },
    { x: 320, y: 100, name: 'Bug Catcher', dialogue: 'I love finding bugs in the tall grass!', color: '#ff9800' },
    { x: 164, y: 160, name: 'Ace Trainer', dialogue: 'Only the strongest trainers make it through here.', color: '#f44336' },
    { x: 244, y: 160, name: 'Picnicker', dialogue: 'This spot is perfect for a break.', color: '#e91e63' },
    { x: 200, y: 220, name: 'Hiker', dialogue: 'Watch out for wild Pokémon in the grass!', color: '#795548' },
    { x: 84, y: 220, name: 'Lass', dialogue: 'My Pokémon and I love this route.', color: '#9c27b0' },
    { x: 320, y: 220, name: 'Youngster', dialogue: 'I\'m training to be the very best!', color: '#00bcd4' },
  ],
  pokemon: [
    // Common route pokemon
    { species: 'pidgey', gx: 196, gy: 20 },
    { species: 'pidgey', gx: 204, gy: 20 },
    { species: 'pidgey', gx: 190, gy: 50 },
    { species: 'pidgey', gx: 210, gy: 50 },
    { species: 'rattata', gx: 196, gy: 30 },
    { species: 'rattata', gx: 204, gy: 30 },
    { species: 'rattata', gx: 188, gy: 60 },
    { species: 'rattata', gx: 212, gy: 60 },
    { species: 'caterpie', gx: 194, gy: 40 },
    { species: 'caterpie', gx: 206, gy: 40 },
    { species: 'caterpie', gx: 198, gy: 70 },
    // Near spawn cluster
    { species: 'pikachu', gx: 184, gy: 20 },
    { species: 'pikachu', gx: 216, gy: 20 },
    { species: 'eevee', gx: 186, gy: 50 },
    { species: 'eevee', gx: 214, gy: 50 },
    { species: 'bulbasaur', gx: 180, gy: 40 },
    { species: 'bulbasaur', gx: 220, gy: 40 },
    { species: 'charmander', gx: 182, gy: 60 },
    { species: 'charmander', gx: 218, gy: 60 },
    { species: 'squirtle', gx: 178, gy: 80 },
    { species: 'squirtle', gx: 222, gy: 80 },
    // Along main path
    { species: 'pidgey', gx: 196, gy: 90 },
    { species: 'rattata', gx: 204, gy: 90 },
    { species: 'caterpie', gx: 196, gy: 110 },
    { species: 'pikachu', gx: 204, gy: 110 },
    { species: 'pidgey', gx: 196, gy: 130 },
    { species: 'rattata', gx: 204, gy: 130 },
    { species: 'bulbasaur', gx: 196, gy: 150 },
    { species: 'charmander', gx: 204, gy: 150 },
    { species: 'squirtle', gx: 196, gy: 170 },
    { species: 'eevee', gx: 204, gy: 170 },
    { species: 'pikachu', gx: 196, gy: 190 },
    { species: 'pikachu', gx: 204, gy: 190 },
    { species: 'pidgey', gx: 196, gy: 210 },
    { species: 'rattata', gx: 204, gy: 210 },
    // Off-path scattered
    { species: 'bulbasaur', gx: 40, gy: 40 },
    { species: 'bulbasaur', gx: 360, gy: 40 },
    { species: 'charmander', gx: 40, gy: 100 },
    { species: 'charmander', gx: 360, gy: 100 },
    { species: 'squirtle', gx: 40, gy: 160 },
    { species: 'squirtle', gx: 360, gy: 160 },
    { species: 'pikachu', gx: 40, gy: 220 },
    { species: 'pikachu', gx: 360, gy: 220 },
    { species: 'eevee', gx: 80, gy: 120 },
    { species: 'eevee', gx: 320, gy: 120 },
    { species: 'pidgey', gx: 80, gy: 200 },
    { species: 'rattata', gx: 320, gy: 200 },
    { species: 'caterpie', gx: 120, gy: 80 },
    { species: 'caterpie', gx: 280, gy: 80 },
    // Near water
    { species: 'squirtle', gx: 100, gy: 120 },
    { species: 'squirtle', gx: 140, gy: 140 },
    { species: 'bulbasaur', gx: 100, gy: 140 },
    { species: 'bulbasaur', gx: 140, gy: 120 },
  ],
  backgroundType: 'route',
};
