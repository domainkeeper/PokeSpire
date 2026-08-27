import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { windmill, fenceYard } from '../../prefabs/urban';

const ID = 'windmill-farms';
const W = 680;
const H = 560;
const PPT = 6;
const G: TileType = 'grass', P: TileType = 'path', D: TileType = 'dirt';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 330, 0, 12, H, P);
  fillRect(ground, 100, 100, 120, 80, D);
  fillRect(ground, 400, 300, 120, 80, D);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 330, 10),
    ...windmill({ x: 130, y: 110 }),
    ...windmill({ x: 430, y: 310 }),
    ...fenceYard({ x: 100, y: 100, w: 120, h: 80 }),
    ...fenceYard({ x: 400, y: 300, w: 120, h: 80 }),
    ...scatter({ table: [{ id: 'grass_tuft' as any, weight: 1 }], area: { x: 250, y: 400, w: 150, h: 100 }, pitch: 5, density: 0.25, seed: 10 }),
  ];
  const npcPositions = [
    { x: 336, y: 200, name: 'Farmer', dialogue: 'The windmills grind our grain. Essential for the city.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-outskirts',
    regionId: 'dusk-metro', layout: { worldX: 710, worldY: 0 },
    ground, elevation, objects, spawn: { x: 336, y: 20, facing: 'down' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-outskirts', layout: { worldX: 710, worldY: 0 } },
  build,
};
export default mod;
