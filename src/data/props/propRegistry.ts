import type { PropDef, PropBuildContext } from './propTypes';
import type { PropPart } from '../../game/entities/InstancedProps';
import {
  blobTexture,
  barkTexture,
  rockTexture,
  flowerTexture,
  plankTexture,
  masonryTexture,
  shingleTexture,
  windowTexture,
  doorTexture,
} from '../../game/pixel/textureLib';
import {
  card,
  crossedCards,
  cutoutMat,
  texturedMat,
  solidMat,
  cylPart,
  boxPart,
  conePart,
  spherePart,
  boxGeo as boxGeoRef,
  cylGeo,
} from '../../game/entities/shapeLib';

/**
 * THE PROP CATALOGUE.
 *
 * Everything placeable in the world lives here as data. To add a prop:
 *   1. add an entry below
 *   2. reference its id from map data
 * That's it - `PropId` widens automatically, collision picks up the footprint,
 * and the renderer instances it. No component, no switch statement, no wiring.
 *
 * `satisfies` (rather than `as const satisfies`) keeps the key literals for
 * PropId while leaving each entry widened to PropDef, so optional fields like
 * scaleJitter stay accessible on the union.
 */
const REGISTRY = {
  /* =============================================================== trees === */

  tree_oak: {
    name: 'Oak Tree',
    footprint: { w: 6, h: 6 },
    solid: true,
    height: 2.2,
    variants: 3,
    randomYaw: true,
    scaleJitter: [0.88, 1.18],
    contactShadow: 0.5,
    build: ({ theme, variant }) => {
      const ramp = variant === 1 ? theme.palette.foliageAlt : theme.palette.foliage;
      const bark = texturedMat(barkTexture(theme.palette.trunk));
      const leaf = cutoutMat(blobTexture(ramp, 32, { wobble: 2.4, seed: variant }));
      const leafTop = cutoutMat(blobTexture(ramp, 24, { wobble: 1.8, seed: variant + 5 }));
      return [
        cylPart(bark, { pos: [0, 0.5, 0], rTop: 0.06, rBot: 0.1, h: 1.0 }),
        ...crossedCards(leaf, 4, { y: 1.28, w: 1.25, h: 1.15, spread: 0.07 }),
        ...crossedCards(leafTop, 3, { y: 1.7, w: 0.95, h: 0.85, spread: 0.09 }),
        ...crossedCards(leafTop, 2, { y: 2.0, w: 0.5, h: 0.42, spread: 0.12 }),
      ];
    },
  },

  tree_small: {
    name: 'Sapling',
    footprint: { w: 4, h: 4 },
    solid: true,
    height: 1.3,
    variants: 2,
    randomYaw: true,
    scaleJitter: [0.85, 1.15],
    contactShadow: 0.34,
    build: ({ theme, variant }) => {
      const ramp = variant === 1 ? theme.palette.foliageAlt : theme.palette.foliage;
      const bark = texturedMat(barkTexture(theme.palette.trunk, 6, 12));
      const leaf = cutoutMat(blobTexture(ramp, 24, { wobble: 1.8, seed: variant + 2 }));
      return [
        cylPart(bark, { pos: [0, 0.35, 0], rTop: 0.04, rBot: 0.06, h: 0.7, seg: 5 }),
        ...crossedCards(leaf, 3, { y: 0.85, w: 0.88, h: 0.78, spread: 0.07 }),
        ...crossedCards(leaf, 2, { y: 1.1, w: 0.55, h: 0.48, spread: 0.1 }),
      ];
    },
  },

  tree_pine: {
    name: 'Pine',
    footprint: { w: 5, h: 5 },
    solid: true,
    height: 2.6,
    variants: 2,
    randomYaw: true,
    scaleJitter: [0.9, 1.25],
    contactShadow: 0.42,
    build: ({ theme, variant }) => {
      const ramp = variant === 1 ? theme.palette.foliage : theme.palette.foliageAlt;
      const bark = texturedMat(barkTexture(theme.palette.trunk, 6, 20));
      const needle = solidMat(ramp.dark, 0.9);
      const needleLight = solidMat(ramp.base, 0.9);
      return [
        cylPart(bark, { pos: [0, 0.4, 0], rTop: 0.05, rBot: 0.09, h: 0.8, seg: 5 }),
        conePart(needle, { pos: [0, 0.95, 0], r: 0.5, h: 0.8 }),
        conePart(needleLight, { pos: [0, 1.45, 0], r: 0.4, h: 0.7 }),
        conePart(needle, { pos: [0, 1.9, 0], r: 0.28, h: 0.6 }),
      ];
    },
  },

  tree_palm: {
    name: 'Palm',
    footprint: { w: 5, h: 5 },
    solid: true,
    height: 2.4,
    variants: 2,
    randomYaw: true,
    scaleJitter: [0.9, 1.2],
    contactShadow: 0.4,
    build: ({ theme, variant }) => {
      const bark = texturedMat(barkTexture(theme.palette.wood, 6, 20));
      const frond = cutoutMat(
        blobTexture(theme.palette.foliageAlt, 28, { wobble: 5, shade: 0.2, seed: variant + 9 }),
      );
      const parts = [cylPart(bark, { pos: [0, 0.8, 0], rTop: 0.05, rBot: 0.08, h: 1.6, seg: 5 })];
      // Fronds radiate outward and droop.
      for (let i = 0; i < 6; i++) {
        const yaw = (Math.PI * 2 * i) / 6 + variant * 0.4;
        parts.push(
          card(frond, {
            y: 1.62,
            w: 0.95,
            h: 0.34,
            offset: [Math.cos(yaw) * 0.34, -0.04, Math.sin(yaw) * 0.34],
            tilt: [0.42, -yaw, 0],
          }),
        );
      }
      return parts;
    },
  },

  /* ============================================================== shrubs === */

  bush: {
    name: 'Bush',
    footprint: { w: 3, h: 3 },
    solid: true,
    height: 0.55,
    variants: 3,
    randomYaw: true,
    scaleJitter: [0.85, 1.2],
    contactShadow: 0.26,
    build: ({ theme, variant }) => {
      const ramp = variant === 2 ? theme.palette.foliageAlt : theme.palette.foliage;
      const tex = cutoutMat(blobTexture(ramp, 20, { wobble: 2.2, seed: variant + 20 }));
      return crossedCards(tex, 3, { y: 0.28, w: 0.72, h: 0.56, spread: 0.05 });
    },
  },

  bush_berry: {
    name: 'Berry Bush',
    footprint: { w: 3, h: 3 },
    solid: true,
    height: 0.55,
    variants: 2,
    randomYaw: true,
    contactShadow: 0.26,
    build: ({ theme, variant }) => {
      const leaf = cutoutMat(blobTexture(theme.palette.foliage, 20, { wobble: 2, seed: variant + 30 }));
      const berry = solidMat(theme.palette.accents[variant % theme.palette.accents.length], 0.6);
      return [
        ...crossedCards(leaf, 3, { y: 0.28, w: 0.72, h: 0.56, spread: 0.05 }),
        spherePart(berry, { pos: [0.16, 0.36, 0.1], r: 0.045, castShadow: false }),
        spherePart(berry, { pos: [-0.13, 0.3, -0.08], r: 0.04, castShadow: false }),
        spherePart(berry, { pos: [0.02, 0.42, -0.14], r: 0.038, castShadow: false }),
      ];
    },
  },

  /** Tall grass - the classic encounter-zone marker. Walkable. */
  grass_tuft: {
    name: 'Tall Grass',
    footprint: { w: 2, h: 2 },
    solid: false,
    height: 0.34,
    variants: 3,
    randomYaw: true,
    scaleJitter: [0.9, 1.25],
    build: ({ theme, variant }) => {
      const tex = cutoutMat(
        blobTexture(theme.palette.grass, 16, { wobble: 3.5, shade: 0.6, seed: variant + 40 }),
      );
      return crossedCards(tex, 2, { y: 0.16, w: 0.4, h: 0.32, spread: 0.04 });
    },
  },

  reed: {
    name: 'Reeds',
    footprint: { w: 2, h: 2 },
    solid: false,
    height: 0.5,
    variants: 2,
    randomYaw: true,
    build: ({ theme, variant }) => {
      const tex = cutoutMat(
        blobTexture(theme.palette.foliageAlt, 16, { wobble: 4.5, shade: 0.7, seed: variant + 50 }),
      );
      return crossedCards(tex, 2, { y: 0.26, w: 0.22, h: 0.52, spread: 0.06 });
    },
  },

  /* =============================================================== rocks === */

  rock_small: {
    name: 'Small Rock',
    footprint: { w: 2, h: 2 },
    solid: true,
    height: 0.28,
    variants: 2,
    randomYaw: true,
    scaleJitter: [0.85, 1.15],
    contactShadow: 0.18,
    build: ({ theme, variant }) => {
      const tex = cutoutMat(rockTexture(theme.palette.rock, variant), { metalness: 0.05 });
      return crossedCards(tex, 2, { y: 0.14, w: 0.4, h: 0.28, spread: 0.03 });
    },
  },

  rock_large: {
    name: 'Rock',
    footprint: { w: 4, h: 4 },
    solid: true,
    height: 0.5,
    variants: 2,
    randomYaw: true,
    scaleJitter: [0.9, 1.2],
    contactShadow: 0.3,
    build: ({ theme, variant }) => {
      const tex = cutoutMat(rockTexture(theme.palette.rock, variant, 14, 12), { metalness: 0.05 });
      return crossedCards(tex, 3, { y: 0.24, w: 0.66, h: 0.48, spread: 0.04 });
    },
  },

  boulder: {
    name: 'Boulder',
    footprint: { w: 6, h: 6 },
    solid: true,
    height: 0.9,
    variants: 2,
    randomYaw: true,
    scaleJitter: [0.9, 1.3],
    contactShadow: 0.46,
    build: ({ theme, variant }) => {
      const stone = texturedMat(masonryTexture(theme.palette.rock, 16, 16, 5), { roughness: 0.95 });
      const lean = variant === 1 ? -0.06 : 0.06;
      return [
        spherePart(stone, { pos: [0, 0.3, 0], r: 0.42, squash: 0.8 }),
        spherePart(stone, { pos: [0.16 + lean, 0.5, -0.1], r: 0.24, squash: 0.9 }),
        spherePart(stone, { pos: [-0.18 + lean, 0.42, 0.12], r: 0.2, squash: 0.85 }),
      ];
    },
  },

  /* ============================================================= flowers === */

  flower: {
    name: 'Flower',
    footprint: { w: 1, h: 1 },
    solid: false,
    height: 0.3,
    variants: 6,
    randomYaw: true,
    scaleJitter: [0.85, 1.2],
    build: ({ theme, variant }) => {
      const petal = theme.palette.flowers[variant % theme.palette.flowers.length];
      const tex = cutoutMat(flowerTexture(theme.palette.grass, petal));
      return crossedCards(tex, 2, { y: 0.15, w: 0.2, h: 0.3, spread: 0.02 });
    },
  },

  mushroom: {
    name: 'Mushroom',
    footprint: { w: 1, h: 1 },
    solid: false,
    height: 0.2,
    variants: 2,
    randomYaw: true,
    build: ({ theme, variant }) => {
      const stem = solidMat(theme.palette.wall.lightest, 0.85);
      const cap = solidMat(theme.palette.flowers[variant % theme.palette.flowers.length], 0.75);
      return [
        cylPart(stem, { pos: [0, 0.05, 0], rTop: 0.022, rBot: 0.028, h: 0.1, seg: 5, castShadow: false }),
        spherePart(cap, { pos: [0, 0.12, 0], r: 0.055, squash: 0.6, castShadow: false }),
      ];
    },
  },

  /* ============================================================== fences === */

  fence_wood: {
    name: 'Wooden Fence',
    footprint: { w: 4, h: 1 },
    solid: true,
    height: 0.6,
    variants: 1,
    build: ({ theme }) => {
      const post = texturedMat(barkTexture(theme.palette.wood, 4, 8));
      const rail = texturedMat(plankTexture(theme.palette.wood, 16, 4));
      return [
        boxPart(post, { pos: [-0.22, 0.3, 0], size: [0.055, 0.6, 0.055] }),
        boxPart(post, { pos: [0.22, 0.3, 0], size: [0.055, 0.6, 0.055] }),
        boxPart(rail, { pos: [0, 0.42, 0], size: [0.5, 0.05, 0.035] }),
        boxPart(rail, { pos: [0, 0.24, 0], size: [0.5, 0.05, 0.035] }),
      ];
    },
  },

  fence_stone: {
    name: 'Stone Wall',
    footprint: { w: 4, h: 1 },
    solid: true,
    height: 0.45,
    variants: 1,
    build: ({ theme }) => {
      const stone = texturedMat(masonryTexture(theme.palette.stone, 16, 16, 4));
      return [
        boxPart(stone, { pos: [0, 0.2, 0], size: [0.5, 0.4, 0.12] }),
        boxPart(stone, { pos: [0, 0.42, 0], size: [0.52, 0.05, 0.15] }),
      ];
    },
  },

  /* =========================================================== furniture === */

  sign: {
    name: 'Signpost',
    footprint: { w: 2, h: 2 },
    solid: true,
    height: 0.9,
    variants: 1,
    contactShadow: 0.16,
    build: ({ theme }) => {
      const wood = texturedMat(barkTexture(theme.palette.wood, 6, 12));
      const board = texturedMat(plankTexture(theme.palette.wood, 16, 12));
      return [
        cylPart(wood, { pos: [0, 0.3, 0], rTop: 0.028, rBot: 0.035, h: 0.6, seg: 5 }),
        boxPart(board, { pos: [0, 0.7, 0.015], size: [0.42, 0.28, 0.04] }),
      ];
    },
  },

  lamp_post: {
    name: 'Lamp Post',
    footprint: { w: 2, h: 2 },
    solid: true,
    height: 1.5,
    variants: 1,
    contactShadow: 0.16,
    build: ({ theme }) => {
      const iron = solidMat(theme.palette.stone.darkest, 0.6);
      const glass = solidMat(theme.palette.accents[0], 0.3);
      return [
        cylPart(iron, { pos: [0, 0.6, 0], rTop: 0.022, rBot: 0.04, h: 1.2, seg: 6 }),
        boxPart(iron, { pos: [0, 1.24, 0], size: [0.1, 0.06, 0.1] }),
        boxPart(glass, { pos: [0, 1.36, 0], size: [0.11, 0.18, 0.11], castShadow: false }),
        conePart(iron, { pos: [0, 1.5, 0], r: 0.08, h: 0.1 }),
      ];
    },
  },

  crate: {
    name: 'Crate',
    footprint: { w: 2, h: 2 },
    solid: true,
    height: 0.34,
    variants: 1,
    randomYaw: true,
    contactShadow: 0.2,
    build: ({ theme }) => {
      const wood = texturedMat(plankTexture(theme.palette.wood, 12, 12));
      return [boxPart(wood, { pos: [0, 0.17, 0], size: [0.32, 0.34, 0.32] })];
    },
  },

  barrel: {
    name: 'Barrel',
    footprint: { w: 2, h: 2 },
    solid: true,
    height: 0.4,
    variants: 1,
    randomYaw: true,
    contactShadow: 0.18,
    build: ({ theme }) => {
      const wood = texturedMat(barkTexture(theme.palette.wood, 8, 12));
      const band = solidMat(theme.palette.stone.dark, 0.5);
      return [
        cylPart(wood, { pos: [0, 0.2, 0], rTop: 0.14, rBot: 0.14, h: 0.4, seg: 8 }),
        cylPart(band, { pos: [0, 0.32, 0], rTop: 0.148, rBot: 0.148, h: 0.03, seg: 8, castShadow: false }),
        cylPart(band, { pos: [0, 0.08, 0], rTop: 0.148, rBot: 0.148, h: 0.03, seg: 8, castShadow: false }),
      ];
    },
  },

  stump: {
    name: 'Tree Stump',
    footprint: { w: 3, h: 3 },
    solid: true,
    height: 0.26,
    variants: 1,
    randomYaw: true,
    contactShadow: 0.2,
    build: ({ theme }) => {
      const bark = texturedMat(barkTexture(theme.palette.trunk, 8, 8));
      const rings = solidMat(theme.palette.trunk.light, 0.9);
      return [
        cylPart(bark, { pos: [0, 0.13, 0], rTop: 0.15, rBot: 0.17, h: 0.26, seg: 7 }),
        cylPart(rings, { pos: [0, 0.265, 0], rTop: 0.145, rBot: 0.145, h: 0.02, seg: 7, castShadow: false }),
      ];
    },
  },

  log: {
    name: 'Fallen Log',
    footprint: { w: 5, h: 2 },
    solid: true,
    height: 0.22,
    variants: 1,
    randomYaw: true,
    contactShadow: 0.24,
    build: ({ theme }) => {
      const bark = texturedMat(barkTexture(theme.palette.trunk, 8, 16));
      return [
        {
          geometry: cylGeo(0.11, 0.12, 0.62, 7),
          material: bark,
          position: [0, 0.11, 0],
          rotation: [0, 0, Math.PI / 2],
          castShadow: true,
          receiveShadow: true,
        },
      ];
    },
  },

  well: {
    name: 'Well',
    footprint: { w: 5, h: 5 },
    solid: true,
    height: 1.0,
    variants: 1,
    contactShadow: 0.4,
    build: ({ theme }) => {
      const stone = texturedMat(masonryTexture(theme.palette.stone, 16, 16, 4));
      const wood = texturedMat(plankTexture(theme.palette.wood, 16, 4));
      const roof = texturedMat(plankTexture(theme.palette.roof, 16, 6));
      return [
        cylPart(stone, { pos: [0, 0.16, 0], rTop: 0.3, rBot: 0.32, h: 0.32, seg: 8 }),
        cylPart(solidMat(theme.palette.waterBed.darkest, 1), {
          pos: [0, 0.3, 0],
          rTop: 0.26,
          rBot: 0.26,
          h: 0.02,
          seg: 8,
          castShadow: false,
        }),
        boxPart(wood, { pos: [-0.26, 0.62, 0], size: [0.05, 0.62, 0.05] }),
        boxPart(wood, { pos: [0.26, 0.62, 0], size: [0.05, 0.62, 0.05] }),
        boxPart(roof, { pos: [0, 0.98, 0], size: [0.72, 0.06, 0.5] }),
      ];
    },
  },

  bench: {
    name: 'Bench',
    footprint: { w: 4, h: 2 },
    solid: true,
    height: 0.4,
    variants: 1,
    randomYaw: true,
    contactShadow: 0.24,
    build: ({ theme }) => {
      const wood = texturedMat(plankTexture(theme.palette.wood, 16, 4));
      const iron = solidMat(theme.palette.stone.darkest, 0.6);
      return [
        boxPart(wood, { pos: [0, 0.2, 0], size: [0.52, 0.05, 0.18] }),
        boxPart(wood, { pos: [0, 0.34, -0.08], size: [0.52, 0.18, 0.04] }),
        boxPart(iron, { pos: [-0.2, 0.1, 0], size: [0.04, 0.2, 0.16] }),
        boxPart(iron, { pos: [0.2, 0.1, 0], size: [0.04, 0.2, 0.16] }),
      ];
    },
  },

  /* ========================================================== buildings === */

  /*
   * Houses live in the same registry as every other prop, so there is exactly
   * ONE placement/collision/render path in the whole game. Their footprint here
   * is the authoritative collision box AND drives the visual size, which is what
   * makes them genuinely impassable at the visible wall line (previously the
   * collider was 1.75x1.5 WU while the visual was 3.0x2.4 WU, so you could walk
   * into the walls).
   */
  house_small: {
    name: 'Small House',
    footprint: { w: 16, h: 14 },
    solid: true,
    height: 2.6,
    variants: 2,
    contactShadow: 0,
    build: (ctx) => buildHouse(ctx, 2.0, 1.75, 1.5),
  },

  house_large: {
    name: 'Large House',
    footprint: { w: 22, h: 18 },
    solid: true,
    height: 3.4,
    variants: 2,
    contactShadow: 0,
    build: (ctx) => buildHouse(ctx, 2.75, 2.25, 1.9),
  },

  shop: {
    name: 'Shop',
    footprint: { w: 20, h: 16 },
    solid: true,
    height: 3.0,
    variants: 2,
    contactShadow: 0,
    build: (ctx) => buildHouse(ctx, 2.5, 2.0, 1.7, true),
  },
} satisfies Record<string, PropDef>;

