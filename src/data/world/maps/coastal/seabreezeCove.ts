import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect, coastline, pond } from '../../authoring/terrain';

const ID = 'seabreeze-cove';
const W = 672;
const H = 520;
const PPT = 6;
const G: TileType = 'grass', S: TileType = 'sand';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  coastline(ground, 'S', 40, 10);
  coastline(ground, 'E', 20, 6);
  pond(ground, 300, 200, 40, 30, S);
  pond(ground, 500, 350, 25, 20, S);
  fillRect(ground, 100, 100, 80, 40, S);

  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 10, 10),
    ...scatter({ table: [{ id: 'rock_small' as any, weight: 1 }], area: { x: 200, y: 300, w: 100, h: 80 }, pitch: 8, density: 0.15, seed: 10 }),
    ...scatter({ table: [{ id: 'tree_palm' as any, weight: 1 }], area: { x: 50, y: 50, w: 100, h: 60 }, pitch: 10, density: 0.12, seed: 11 }),
  ];
  const npcPositions = [
    { x: 110, y: 110, name: 'Sailor', dialogue: 'Seabreeze Cove is famous for its tidepools.' },
  ];
  const pokemon = [{ species: 'squirtle' as const, gx: 320, gy: 210 }];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { sand: { base: '#e0c890' } } },
    regionId: 'coral-coast', layout: { worldX: 520, worldY: 460 },
    ground, elevation, objects, spawn: { x: 20, y: 120, facing: 'right' }, exits: [], npcPositions, pokemon,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 520, worldY: 460 } },
  build,
};
export default mod;
