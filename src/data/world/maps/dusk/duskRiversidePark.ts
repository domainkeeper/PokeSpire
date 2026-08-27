import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect, pond } from '../../authoring/terrain';
import { flowerField } from '../../prefabs/nature';

const ID = 'dusk-riverside-park';
const W = 360;
const H = 320;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 160, 0, 16, H, P);
  fillRect(ground, 0, 150, W, 12, P);
  pond(ground, 260, 220, 40, 30, 'water');
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    ...flowerField({ x: 40, y: 40, w: 100, h: 80, seed: 10 }),
    ...scatter({ table: [{ id: 'bench' as any, weight: 1 }], area: { x: 40, y: 180, w: 100, h: 60 }, pitch: 14, density: 0.2, seed: 11 }),
    place('well' as any, 100, 200),
    place('sign' as any, 10, 152),
  ];
  const npcPositions = [
    { x: 100, y: 100, name: 'Resident', dialogue: 'The riverside park is a green oasis in the city.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city',
    regionId: 'dusk-metro', layout: { worldX: 2850, worldY: 480 },
    ground, elevation, objects, spawn: { x: 20, y: 156, facing: 'right' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city', layout: { worldX: 2850, worldY: 480 } },
  build,
};
export default mod;
