import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { meadowScatter } from '../../authoring/nature';

const ID = 'route-2-meadowway';
const W = 760;
const H = 600;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 370, 0, 12, H, P);
  fillRect(ground, 0, 290, W, 12, P);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 370, 10),
    ...meadowScatter({ x: 50, y: 50, w: 280, h: 220 }, 10, 0.2),
    ...meadowScatter({ x: 420, y: 50, w: 280, h: 220 }, 11, 0.2),
    ...meadowScatter({ x: 50, y: 320, w: 280, h: 220 }, 12, 0.2),
    ...meadowScatter({ x: 420, y: 320, w: 280, h: 220 }, 13, 0.2),
    ...scatter({ table: [{ id: 'fence_wood' as any, weight: 1 }], area: { x: 100, y: 150, w: 200, h: 4 }, pitch: 6, density: 0.8, seed: 14 }),
  ];
  const npcPositions = [
    { x: 376, y: 100, name: 'Ranger', dialogue: 'The meadows are beautiful this time of year.' },
    { x: 376, y: 500, name: 'Hiker', dialogue: 'Heading toward the forest? Keep east on the path.' },
  ];
  const pokemon = [{ species: 'pidgey' as const, gx: 200, gy: 150 }, { species: 'rattata' as const, gx: 500, gy: 400 }];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#4a9a3a' } } },
    regionId: 'heartland-wilds', layout: { worldX: 0, worldY: -610 },
    ground, elevation, objects, spawn: { x: 376, y: 580, facing: 'up' }, exits: [], npcPositions, pokemon,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: -610 } },
  build,
};
export default mod;
