import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place, scatter } from '../../../maps/authoring';
import { fillRect, river, bridge } from '../../authoring/terrain';

const ID = 'old-stone-bridge';
const W = 240;
const H = 420;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));

  // Main east-west path
  fillRect(ground, 0, 196, W, 12, P);

  // River running north-south
  river(ground, 118, 0, 118, H, 20);

  // Bridge over the river (path over water)
  bridge(ground, 108, 190, 24, 24);

  const elevation = makeElevation(W, H, 0);

  const objects: MapObject[] = [
    place('sign' as any, 30, 195),
    place('sign' as any, 210, 195),
    ...scatter({ table: [{ id: 'rock_small' as any, weight: 1 }], area: { x: 20, y: 300, w: 80, h: 80 }, pitch: 8, density: 0.15, seed: 10 }),
    ...scatter({ table: [{ id: 'reed' as any, weight: 1 }], area: { x: 80, y: 50, w: 20, h: 120 }, pitch: 4, density: 0.4, seed: 11 }),
    ...scatter({ table: [{ id: 'reed' as any, weight: 1 }], area: { x: 140, y: 250, w: 20, h: 120 }, pitch: 4, density: 0.4, seed: 12 }),
  ];

  const npcPositions = [
    { x: 60, y: 200, name: 'Hiker', dialogue: 'This old stone bridge has been here for ages.' },
  ];

  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT,
    themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#3a6848' } } },
    regionId: 'heartland-wilds',
    layout: { worldX: 1368, worldY: 0 },
    ground, elevation, objects,
    spawn: { x: 20, y: 202, facing: 'right' },
    exits: [],
    npcPositions,
  };
}

const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H,
          pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 1368, worldY: 0 } },
  build,
};
export default mod;
