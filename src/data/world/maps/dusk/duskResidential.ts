import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place } from '../../../maps/authoring';
import { streetGrid } from '../../authoring/city';
import { cityBlock } from '../../prefabs/buildings';
import { lampRow } from '../../prefabs/urban';

const ID = 'dusk-residential';
const W = 504;
const H = 448;
const PPT = 8;
const G: TileType = 'grass';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  streetGrid(ground, 40, 40, 3, 3, 100, 80, 8);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    ...cityBlock({ x: 40, y: 40, w: 100, h: 80, seed: 10 }),
    ...cityBlock({ x: 150, y: 40, w: 100, h: 80, seed: 11 }),
    ...cityBlock({ x: 260, y: 40, w: 100, h: 80, seed: 12 }),
    ...cityBlock({ x: 40, y: 130, w: 100, h: 80, seed: 13 }),
    ...cityBlock({ x: 150, y: 130, w: 100, h: 80, seed: 14 }),
    ...cityBlock({ x: 260, y: 130, w: 100, h: 80, seed: 15 }),
    ...lampRow({ from: [38, 38], to: [370, 38], spacing: 14 }),
    ...lampRow({ from: [38, 220], to: [370, 220], spacing: 14 }),
    place('sign' as any, 10, 212),
  ];
  const npcPositions = [
    { x: 100, y: 80, name: 'Resident', dialogue: 'The residential district is quiet and peaceful.' },
    { x: 260, y: 80, name: 'Resident', dialogue: 'I love the grid layout. Easy to navigate.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city',
    regionId: 'dusk-metro', layout: { worldX: 1900, worldY: 0 },
    ground, elevation, objects, spawn: { x: 20, y: 216, facing: 'right' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city', layout: { worldX: 1900, worldY: 0 } },
  build,
};
export default mod;
