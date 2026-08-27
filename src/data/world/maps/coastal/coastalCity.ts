import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, place } from '../../../maps/authoring';
import { fillRect, coastline } from '../../authoring/terrain';
import { houseRow, plazaProps, shopFront } from '../../prefabs/buildings';
import { lampRow } from '../../prefabs/urban';
import { flowerField } from '../../prefabs/nature';

const ID = 'coastal-city';
const W = 504;
const H = 456;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));

  // Central plaza
  fillRect(ground, 210, 180, 84, 60, P);
  // North-south road
  fillRect(ground, 248, 0, 8, H, P);
  // East-west road
  fillRect(ground, 0, 208, W, 8, P);

  // Waterfront (south edge)
  coastline(ground, 'S', 30, 6);

  // Park area (east)
  fillRect(ground, 340, 160, 80, 80, G);

  // Residential blocks (west)
  fillRect(ground, 40, 100, 140, 160, G);

  const elevation = makeElevation(W, H, 0);

  const objects: MapObject[] = [
    ...plazaProps({ x: 210, y: 180, w: 84, h: 60 }),
    ...shopFront({ x: 220, y: 130 }),
    ...shopFront({ x: 260, y: 130 }),
    ...houseRow({ x: 40, y: 100, count: 4, gap: 30, size: 'small', seed: 11 }),
    ...houseRow({ x: 40, y: 140, count: 4, gap: 30, size: 'large', seed: 12 }),
    ...houseRow({ x: 40, y: 200, count: 4, gap: 30, size: 'small', seed: 13 }),
    ...flowerField({ x: 340, y: 160, w: 80, h: 80, seed: 20 }),
    ...lampRow({ from: [210, 178], to: [294, 178], spacing: 10 }),
    ...lampRow({ from: [210, 242], to: [294, 242], spacing: 10 }),
    ...scatter({ table: [{ id: 'bench' as any, weight: 1 }], area: { x: 340, y: 200, w: 60, h: 40 }, pitch: 12, density: 0.2, seed: 30 }),
    place('well' as any, 252, 210),
    place('sign' as any, 252, 170),
  ];

  const npcPositions = [
    { x: 252, y: 195, name: 'Professor', dialogue: 'Route 1 is to the EAST! head that way to begin your journey.' },
    { x: 230, y: 185, name: 'Nurse', dialogue: 'Welcome to the Pokemon Center!' },
    { x: 270, y: 185, name: 'Merchant', dialogue: 'You can find supplies at the Mart.' },
    { x: 100, y: 120, name: 'Resident', dialogue: 'I love living in Coastal City.' },
    { x: 130, y: 150, name: 'Resident', dialogue: 'The park to the east is lovely this time of year.' },
    { x: 200, y: 300, name: 'Sailor', dialogue: 'The waterfront is just south of here.' },
    { x: 360, y: 200, name: 'Ranger', dialogue: 'Be careful in the tall grass on Route 1!' },
  ];

  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT,
    themeId: 'coastal-day',
    regionId: 'coral-coast',
    layout: { worldX: 0, worldY: 0 },
    ground, elevation, objects,
    spawn: { x: 252, y: 260, facing: 'up' },
    exits: [],
    npcPositions,
  };
}

const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H,
          pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: 0 } },
  build,
};
export default mod;
