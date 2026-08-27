import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place } from '../../../maps/authoring';
import { fillRect, coastline } from '../../authoring/terrain';

const ID = 'gull-rock-isle';
const W = 360;
const H = 300;
const PPT = 8;
const G: TileType = 'grass';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  coastline(ground, 'N', 20, 5);
  coastline(ground, 'S', 20, 5);
  coastline(ground, 'E', 20, 5);
  coastline(ground, 'W', 20, 5);
  fillRect(ground, 140, 120, 80, 60, G);

  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 178, 140),
    place('rock_small' as any, 100, 80),
    place('rock_small' as any, 250, 200),
    place('boulder' as any, 180, 80),
  ];
  const npcPositions = [
    { x: 180, y: 150, name: 'Sailor', dialogue: 'Gull Rock is a quiet getaway from the mainland.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    regionId: 'coral-coast', layout: { worldX: 1200, worldY: 460 },
    ground, elevation, objects, spawn: { x: 20, y: 150, facing: 'right' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 1200, worldY: 460 } },
  build,
};
export default mod;
