import * as THREE from 'three';
import type { PropPart } from './InstancedProps';

/**
 * Reusable geometry/material builders for props.
 *
 * All geometry is a shared module-level singleton; size is baked into each
 * part's local scale. That keeps every prop instanceable (one draw call per part
 * for the whole map) and means a new prop costs zero new GPU resources.
 */

let _plane: THREE.PlaneGeometry | null = null;
export function planeGeo(): THREE.PlaneGeometry {
  if (!_plane) _plane = new THREE.PlaneGeometry(1, 1);
  return _plane;
}

let _box: THREE.BoxGeometry | null = null;
export function boxGeo(): THREE.BoxGeometry {
  if (!_box) _box = new THREE.BoxGeometry(1, 1, 1);
  return _box;
}

const cylCache = new Map<string, THREE.CylinderGeometry>();
export function cylGeo(rTop: number, rBot: number, h: number, seg = 6): THREE.CylinderGeometry {
  const k = `${rTop},${rBot},${h},${seg}`;
  let g = cylCache.get(k);
  if (!g) {
    g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
    cylCache.set(k, g);
  }
  return g;
}

let _cone: THREE.ConeGeometry | null = null;
export function coneGeo(): THREE.ConeGeometry {
  if (!_cone) _cone = new THREE.ConeGeometry(0.5, 1, 7);
  return _cone;
}

let _sphere: THREE.SphereGeometry | null = null;
export function sphereGeo(): THREE.SphereGeometry {
  if (!_sphere) _sphere = new THREE.SphereGeometry(0.5, 8, 6);
  return _sphere;
}

/**
 * Alpha-cutout material in the OPAQUE pass.
 *
 * transparent:false + alphaTest + depthWrite:true means the depth buffer sorts
 * these correctly from any camera angle. The old setup used transparent +
 * depthWrite:false + a renderOrder derived from static map coordinates, which
 * mis-sorted the moment the camera moved.
 */
export function cutoutMat(
  tex: THREE.Texture,
  opts: { roughness?: number; metalness?: number; doubleSide?: boolean } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tex,
    transparent: false,
    alphaTest: 0.5,
    depthWrite: true,
    side: opts.doubleSide === false ? THREE.FrontSide : THREE.DoubleSide,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0,
  });
}

export function texturedMat(
  tex: THREE.Texture,
  opts: { roughness?: number; metalness?: number } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: opts.roughness ?? 0.9,
    metalness: opts.metalness ?? 0,
  });
}

export function solidMat(color: string, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

/* --------------------------------------------------------------- parts ---- */

export interface CardOpts {
  y: number;
  w: number;
  h: number;
  /** Extra offset from the prop origin. */
  offset?: readonly [number, number, number];
  /** Tilt in radians, applied around X then Y then Z. */
  tilt?: readonly [number, number, number];
  castShadow?: boolean;
}

export function card(mat: THREE.Material, o: CardOpts): PropPart {
  const off = o.offset ?? [0, 0, 0];
  const tilt = o.tilt ?? [0, 0, 0];
  return {
    geometry: planeGeo(),
    material: mat,
    position: [off[0], o.y + off[1], off[2]],
    rotation: tilt,
    scale: [o.w, o.h, 1],
    castShadow: o.castShadow ?? false,
  };
}

/**
 * A "billboard cloud": N non-coplanar cards fanned around the Y axis.
 *
 * This is what gives foliage genuine 3D volume - orbiting the camera reveals a
 * different silhouette instead of the card flipping to an edge-on line
 * (PLAN.md 6). Cheap: a handful of quads, all instanced.
 */
export function crossedCards(
  mat: THREE.Material,
  count: number,
  o: CardOpts & { spread?: number },
): PropPart[] {
  const out: PropPart[] = [];
  const spread = o.spread ?? 0.06;
  for (let i = 0; i < count; i++) {
    const yaw = (Math.PI * i) / count;
    out.push(
      card(mat, {
        ...o,
        tilt: [Math.sin(i * 1.7) * spread, yaw, Math.cos(i * 2.3) * spread],
      }),
    );
  }
  return out;
}

export interface BoxOpts {
  pos: readonly [number, number, number];
  size: readonly [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function boxPart(mat: THREE.Material, o: BoxOpts): PropPart {
  return {
    geometry: boxGeo(),
    material: mat,
    position: o.pos,
    scale: o.size,
    castShadow: o.castShadow ?? true,
    receiveShadow: o.receiveShadow ?? true,
  };
}

export function cylPart(
  mat: THREE.Material,
  o: {
    pos: readonly [number, number, number];
    rTop: number;
    rBot: number;
    h: number;
    seg?: number;
    castShadow?: boolean;
  },
): PropPart {
  return {
    geometry: cylGeo(o.rTop, o.rBot, o.h, o.seg ?? 6),
    material: mat,
    position: o.pos,
    castShadow: o.castShadow ?? true,
    receiveShadow: true,
  };
}

export function conePart(
  mat: THREE.Material,
  o: { pos: readonly [number, number, number]; r: number; h: number; castShadow?: boolean },
): PropPart {
  return {
    geometry: coneGeo(),
    material: mat,
    position: o.pos,
    scale: [o.r * 2, o.h, o.r * 2],
    castShadow: o.castShadow ?? true,
    receiveShadow: true,
  };
}

export function spherePart(
  mat: THREE.Material,
  o: { pos: readonly [number, number, number]; r: number; squash?: number; castShadow?: boolean },
): PropPart {
  const s = o.squash ?? 1;
  return {
    geometry: sphereGeo(),
    material: mat,
    position: o.pos,
    scale: [o.r * 2, o.r * 2 * s, o.r * 2],
    castShadow: o.castShadow ?? true,
    receiveShadow: true,
  };
}
