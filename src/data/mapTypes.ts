import type { Direction } from '../types/game';
import type { PokemonSpeciesKey } from './pokemon/pokemonSprites';

export type TileType =
  | 'grass'
  | 'path'
  | 'water'
  | 'dirt'
  | 'sand';

export type ObjectType =
  | 'tree'
  | 'small_tree'
  | 'bush'
  | 'rock'
  | 'building'
  | 'building2'
  | 'fence'
  | 'flower'
  | 'sign'
  | 'water';

export interface MapObject {
  type: ObjectType;
  gx: number;
  gy: number;
  footprintW: number;
  footprintH: number;
  collision: boolean;
  spriteW: number;
  spriteH: number;
  anchorX?: number;
  anchorY?: number;
  animScale?: boolean;
  animSway?: boolean;
}

export interface MapExit {
  x: number;
  y: number;
  w: number;
  h: number;
  toMap: string;
  spawnX: number;
  spawnY: number;
  facing: Direction;
}

export interface PokemonEncounter {
  species: PokemonSpeciesKey;
  gx: number;
  gy: number;
}

export interface GameMap {
  name: string;
  width: number;
  height: number;
  ground: TileType[][];
  objects: MapObject[];
  spawn: { x: number; y: number; facing: Direction };
  exits: MapExit[];
  npcPositions: { x: number; y: number; name: string; dialogue: string; color?: string }[];
  pokemon?: PokemonEncounter[];
  backgroundType: 'town' | 'route';
}
