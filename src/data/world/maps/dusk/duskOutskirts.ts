import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { houseRow } from '../../prefabs/buildings';
import { lampRow, fenceYard } from '../../prefabs/urban';

const ID = 'dusk-outskirts';
const W = 700;
const H = 580;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path', D: TileType = 'dirt';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));

  // Main east-west road
  fillRect(ground, 0, 280, W, 12, P);
  // North-south road
  fillRect(ground, 344, 0, 12, H, P);

  // Dirt farm lots
  fillRect(ground, 40, 60, 120, 80, D);
  fillRect(ground, 40, 380, 120, 80, D);
  fillRect(ground, 500, 60, 120, 80, D);

  const elevation = makeElevation(W, H, 0);

  const objects: MapObject[] = [
    ...houseRow({ x: 200, y: 100, count: 3, gap: 50, size: 'small', seed: 10 }),
    ...houseRow({ x: 200, y: 400, count: 3, gap: 50, size: 'small', seed: 11 }),
    ...fenceYard({ x: 40, y: 60, w: 120, h: 80 }),
    ...fenceYard({ x: 40, y: 380, w: 120, h: 80 }),
    ...lampRow({ from: [100, 278], to: [600, 278], spacing: 14 }),
    ...lampRow({ from: [100, 294], to: [600, 294], spacing: 14 }),
    place('sign' as any, 10, 282),
    place('well' as any, 350, 200),
    ...scatter({ table: [{ id: 'grass_tuft' as any, weight: 1 }], area: { x: 500, y: 380, w: 120, h: 80 }, pitch: 5, density: 0.3, seed: 20 }),
  ];

  const npcPositions = [
    { x: 350, y: 286, name: 'Elder', dialogue: 'Welcome to the outskirts. Dusk City lies to the east.' },
    { x: 220, y: 110, name: 'Resident', dialogue: 'We live simply out here, away from the city noise.' },
    { x: 100, y: 100, name: 'Ranger', dialogue: 'The farmlands produce most of the region food.' },
  ];

  const pokemon = [
    { species: 'rattata' as const, gx: 80, gy: 400 },
    { species: 'pidgey' as const, gx: 520, gy: 80 },
  ];

  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT,
    themeId: 'dusk-outskirts',
    regionId: 'dusk-metro',
    layout: { worldX: 1620, worldY: 0 },
    ground, elevation, objects,
    spawn: { x: 20, y: 286, facing: 'right' },
    exits: [],
    npcPositions, pokemon,
  };
}

const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H,
          pixelsPerTile: PPT, themeId: 'dusk-outskirts', layout: { worldX: 1620, worldY: 0 } },
  build,
};
export default mod;
