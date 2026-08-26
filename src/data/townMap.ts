import type { GameMap, TileType } from './mapTypes';

const T: TileType = 'grass';
const P: TileType = 'path';
const R: TileType = 'tree';
const K: TileType = 'rock';
const B: TileType = 'building';
const B2: TileType = 'building2';
const F: TileType = 'fence';
const L: TileType = 'flower';
const S: TileType = 'sign';

const tiles: TileType[][] = [
  [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
  [R, T, T, T, R, T, T, T, T, T, R, T, T, T, R],
  [R, T, L, T, B, B, B, T, T, T, B2, B2, B2, T, R],
  [R, T, T, T, B, B, B, T, T, T, B2, B2, B2, T, R],
  [R, T, T, T, T, T, T, T, P, P, T, T, T, T, R],
  [R, T, L, T, T, T, T, P, P, P, P, T, L, T, R],
  [R, T, T, F, F, T, P, P, P, P, P, F, T, T, R],
  [R, T, T, T, T, P, P, P, P, P, P, T, T, T, R],
  [R, T, T, T, T, P, P, P, P, P, P, T, T, T, R],
  [R, T, L, T, T, P, P, P, P, P, P, T, L, T, R],
  [R, T, T, T, T, T, T, P, P, P, T, T, T, T, R],
  [R, T, T, T, T, T, T, P, P, T, T, T, T, T, R],
  [R, T, T, S, T, T, T, P, P, T, T, T, K, T, R],
  [R, T, T, T, T, T, T, P, P, P, T, T, T, T, R],
  [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
];

const blocked: boolean[][] = tiles.map((row: TileType[]) =>
  row.map((t: TileType) => t === 'tree' || t === 'rock' || t === 'building' || t === 'building2' || t === 'fence'),
);

const decorations = [];
for (let y = 0; y < tiles.length; y++) {
  for (let x = 0; x < tiles[y].length; x++) {
    if (tiles[y][x] === 'flower') {
      decorations.push({ x, y, type: 'flower' as const });
    }
  }
}

export const townMap: GameMap = {
  name: 'town',
  width: 15,
  height: 15,
  tiles,
  blocked,
  spawn: { x: 7, y: 11, facing: 'down' },
  exits: [
    { x: 7, y: 14, toMap: 'route1', spawnX: 10, spawnY: 1, facing: 'down' },
  ],
  npcPositions: [
    { x: 5, y: 7, name: 'Professor', dialogue: 'Welcome to PokéSpire! Choose your partner wisely.' },
    { x: 11, y: 5, name: 'Resident', dialogue: 'This town has been here for generations.' },
  ],
  decorations,
};
