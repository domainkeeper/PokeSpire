import type { Direction } from '../types/game';

export type TileType =
  | 'grass'
  | 'path'
  | 'water'
  | 'tree'
  | 'rock'
  | 'building'
  | 'building2'
  | 'fence'
  | 'flower'
  | 'sign'
  | 'empty';

export interface MapExit {
  x: number;
  y: number;
  toMap: string;
  spawnX: number;
  spawnY: number;
  facing: Direction;
}

export interface GameMap {
  name: string;
  width: number;
  height: number;
  tiles: TileType[][];
  blocked: boolean[][];
  spawn: { x: number; y: number; facing: Direction };
  exits: MapExit[];
  npcPositions: { x: number; y: number; name: string; dialogue: string }[];
  decorations: { x: number; y: number; type: TileType }[];
}
