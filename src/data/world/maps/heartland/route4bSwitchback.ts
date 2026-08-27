import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place, terraceEllipse, carveRamp } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';

const ID = 'route-4b-switchback';
const W = 560;
const H = 620;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 270, 0, 12, H, P);
  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 150, 200, 80, 80, 0, 2);
  terraceEllipse(elevation, 400, 400, 80, 80, 0, 3);
  carveRamp(elevation, 270, 160, 12, 60, 0, 2, 'y');
  carveRamp(elevation, 230, 360, 60, 12, 2, 3, 'x');
  const objects: MapObject[] = [
    place('sign' as any, 270, 10),
    ...scatter({ table: [{ id: 'rock_small' as any, weight: 1 }], area: { x: 80, y: 100, w: 100, h: 100 }, pitch: 8, density: 0.15, seed: 10 }),
    ...scatter({ table: [{ id: 'tree_pine' as any, weight: 1 }], area: { x: 350, y: 300, w: 100, h: 100 }, pitch: 10, density: 0.1, seed: 11 }),
  ];
  const npcPositions = [
    { x: 276, y: 300, name: 'Hiker', dialogue: 'The switchbacks test even experienced hikers.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#3a5840' } } },
    regionId: 'heartland-wilds', layout: { worldX: 390, worldY: 750 },
    ground, elevation, objects, spawn: { x: 276, y: 20, facing: 'down' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 390, worldY: 750 } },
  build,
};
export default mod;
