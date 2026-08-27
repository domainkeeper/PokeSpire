import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place, terraceEllipse } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';

const ID = 'echo-cave-entrance';
const W = 360;
const H = 340;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 160, 280, 20, 60, P);
  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 180, 140, 80, 80, 0, 2);
  const objects: MapObject[] = [
    place('sign' as any, 168, 290),
    place('boulder' as any, 120, 100),
    place('boulder' as any, 240, 100),
    place('boulder' as any, 180, 60),
  ];
  const npcPositions = [
    { x: 178, y: 200, name: 'Scientist', dialogue: 'Echo Cave is rumored to contain rare minerals.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#3a5840' } } },
    regionId: 'heartland-wilds', layout: { worldX: 390, worldY: 1420 },
    ground, elevation, objects, spawn: { x: 178, y: 320, facing: 'up' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 390, worldY: 1420 } },
  build,
};
export default mod;
