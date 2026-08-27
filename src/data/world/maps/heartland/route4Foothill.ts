import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place, terraceEllipse, carveRamp } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';

const ID = 'route-4-foothill';
const W = 720;
const H = 660;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 350, 0, 12, H, P);
  fillRect(ground, 0, 320, W, 12, P);
  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 550, 200, 80, 80, 0, 2);
  carveRamp(elevation, 350, 160, 12, 60, 0, 2, 'y');
  const objects: MapObject[] = [
    place('sign' as any, 350, 10),
    ...scatter({ table: [{ id: 'rock_small' as any, weight: 1 }], area: { x: 450, y: 100, w: 150, h: 100 }, pitch: 8, density: 0.2, seed: 10 }),
    ...scatter({ table: [{ id: 'tree_pine' as any, weight: 1 }], area: { x: 50, y: 400, w: 200, h: 150 }, pitch: 10, density: 0.1, seed: 11 }),
  ];
  const npcPositions = [
    { x: 356, y: 200, name: 'Hiker', dialogue: 'The foothills lead up to the craggy highlands.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#3a6848' } } },
    regionId: 'heartland-wilds', layout: { worldX: 0, worldY: 750 },
    ground, elevation, objects, spawn: { x: 356, y: 20, facing: 'down' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: 750 } },
  build,
};
export default mod;
