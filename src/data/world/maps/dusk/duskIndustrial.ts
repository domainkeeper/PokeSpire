import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';

const ID = 'dusk-industrial';
const W = 488;
const H = 432;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path', D: TileType = 'dirt';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 230, 0, 16, H, P);
  fillRect(ground, 0, 210, W, 12, P);
  fillRect(ground, 40, 40, 160, 120, D);
  fillRect(ground, 300, 260, 140, 100, D);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    ...scatter({ table: [{ id: 'crate' as any, weight: 1 }], area: { x: 50, y: 50, w: 120, h: 80 }, pitch: 6, density: 0.3, seed: 10 }),
    ...scatter({ table: [{ id: 'barrel' as any, weight: 1 }], area: { x: 310, y: 270, w: 100, h: 60 }, pitch: 6, density: 0.3, seed: 11 }),
    place('sign' as any, 10, 212),
    ...scatter({ table: [{ id: 'fence_wood' as any, weight: 1 }], area: { x: 40, y: 160, w: 160, h: 4 }, pitch: 6, density: 0.8, seed: 12 }),
  ];
  const npcPositions = [
    { x: 238, y: 100, name: 'Worker', dialogue: 'The industrial district keeps the city running.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city',
    regionId: 'dusk-metro', layout: { worldX: 2420, worldY: 480 },
    ground, elevation, objects, spawn: { x: 20, y: 216, facing: 'right' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city', layout: { worldX: 2420, worldY: 480 } },
  build,
};
export default mod;
