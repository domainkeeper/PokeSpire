import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place, treeWall, terraceEllipse, flattenRect } from '../../../maps/authoring';
import { fillRect, coastline } from '../../authoring/terrain';
import { COAST_GRASS } from '../../encounters/tables';

const ID = 'route-1-coast-road';
const W = 512;
const H = 760;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));

  // Main north-south road
  fillRect(ground, 248, 0, 16, H, P);

  // Beach along east edge
  coastline(ground, 'E', 40, 8);

  // Cliff wall on west side (trees)
  const westTrees = treeWall(
    Math.ceil(H / 12),
    (i) => [20, i * 12],
    12, 6,
    { from: 360, to: 400, axis: 'y' },
  );

  // Elevation: cliff on west, flat road, beach on east
  const elevation = makeElevation(W, H, 0);
  terraceEllipse(elevation, 60, 380, 50, 360, 0, 2);
  flattenRect(elevation, { x: 230, y: 0, w: 50, h: H }, 0);

  // Tall grass patches
  const tallGrass = scatter({
    table: [{ id: 'grass_tuft' as any, weight: 1 }],
    area: { x: 100, y: 100, w: 100, h: 200 }, pitch: 4, density: 0.3, seed: 10,
    allow: (gx, gy) => ground[gy]?.[gx] === 'grass',
  });

  const objects: MapObject[] = [
    ...westTrees,
    ...tallGrass,
    ...scatter({ table: [{ id: 'rock_small' as any, weight: 2 }, { id: 'rock_large' as any, weight: 1 }], area: { x: 140, y: 300, w: 60, h: 60 }, pitch: 8, density: 0.25, seed: 15 }),
    ...scatter({ table: [{ id: 'bush' as any, weight: 2 }, { id: 'flower' as any, weight: 3 }], area: { x: 80, y: 400, w: 120, h: 180 }, pitch: 6, density: 0.3, seed: 16 }),
    ...scatter({ table: [{ id: 'tree_palm' as any, weight: 1 }], area: { x: 420, y: 100, w: 60, h: 500 }, pitch: 16, density: 0.15, seed: 17 }),
    place('sign' as any, 250, 10),
  ];

  const npcPositions = [
    { x: 256, y: 50, name: 'Ranger', dialogue: 'This is Route 1! Watch out for wild Pokemon in the tall grass.' },
    { x: 256, y: 400, name: 'Hiker', dialogue: 'The cliffs to the west are impressive, are not they?' },
    { x: 256, y: 650, name: 'Fisherman', dialogue: 'The beach to the east is great for fishing.' },
  ];

  const pokemon = [
    { species: 'pidgey' as const, gx: 120, gy: 150 },
    { species: 'rattata' as const, gx: 160, gy: 250 },
    { species: 'pikachu' as const, gx: 230, gy: 300 },
  ];

  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT,
    themeId: 'coastal-day',
    regionId: 'coral-coast',
    layout: { worldX: 0, worldY: 460 },
    ground, elevation, objects,
    spawn: { x: 256, y: 20, facing: 'down' },
    exits: [],
    npcPositions, pokemon,
    encounterZones: [
      { id: 'route1-grass', biome: 'grass', rects: [{ x: 80, y: 100, w: 120, h: 200 }], table: COAST_GRASS, rarity: 'common' },
    ],
  };
}

const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H,
          pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: 460 } },
  build,
};
export default mod;
