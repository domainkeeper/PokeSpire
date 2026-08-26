import { townMap } from './townMap';
import { route1Map } from './route1Map';
import type { GameMap } from './mapTypes';

const maps: Record<string, GameMap> = {
  town: townMap,
  route1: route1Map,
};

export function getMap(name: string): GameMap | undefined {
  return maps[name];
}

export function getMapNames(): string[] {
  return Object.keys(maps);
}
