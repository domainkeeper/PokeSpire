import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { marketStalls } from '../../prefabs/buildings';
import { lampRow } from '../../prefabs/urban';

const ID = 'dusk-night-market';
const W = 360;
const H = 340;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 160, 0, 20, H, P);
  fillRect(ground, 0, 160, W, 20, P);
  fillRect(ground, 60, 60, 100, 80, P);
  fillRect(ground, 200, 200, 100, 80, P);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    ...marketStalls({ x: 70, y: 70, count: 4, gap: 20, seed: 10 }),
    ...marketStalls({ x: 210, y: 210, count: 4, gap: 20, seed: 11 }),
    ...lampRow({ from: [58, 58], to: [162, 58], spacing: 10 }),
    ...lampRow({ from: [58, 142], to: [162, 142], spacing: 10 }),
    ...lampRow({ from: [198, 198], to: [302, 198], spacing: 10 }),
    place('sign' as any, 10, 166),
  ];
  const npcPositions = [
    { x: 100, y: 100, name: 'Merchant', dialogue: 'The night market comes alive after dark!' },
    { x: 250, y: 250, name: 'Merchant', dialogue: 'Rare items can be found in these stalls.' },
    { x: 170, y: 100, name: 'Resident', dialogue: 'The market is the heart of the city nightlife.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city',
    regionId: 'dusk-metro', layout: { worldX: 2850, worldY: 0 },
    ground, elevation, objects, spawn: { x: 20, y: 170, facing: 'right' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city', layout: { worldX: 2850, worldY: 0 } },
  build,
};
export default mod;
