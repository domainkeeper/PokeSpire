import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect, pond } from '../../authoring/terrain';

const ID = 'mistmere-lake';
const W = 720;
const H = 620;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 350, 0, 12, H, P);
  pond(ground, 360, 310, 140, 120, 'water');
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 350, 10),
    ...scatter({ table: [{ id: 'tree_oak' as any, weight: 1 }], area: { x: 50, y: 50, w: 200, h: 200 }, pitch: 10, density: 0.1, seed: 10 }),
    ...scatter({ table: [{ id: 'reed' as any, weight: 1 }], area: { x: 200, y: 250, w: 40, h: 120 }, pitch: 4, density: 0.35, seed: 11 }),
    ...scatter({ table: [{ id: 'reed' as any, weight: 1 }], area: { x: 480, y: 250, w: 40, h: 120 }, pitch: 4, density: 0.35, seed: 12 }),
  ];
  const npcPositions = [
    { x: 356, y: 100, name: 'Fisherman', dialogue: 'Mistmere Lake is known for its clear waters.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#3a7848' } } },
    regionId: 'heartland-wilds', layout: { worldX: 730, worldY: 100 },
    ground, elevation, objects, spawn: { x: 356, y: 20, facing: 'down' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 730, worldY: 100 } },
  build,
};
export default mod;
