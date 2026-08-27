import type { GameMap } from './mapTypes';
import { loadMap, allMapIds } from './world/mapRegistry';
import './world/registerAll'; // side-effect: registers every MapModule

export function getMap(name: string): GameMap | undefined {
  return loadMap(name);
}
export function getMapNames(): string[] {
  return allMapIds();
}
