import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place, terraceEllipse, carveRamp } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';

const ID = 'sunken-grotto';
const W = 440;
const H = 420;
const PPT = 6;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 200, 0, 20, 60, P);
  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 220, 240, 100, 100, 0, -1);
  carveRamp(elevation, 200, 0, 20, 60, 0, 0);
  const objects: MapObject[] = [
    place('sign' as any, 208, 10),
    place('mushroom' as any, 160, 200),
    place('mushroom' as any, 280, 280),
    place('boulder' as any, 140, 300),
    place('boulder' as any, 300, 180),
  ];
  const npcPositions = [
    { x: 218, y: 240, name: 'Elder', dialogue: 'The sunken grotto hides many secrets.' },
  ];
  const pokemon = [{ species: 'bulbasaur' as const, gx: 180, gy: 220 }];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'forest-day',
    regionId: 'heartland-wilds', layout: { worldX: 730, worldY: 730 },
    ground, elevation, objects, spawn: { x: 218, y: 20, facing: 'down' }, exits: [], npcPositions, pokemon,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'forest-day', layout: { worldX: 730, worldY: 730 } },
  build,
};
export default mod;
