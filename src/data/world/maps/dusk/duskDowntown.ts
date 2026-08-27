import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, place } from '../../../maps/authoring';
import { fillRect } from '../../authoring/terrain';
import { streetGrid } from '../../authoring/city';
import { cityBlock, plazaProps, shopFront } from '../../prefabs/buildings';
import { lampRow } from '../../prefabs/urban';

const ID = 'dusk-downtown';
const W = 512;
const H = 472;
const PPT = 8;
const G: TileType = 'grass', P: TileType = 'path';

function build(): GameMap {
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));

  // Grid streets
  streetGrid(ground, 40, 40, 4, 3, 80, 60, 8);

  // Central plaza
  fillRect(ground, 190, 160, 100, 80, P);

  // Main east-west boulevard
  fillRect(ground, 0, 200, W, 10, P);

  const elevation = makeElevation(W, H, 0);

  const objects: MapObject[] = [
    ...plazaProps({ x: 190, y: 160, w: 100, h: 80 }),
    ...cityBlock({ x: 40, y: 40, w: 80, h: 60, seed: 10 }),
    ...cityBlock({ x: 130, y: 40, w: 80, h: 60, seed: 11 }),
    ...cityBlock({ x: 280, y: 40, w: 80, h: 60, seed: 12 }),
    ...cityBlock({ x: 370, y: 40, w: 80, h: 60, seed: 13 }),
    ...cityBlock({ x: 40, y: 260, w: 80, h: 60, seed: 14 }),
    ...cityBlock({ x: 130, y: 260, w: 80, h: 60, seed: 15 }),
    ...cityBlock({ x: 280, y: 260, w: 80, h: 60, seed: 16 }),
    ...cityBlock({ x: 370, y: 260, w: 80, h: 60, seed: 17 }),
    ...shopFront({ x: 200, y: 130 }),
    ...shopFront({ x: 270, y: 130 }),
    ...lampRow({ from: [40, 38], to: [450, 38], spacing: 12 }),
    ...lampRow({ from: [40, 250], to: [450, 250], spacing: 12 }),
    ...lampRow({ from: [40, 340], to: [450, 340], spacing: 12 }),
    place('sign' as any, 10, 202),
  ];

  const npcPositions = [
    { x: 240, y: 195, name: 'Merchant', dialogue: 'Welcome to Dusk Downtown! The heart of the city.' },
    { x: 200, y: 170, name: 'Trainer', dialogue: 'I am the Gym Leader. Come back when you are ready!' },
    { x: 100, y: 60, name: 'Resident', dialogue: 'The city grid makes navigation easy.' },
    { x: 380, y: 60, name: 'Resident', dialogue: 'I love the lamp-lit streets at dusk.' },
    { x: 100, y: 280, name: 'Scientist', dialogue: 'The industrial district is to the south.' },
    { x: 380, y: 280, name: 'Nurse', dialogue: 'The Pokemon Center is nearby if you need healing.' },
  ];

  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT,
    themeId: 'dusk-city',
    regionId: 'dusk-metro',
    layout: { worldX: 2330, worldY: 0 },
    ground, elevation, objects,
    spawn: { x: 20, y: 205, facing: 'right' },
    exits: [],
    npcPositions,
  };
}

const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'dusk-metro', width: W, height: H,
          pixelsPerTile: PPT, themeId: 'dusk-city', layout: { worldX: 2330, worldY: 0 } },
  build,
};
export default mod;