/** Every placeable prop id. Widens automatically when the registry grows. */
export type PropId = keyof typeof REGISTRY;

/** Widened view for consumers, so optional PropDef fields are accessible. */
export const PROP_REGISTRY: Record<PropId, PropDef> = REGISTRY;

export function getPropDef(id: PropId): PropDef {
  return PROP_REGISTRY[id];
}

export const ALL_PROP_IDS = Object.keys(REGISTRY) as PropId[];

/**
 * Shared house builder. Walls/roof/trim are separate meshes with correct
 * outward normals (PLAN.md 7), door and windows inset from the wall face so they
 * cannot z-fight, and dimensions derived from the registered footprint so
 * collision and visuals agree exactly.
 */
function buildHouse(
  { theme, variant }: PropBuildContext,
  w: number,
  d: number,
  wallH: number,
  awning = false,
): PropPart[] {
  const wallRamp = variant === 1 ? theme.palette.wallAlt : theme.palette.wall;
  const roofRamp = variant === 1 ? theme.palette.roofAlt : theme.palette.roof;

  const wallMat = texturedMat(masonryTexture(wallRamp, 16, 16, 4), { roughness: 0.88 });
  const roofMat = texturedMat(shingleTexture(roofRamp, 16, 16, 4), { roughness: 0.85 });
  const trimMat = solidMat(roofRamp.darkest, 0.8);
  const winMat = texturedMat(windowTexture(theme.palette.window), { roughness: 0.4, metalness: 0.1 });
  const doorMat = texturedMat(doorTexture(theme.palette.door, theme.palette.accents[0]));
  const baseMat = texturedMat(masonryTexture(theme.palette.stone, 16, 16, 5));

  const t = 0.1; // wall thickness
  const y0 = 0.09; // plinth height
  const roofH = wallH * 0.45;
  const eave = 0.16;
  const cy = y0 + wallH / 2;

  const parts: PropPart[] = [
    // Plinth
    boxPart(baseMat, { pos: [0, y0 / 2, 0], size: [w + 0.12, y0, d + 0.12] }),

    // Four walls as separate boxes: correct normals on every face, no inverted
    // or vanishing sides as the camera orbits.
    boxPart(wallMat, { pos: [0, cy, d / 2 - t / 2], size: [w, wallH, t] }),
    boxPart(wallMat, { pos: [0, cy, -d / 2 + t / 2], size: [w, wallH, t] }),
    boxPart(wallMat, { pos: [-w / 2 + t / 2, cy, 0], size: [t, wallH, d] }),
    boxPart(wallMat, { pos: [w / 2 - t / 2, cy, 0], size: [t, wallH, d] }),

    // Door and windows sit proud of the wall face by a real distance.
    boxPart(doorMat, { pos: [0, y0 + wallH * 0.3, d / 2 + 0.012], size: [w * 0.2, wallH * 0.6, 0.03] }),
    boxPart(winMat, { pos: [-w * 0.28, y0 + wallH * 0.66, d / 2 + 0.01], size: [w * 0.16, wallH * 0.24, 0.02] }),
    boxPart(winMat, { pos: [w * 0.28, y0 + wallH * 0.66, d / 2 + 0.01], size: [w * 0.16, wallH * 0.24, 0.02] }),
    boxPart(winMat, { pos: [-w / 2 - 0.01, y0 + wallH * 0.6, 0], size: [0.02, wallH * 0.22, d * 0.22] }),
    boxPart(winMat, { pos: [w / 2 + 0.01, y0 + wallH * 0.6, 0], size: [0.02, wallH * 0.22, d * 0.22] }),

    // Eave band, then a hipped roof from four inward-tilted slabs.
    boxPart(trimMat, { pos: [0, y0 + wallH + 0.04, 0], size: [w + eave, 0.08, d + eave] }),
  ];

  const roofY = y0 + wallH + 0.08 + roofH * 0.42;
  const slabT = 0.07;
  parts.push(
    {
      geometry: boxGeoRef(),
      material: roofMat,
      position: [0, roofY, d * 0.26],
      rotation: [0.62, 0, 0],
      scale: [w + eave, slabT, roofH * 0.95],
      castShadow: true,
      receiveShadow: true,
    },
    {
      geometry: boxGeoRef(),
      material: roofMat,
      position: [0, roofY, -d * 0.26],
      rotation: [-0.62, 0, 0],
      scale: [w + eave, slabT, roofH * 0.95],
      castShadow: true,
      receiveShadow: true,
    },
    {
      geometry: boxGeoRef(),
      material: roofMat,
      position: [-w * 0.26, roofY, 0],
      rotation: [0, 0, -0.62],
      scale: [roofH * 0.95, slabT, d + eave],
      castShadow: true,
      receiveShadow: true,
    },
    {
      geometry: boxGeoRef(),
      material: roofMat,
      position: [w * 0.26, roofY, 0],
      rotation: [0, 0, 0.62],
      scale: [roofH * 0.95, slabT, d + eave],
      castShadow: true,
      receiveShadow: true,
    },
    // Ridge cap
    boxPart(trimMat, { pos: [0, y0 + wallH + roofH * 0.86, 0], size: [w * 0.3, 0.09, d * 0.3] }),
  );

  if (awning) {
    parts.push(
      boxPart(trimMat, { pos: [0, y0 + wallH * 0.82, d / 2 + 0.22], size: [w * 0.9, 0.05, 0.44] }),
    );
  } else {
    // Chimney
    parts.push(
      boxPart(baseMat, { pos: [w * 0.28, y0 + wallH + roofH * 0.9, -d * 0.18], size: [0.2, 0.5, 0.2] }),
      boxPart(trimMat, { pos: [w * 0.28, y0 + wallH + roofH * 1.18, -d * 0.18], size: [0.26, 0.06, 0.26] }),
    );
  }

  return parts;
}
