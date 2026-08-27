import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';

const ID = 'dusk-depot';
const W = 260;
const H = 360;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path', D: TileType = 'dirt';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 120, 0, 12, H, P);
  fillRect(ground, 40, 100, 160, 120, D);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 120, 10),
    place('crate' as any, 60, 120),
    place('crate' as any, 80, 120),
    place('barrel' as any, 100, 140),
    place('barrel' as any, 160, 160),
  ];
  const npcPositions = [
    { x: 126, y: 80, name: 'Worker', dialogue: 'The depot handles all transit in and out of the city.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city',
    regionId: 'dusk-metro', layout: { worldX: 1420, worldY: 440 },
    ground, elevation, objects, spawn: { x: 126, y: 340, facing: 'up' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city', layout: { worldX: 1420, worldY: 440 } },
  build,
};
export default mod;
