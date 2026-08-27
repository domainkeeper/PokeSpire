import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { lampRow } from '../../prefabs/urban';

const ID = 'route-5-dusk-approach';
const W = 720;
const H = 620;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path', D: TileType = 'dirt';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 350, 0, 12, H, P);
  fillRect(ground, 0, 300, W, 12, P);
  fillRect(ground, 400, 100, 60, 40, D);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 350, 10),
    ...lampRow({ from: [348, 50], to: [348, 550], spacing: 16 }),
    ...scatter({ table: [{ id: 'grass_tuft' as any, weight: 1 }], area: { x: 100, y: 200, w: 150, h: 100 }, pitch: 5, density: 0.2, seed: 10 }),
    ...scatter({ table: [{ id: 'rock_small' as any, weight: 1 }], area: { x: 500, y: 400, w: 100, h: 80 }, pitch: 8, density: 0.15, seed: 11 }),
  ];
  const npcPositions = [
    { x: 356, y: 200, name: 'Elder', dialogue: 'The city approaches. The lamp rows guide the way.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-outskirts',
    regionId: 'dusk-metro', layout: { worldX: 0, worldY: 590 },
    ground, elevation, objects, spawn: { x: 356, y: 20, facing: 'down' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-outskirts', layout: { worldX: 0, worldY: 590 } },
  build,
};
export default mod;
