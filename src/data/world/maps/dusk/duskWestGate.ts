import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { cityBlock, plazaProps } from '../../prefabs/buildings';
import { lampRow } from '../../prefabs/urban';

const ID = 'dusk-west-gate';
const W = 472;
const H = 432;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 226, 0, 12, H, P);
  fillRect(ground, 0, 210, W, 12, P);
  fillRect(ground, 100, 100, 120, 80, P);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    ...plazaProps({ x: 100, y: 100, w: 120, h: 80 }),
    ...cityBlock({ x: 40, y: 20, w: 80, h: 60, seed: 10 }),
    ...cityBlock({ x: 300, y: 20, w: 80, h: 60, seed: 11 }),
    ...lampRow({ from: [224, 20], to: [224, 200], spacing: 12 }),
    place('sign' as any, 10, 212),
  ];
  const npcPositions = [
    { x: 232, y: 140, name: 'Trainer', dialogue: 'Welcome to Dusk City! The gate marks the city border.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city',
    regionId: 'dusk-metro', layout: { worldX: 1420, worldY: 0 },
    ground, elevation, objects, spawn: { x: 20, y: 216, facing: 'right' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H, pixelsPerTile: PPT, themeId: 'dusk-city', layout: { worldX: 1420, worldY: 0 } },
  build,
};
export default mod;
