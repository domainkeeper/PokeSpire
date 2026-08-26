import type { GameMap, TileType } from './mapTypes';

const T: TileType = 'grass';
const P: TileType = 'path';
const W: TileType = 'water';
const R: TileType = 'tree';
const K: TileType = 'rock';
const L: TileType = 'flower';

const tiles: TileType[][] = [
  [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
  [R, T, T, T, T, T, T, T, T, T, P, P, T, T, T, T, T, T, T, R],
  [R, T, T, L, T, T, T, T, T, T, P, P, T, T, K, T, L, T, T, R],
  [R, T, L, T, T, T, T, T, T, P, P, P, T, T, T, T, T, T, T, R],
  [R, T, T, T, T, T, T, T, P, P, T, P, P, T, T, T, T, L, T, R],
  [R, T, T, T, T, T, T, P, P, T, T, T, P, P, T, T, T, T, T, R],
  [R, T, T, T, T, T, P, P, T, T, T, T, T, P, P, T, T, T, T, R],
  [R, T, T, L, T, P, P, T, T, T, T, T, T, T, P, P, T, T, T, R],
  [R, T, T, T, P, P, T, T, T, W, W, T, T, T, T, P, T, L, T, R],
  [R, T, T, T, P, T, T, T, W, W, W, W, T, T, T, P, T, T, T, R],
  [R, T, T, T, P, P, T, T, T, W, W, T, T, T, T, P, T, T, T, R],
  [R, T, T, T, T, P, P, T, T, T, T, T, T, T, P, P, T, T, T, R],
  [R, T, L, T, T, T, P, P, T, T, T, T, T, P, P, T, T, T, T, R],
  [R, T, T, T, T, T, T, P, P, P, T, P, P, P, T, T, L, T, T, R],
  [R, T, T, T, T, T, T, T, T, P, P, P, T, T, T, T, T, T, T, R],
  [R, T, T, K, T, T, T, T, T, T, P, P, T, T, T, T, T, T, T, R],
  [R, T, T, T, T, T, T, T, T, T, P, P, T, T, T, T, L, T, T, R],
  [R, T, T, T, T, T, T, T, T, P, P, T, T, T, T, T, T, T, T, R],
  [R, T, T, L, T, T, T, T, P, P, T, T, T, T, T, T, T, T, T, R],
  [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
];

const blocked: boolean[][] = tiles.map((row: TileType[]) =>
  row.map((t: TileType) => t === 'tree' || t === 'rock' || t === 'water' || t === 'fence'),
);

const decorations = [];
for (let y = 0; y < tiles.length; y++) {
  for (let x = 0; x < tiles[y].length; x++) {
    if (tiles[y][x] === 'flower') {
      decorations.push({ x, y, type: 'flower' as const });
    }
  }
}

export const route1Map: GameMap = {
  name: 'route1',
  width: 20,
  height: 20,
  tiles,
  blocked,
  spawn: { x: 10, y: 1, facing: 'down' },
  exits: [
    { x: 10, y: 0, toMap: 'town', spawnX: 7, spawnY: 12, facing: 'down' },
  ],
  npcPositions: [
    { x: 8, y: 5, name: 'Hiker', dialogue: 'This route leads to the tall grass. Be careful!' },
  ],
  decorations,
};
