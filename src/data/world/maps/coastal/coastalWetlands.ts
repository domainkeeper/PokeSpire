import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect, pond } from '../../authoring/terrain';

const ID = 'coastal-wetlands';
const W = 640;
const H = 560;
const PPT = 6;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 300, 0, 12, H, P);
  pond(ground, 150, 200, 60, 40, 'water');
  pond(ground, 450, 350, 50, 35, 'water');
  pond(ground, 200, 400, 40, 30, 'water');

  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 300, 10),
    ...scatter({ table: [{ id: 'reed' as any, weight: 1 }], area: { x: 100, y: 160, w: 100, h: 80 }, pitch: 4, density: 0.4, seed: 10 }),
    ...scatter({ table: [{ id: 'reed' as any, weight: 1 }], area: { x: 400, y: 310, w: 100, h: 80 }, pitch: 4, density: 0.4, seed: 11 }),
    ...scatter({ table: [{ id: 'bush' as any, weight: 1 }], area: { x: 50, y: 400, w: 80, h: 60 }, pitch: 6, density: 0.15, seed: 12 }),
  ];
  const npcPositions = [
    { x: 306, y: 100, name: 'Ranger', dialogue: 'The wetlands are home to many water Pokemon.' },
  ];
  const pokemon = [{ species: 'bulbasaur' as const, gx: 160, gy: 210 }];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#3a6848' } } },
    regionId: 'coral-coast', layout: { worldX: 0, worldY: 460 },
    ground, elevation, objects, spawn: { x: 306, y: 20, facing: 'down' }, exits: [], npcPositions, pokemon,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: 460 } },
  build,
};
export default mod;
