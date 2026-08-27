import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect, coastline, pond } from '../../authoring/terrain';

const ID = 'tidepool-flats';
const W = 600;
const H = 520;
const PPT = 6;
const G: TileType = 'grass', S: TileType = 'sand';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  coastline(ground, 'S', 30, 8);
  coastline(ground, 'E', 15, 5);
  pond(ground, 200, 180, 30, 25, 'water');
  pond(ground, 400, 300, 35, 25, 'water');
  fillRect(ground, 80, 80, 100, 60, S);

  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 10, 10),
    ...scatter({ table: [{ id: 'rock_small' as any, weight: 1 }], area: { x: 250, y: 200, w: 80, h: 60 }, pitch: 8, density: 0.2, seed: 10 }),
    ...scatter({ table: [{ id: 'tree_palm' as any, weight: 1 }], area: { x: 50, y: 40, w: 60, h: 40 }, pitch: 12, density: 0.1, seed: 11 }),
  ];
  const npcPositions = [
    { x: 90, y: 90, name: 'Fisherman', dialogue: 'The tidepools here are full of interesting creatures.' },
  ];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { sand: { base: '#e0c890' } } },
    regionId: 'coral-coast', layout: { worldX: 520, worldY: 990 },
    ground, elevation, objects, spawn: { x: 20, y: 100, facing: 'right' }, exits: [], npcPositions,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 520, worldY: 990 } },
  build,
};
export default mod;
