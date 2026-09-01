import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place, treeWall } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { forestCluster } from '../../prefabs/nature';
import { FOREST } from '../../encounters/tables';

const ID = 'verdant-forest';
const W = 840;
const H = 760;
const PPT = 4;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));

  // Main east-west path
  fillRect(ground, 0, 200, W, 12, P);
  // North-south connector
  fillRect(ground, 416, 0, 12, H, P);

  // Dense forest walls forming corridors
  const forestWalls = [
    ...treeWall(40, (i) => [100, i * 18], 18, 6, { from: 195, to: 220, axis: 'y' }),
    ...treeWall(40, (i) => [300, i * 18], 18, 6, { from: 195, to: 220, axis: 'y' }),
    ...treeWall(40, (i) => [500, i * 18], 18, 6, { from: 195, to: 220, axis: 'y' }),
    ...treeWall(40, (i) => [700, i * 18], 18, 6, { from: 195, to: 220, axis: 'y' }),
    // Horizontal walls
    ...treeWall(45, (i) => [i * 18, 100], 18, 6, { from: 410, to: 440, axis: 'x' }),
    ...treeWall(45, (i) => [i * 18, 340], 18, 6, { from: 410, to: 440, axis: 'x' }),
  ];

  // Clearings
  fillRect(ground, 150, 50, 100, 100, G);
  fillRect(ground, 450, 50, 100, 100, G);
  fillRect(ground, 300, 280, 120, 80, G);

  const elevation = makeElevation(W, H, 0);

  const objects: MapObject[] = [
    ...forestWalls,
    ...forestCluster({ x: 0, y: 0, w: 140, h: 760, density: 0.4, seed: 10 }),
    ...forestCluster({ x: 700, y: 0, w: 140, h: 760, density: 0.4, seed: 11 }),
    ...forestCluster({ x: 0, y: 0, w: 840, h: 140, density: 0.35, seed: 12 }),
    ...forestCluster({ x: 0, y: 600, w: 840, h: 160, density: 0.35, seed: 13 }),
    // Clearing decorations & visual depth hierarchy
    place('bench' as any, 180, 80),
    place('well' as any, 500, 90),
    place('sign' as any, 416, 195),
    ...scatter({ table: [{ id: 'mushroom' as any, weight: 2 }, { id: 'flower' as any, weight: 2 }, { id: 'rock_small' as any, weight: 1 }], area: { x: 150, y: 50, w: 120, h: 100 }, pitch: 5, density: 0.4, seed: 19 }),
    ...scatter({ table: [{ id: 'mushroom' as any, weight: 3 }, { id: 'grass_tuft' as any, weight: 2 }], area: { x: 300, y: 280, w: 120, h: 80 }, pitch: 5, density: 0.35, seed: 20 }),
    ...scatter({ table: [{ id: 'tree_pine' as any, weight: 1 }, { id: 'bush_berry' as any, weight: 1 }], area: { x: 450, y: 50, w: 100, h: 100 }, pitch: 8, density: 0.25, seed: 21 }),
  ];

  const npcPositions = [
    { x: 422, y: 206, name: 'Ranger', dialogue: 'Welcome to Verdant Forest! Stick to the paths to stay safe.' },
    { x: 180, y: 90, name: 'Elder', dialogue: 'These ancient trees have stood for centuries.' },
    { x: 500, y: 100, name: 'Scientist', dialogue: 'I am studying the unique flora of this forest.' },
  ];

  const pokemon = [
    { species: 'bulbasaur' as const, gx: 170, gy: 70 },
    { species: 'caterpie' as const, gx: 470, gy: 60 },
    { species: 'pidgey' as const, gx: 350, gy: 300 },
    { species: 'eevee' as const, gx: 220, gy: 320 },
  ];

  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT,
    themeId: 'forest-day',
    regionId: 'heartland-wilds',
    layout: { worldX: 520, worldY: 0 },
    ground, elevation, objects,
    spawn: { x: 20, y: 206, facing: 'right' },
    exits: [],
    npcPositions, pokemon,
    encounterZones: [
      { id: 'forest-grass', biome: 'grass', rects: [{ x: 140, y: 40, w: 120, h: 120 }, { x: 440, y: 40, w: 120, h: 120 }], table: FOREST, rarity: 'common' },
    ],
  };
}

const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'heartland-wilds', width: W, height: H,
          pixelsPerTile: PPT, themeId: 'forest-day', layout: { worldX: 520, worldY: 0 } },
  build,
};
export default mod;
