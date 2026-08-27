import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place, terraceEllipse, flattenRect } from '../../../maps/authoring';
import { fillRect, coastline } from '../../authoring/terrain';

const ID = 'lighthouse-point';
const W = 300;
const H = 300;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 140, 140, 20, 140, P);
  coastline(ground, 'N', 15, 5);
  coastline(ground, 'E', 15, 5);
  coastline(ground, 'W', 15, 5);

  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 150, 100, 40, 40, 0, 2);
  flattenRect(elevation, { x: 140, y: 140, w: 20, h: 60 }, 0);

  const objects: MapObject[] = [
    place('well' as any, 148, 90),
    place('lamp_post' as any, 130, 120),
    place('lamp_post' as any, 170, 120),
    place('sign' as any, 148, 160),
  ];
  const npcPositions = [
    { x: 150, y: 110, name: 'Elder', dialogue: 'This lighthouse has guided sailors for generations.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    regionId: 'coral-coast', layout: { worldX: -760, worldY: 0 },
    ground, elevation, objects, spawn: { x: 150, y: 200, facing: 'up' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: -760, worldY: 0 } },
  build,
};
export default mod;
