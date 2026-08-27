import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect, coastline } from '../../authoring/terrain';
import { dock } from '../../prefabs/coast';
import { lampRow } from '../../prefabs/urban';

const ID = 'harbor-district';
const W = 432;
const H = 360;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path', S: TileType = 'sand';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 200, 0, 12, H, P);
  fillRect(ground, 0, 170, W, 12, P);
  coastline(ground, 'S', 20, 6);
  fillRect(ground, 100, 200, 120, 60, S);

  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    ...dock({ x: 140, y: 280, length: 10, direction: 'vertical' }),
    ...dock({ x: 200, y: 280, length: 10, direction: 'vertical' }),
    ...scatter({ table: [{ id: 'crate' as any, weight: 1 }], area: { x: 60, y: 120, w: 80, h: 40 }, pitch: 6, density: 0.25, seed: 10 }),
    ...scatter({ table: [{ id: 'barrel' as any, weight: 1 }], area: { x: 280, y: 120, w: 80, h: 40 }, pitch: 6, density: 0.25, seed: 11 }),
    place('sign' as any, 200, 10),
    ...lampRow({ from: [198, 60], to: [198, 160], spacing: 14 }),
  ];
  const npcPositions = [
    { x: 206, y: 100, name: 'Sailor', dialogue: 'The lighthouse is to the west. Ships depend on it.' },
    { x: 120, y: 140, name: 'Merchant', dialogue: 'We import goods through this harbor.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    regionId: 'coral-coast', layout: { worldX: -440, worldY: 0 },
    ground, elevation, objects, spawn: { x: 206, y: 20, facing: 'down' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: -440, worldY: 0 } },
  build,
};
export default mod;
