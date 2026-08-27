import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place, terraceEllipse, carveRamp } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { lampRow } from '../../prefabs/urban';

const ID = 'dusk-heights';
const W = 440;
const H = 400;
const PPT = 6;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 200, 300, 20, 100, P);
  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 220, 160, 100, 100, 0, 3);
  carveRamp(elevation, 200, 300, 20, 60, 0, 3, 'y');
  const objects: MapObject[] = [
    place('sign' as any, 208, 310),
    ...lampRow({ from: [160, 100], to: [280, 100], spacing: 14 }),
    place('bench' as any, 200, 120),
    place('bench' as any, 240, 120),
  ];
  const npcPositions = [
    { x: 218, y: 160, name: 'Elder', dialogue: 'The heights offer the best view of Dusk City.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city',
    regionId: 'dusk-metro', layout: { worldX: 3220, worldY: 480 },
    ground, elevation, objects, spawn: { x: 218, y: 380, facing: 'up' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city', layout: { worldX: 3220, worldY: 480 } },
  build,
};
export default mod;
