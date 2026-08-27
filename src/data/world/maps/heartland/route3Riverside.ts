import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect, river, bridge } from '../../authoring/terrain';

const ID = 'route-3-riverside';
const W = 720;
const H = 640;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 350, 0, 12, H, P);
  fillRect(ground, 0, 310, W, 12, P);
  river(ground, 0, 450, 720, 450, 16);
  bridge(ground, 345, 442, 22, 20);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 350, 10),
    ...scatter({ table: [{ id: 'tree_oak' as any, weight: 1 }], area: { x: 50, y: 50, w: 250, h: 200 }, pitch: 10, density: 0.12, seed: 10 }),
    ...scatter({ table: [{ id: 'rock_small' as any, weight: 1 }], area: { x: 400, y: 500, w: 200, h: 80 }, pitch: 8, density: 0.15, seed: 11 }),
  ];
  const npcPositions = [
    { x: 356, y: 200, name: 'Hiker', dialogue: 'The river is crossed by a stone bridge to the south.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#3a7848' } } },
    regionId: 'heartland-wilds', layout: { worldX: 0, worldY: 100 },
    ground, elevation, objects, spawn: { x: 356, y: 20, facing: 'down' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: 100 } },
  build,
};
export default mod;
