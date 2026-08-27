import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';

const ID = 'whisperwind-meadow';
const W = 800;
const H = 640;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  fillRect(ground, 390, 0, 12, H, P);
  fillRect(ground, 0, 310, W, 12, P);
  const elevation = makeElevation(W, H, 0);
  const objects: MapObject[] = [
    place('sign' as any, 390, 10),
    ...scatter({ table: [{ id: 'flower_bush' as any, weight: 1 }], area: { x: 100, y: 100, w: 250, h: 200 }, pitch: 5, density: 0.25, seed: 10 }),
    ...scatter({ table: [{ id: 'flower_bush' as any, weight: 1 }], area: { x: 450, y: 100, w: 250, h: 200 }, pitch: 5, density: 0.25, seed: 11 }),
    ...scatter({ table: [{ id: 'bush_round' as any, weight: 1 }], area: { x: 100, y: 350, w: 250, h: 200 }, pitch: 6, density: 0.15, seed: 12 }),
    ...scatter({ table: [{ id: 'bush_round' as any, weight: 1 }], area: { x: 450, y: 350, w: 250, h: 200 }, pitch: 6, density: 0.15, seed: 13 }),
    place('well' as any, 396, 316),
  ];
  const npcPositions = [
    { x: 396, y: 200, name: 'Ranger', dialogue: 'Whisperwind Meadow stretches far and wide.' },
  ];
  const pokemon = [{ species: 'pidgey' as const, gx: 200, gy: 200 }, { species: 'caterpie' as const, gx: 600, gy: 400 }];
  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day',
    themeOverride: { palette: { grass: { base: '#4a9a3a' } } },
    regionId: 'heartland-wilds', layout: { worldX: 0, worldY: -1260 },
    ground, elevation, objects, spawn: { x: 396, y: 620, facing: 'up' }, exits: [], npcPositions, pokemon,
  };
}
const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H, pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: -1260 } },
  build,
};
export default mod;
