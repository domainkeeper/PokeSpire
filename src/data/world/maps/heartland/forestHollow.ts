import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place, terraceEllipse, carveRamp } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';

const ID = 'forest-hollow';
const W = 480;
const H = 480;
const PPT = 6;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 220, 0, 20, H, P);
  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 240, 240, 120, 120, 0, -1);
  carveRamp(elevation, 220, 0, 20, 80, 0, 0);
  const objects: MapObject[] = [
    place('sign' as any, 228, 10),
    place('mushroom' as any, 180, 200),
    place('mushroom' as any, 300, 280),
    place('boulder' as any, 150, 350),
    place('boulder' as any, 330, 150),
  ];
  const npcPositions = [
    { x: 238, y: 240, name: 'Elder', dialogue: 'The forest hollow is a peaceful sanctuary.' },
  ];
  const pokemon = [{ species: 'bulbasaur' as const, gx: 200, gy: 200 }];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'forest-day',
    regionId: 'heartland-wilds', layout: { worldX: 1370, worldY: 100 },
    ground, elevation, objects, spawn: { x: 230, y: 20, facing: 'down' }, exits: [], npcPositions, pokemon,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'forest-day', layout: { worldX: 1370, worldY: 100 } },
  build,
};
export default mod;
