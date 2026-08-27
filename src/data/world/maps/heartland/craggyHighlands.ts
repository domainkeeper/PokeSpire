import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place, terraceEllipse, carveRamp, flattenRect } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { CAVE } from '../../encounters/tables';

const ID = 'craggy-highlands';
const W = 780;
const H = 720;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 380, 0, 12, H, P);
  fillRect(ground, 0, 350, W, 12, P);
  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 200, 200, 100, 100, 0, 3);
  terraceEllipse(elevation, 600, 500, 120, 100, 0, 4);
  carveRamp(elevation, 380, 160, 12, 80, 0, 3, 'y');
  carveRamp(elevation, 340, 350, 80, 12, 0, 2, 'x');
  flattenRect(elevation, { x: 370, y: 340, w: 30, h: 30 }, 0);
  const objects: MapObject[] = [
    place('sign' as any, 380, 10),
    ...scatter({ table: [{ id: 'boulder' as any, weight: 1 }], area: { x: 100, y: 100, w: 200, h: 200 }, pitch: 10, density: 0.12, seed: 10 }),
    ...scatter({ table: [{ id: 'rock_large' as any, weight: 1 }], area: { x: 500, y: 400, w: 200, h: 200 }, pitch: 12, density: 0.1, seed: 11 }),
    ...scatter({ table: [{ id: 'tree_pine' as any, weight: 1 }], area: { x: 50, y: 500, w: 150, h: 150 }, pitch: 10, density: 0.08, seed: 12 }),
  ];
  const npcPositions = [
    { x: 386, y: 200, name: 'Hiker', dialogue: 'The highlands offer stunning views, but watch your step.' },
    { x: 386, y: 500, name: 'Ranger', dialogue: 'Cave entrances are scattered throughout these hills.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#3a5840' } } },
    regionId: 'heartland-wilds', layout: { worldX: 0, worldY: 1420 },
    ground, elevation, objects, spawn: { x: 386, y: 20, facing: 'down' }, exits: [],     npcPositions,
    encounterZones: [
      { id: 'highlands-cave', biome: 'cave', rects: [{ x: 90, y: 90, w: 220, h: 220 }], table: CAVE, rarity: 'uncommon' },
    ],
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: 1420 } },
  build,
};
export default mod;
