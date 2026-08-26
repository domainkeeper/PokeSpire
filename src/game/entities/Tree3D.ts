import * as THREE from 'three';
import { makeCanvas, createPixelTexture } from '../pixel/PixelCanvas';
import type { PropPart } from './InstancedProps';

/*
 * Trees are defined as reusable PropParts, not React components.
 *
 * Previously every tree instance re-rasterised three leaf canvases and allocated
 * four fresh MeshStandardMaterials, so 640 trees meant ~2,560 materials, ~8,300
 * meshes and 640x redundant canvas work. Everything below is a module-level
 * singleton created lazily once, then instanced (see InstancedProps).
 */

function makeLeafTexture(
  baseColor: string,
  lightColor: string,
  darkColor: string,
  size: number,
): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size, size);
  ctx.imageSmoothingEnabled = false;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= r) continue;

      const angle = Math.atan2(dy, dx);
      const effectiveR = r + Math.sin(angle * 5) * 2 + Math.cos(angle * 3) * 1.5;
      if (dist > effectiveR) continue;

      const noise = (x * 7 + y * 13 + size) % 9;
      ctx.fillStyle = noise < 2 ? lightColor : noise < 5 ? baseColor : darkColor;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return createPixelTexture(c, `leaf-${baseColor}-${size}`);
}

function makeSmallLeafTexture(
  baseColor: string,
  lightColor: string,
  darkColor: string,
  size: number,
): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size, size);
  ctx.imageSmoothingEnabled = false;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= r) continue;

      const angle = Math.atan2(dy, dx);
      const effectiveR = r + Math.sin(angle * 4) * 1.5;
      if (dist > effectiveR) continue;

      const noise = (x * 5 + y * 11 + size) % 7;
      ctx.fillStyle = noise < 2 ? lightColor : noise < 4 ? baseColor : darkColor;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return createPixelTexture(c, `sleaf-${baseColor}-${size}`);
}

function makeTrunkTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 16);
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 8; x++) {
      const noise = (x * 3 + y * 7) % 5;
      ctx.fillStyle =
        x === 0 || x === 7 ? '#3e2723' : noise < 1 ? '#5d4037' : noise < 2 ? '#6d4c41' : '#4e342e';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return createPixelTexture(c, 'trunk-v2');
}

/** Shared unit plane; foliage size is baked into each part's local scale. */
let _unitPlane: THREE.PlaneGeometry | null = null;
function unitPlane(): THREE.PlaneGeometry {
  if (!_unitPlane) _unitPlane = new THREE.PlaneGeometry(1, 1);
  return _unitPlane;
}

/**
 * Foliage uses alphaTest in the *opaque* pass (transparent: false,
 * depthWrite: true) so the depth buffer resolves overlap correctly. The old
 * setup used transparent + depthWrite:false + a renderOrder derived from static
 * map coordinates, which sorted wrongly as soon as the camera moved.
 */
function leafMaterial(tex: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tex,
    transparent: false,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    depthWrite: true,
    roughness: 0.85,
    metalness: 0,
  });
}

interface TreeAssets {
  trunkGeo: THREE.CylinderGeometry;
  trunkMat: THREE.MeshStandardMaterial;
  main: THREE.MeshStandardMaterial;
  side1: THREE.MeshStandardMaterial;
  side2: THREE.MeshStandardMaterial;
}

let _tree: TreeAssets | null = null;
function treeAssets(): TreeAssets {
  if (!_tree) {
    _tree = {
      trunkGeo: new THREE.CylinderGeometry(0.06, 0.09, 1.0, 6),
      trunkMat: new THREE.MeshStandardMaterial({
        map: makeTrunkTexture(),
        roughness: 0.9,
        metalness: 0,
      }),
      main: leafMaterial(makeLeafTexture('#3a6a3a', '#5a8a5a', '#2a5a2a', 32)),
      side1: leafMaterial(makeLeafTexture('#3e6e3e', '#5e8e5e', '#2e5e2e', 26)),
      side2: leafMaterial(makeLeafTexture('#427242', '#629262', '#326232', 22)),
    };
  }
  return _tree;
}

let _treeParts: PropPart[] | null = null;
export function getTreeParts(): PropPart[] {
  if (_treeParts) return _treeParts;
  const a = treeAssets();
  const plane = unitPlane();

  const canopy = (
    mat: THREE.MeshStandardMaterial,
    y: number,
    w: number,
    h: number,
    rot: readonly [number, number, number],
    offset: readonly [number, number, number] = [0, 0, 0],
  ): PropPart => ({
    geometry: plane,
    material: mat,
    position: [offset[0], y + offset[1], offset[2]],
    rotation: rot,
    scale: [w, h, 1],
    // Foliage no longer casts shadows: ~8k alpha-tested planes in the shadow
    // pass was the single biggest cost, for a barely visible result.
    castShadow: false,
  });

  _treeParts = [
    {
      geometry: a.trunkGeo,
      material: a.trunkMat,
      position: [0, 0.5, 0],
      castShadow: true,
      receiveShadow: true,
    },
    canopy(a.main, 1.25, 1.2, 1.1, [0.08, 0, 0.03]),
    canopy(a.side1, 1.25, 1.2, 1.1, [0.05, Math.PI / 5, -0.02]),
    canopy(a.side2, 1.25, 1.2, 1.1, [-0.04, -Math.PI / 5, 0.02]),
    canopy(a.side1, 1.25, 1.2, 1.1, [0.03, Math.PI * 0.4, 0.01]),
    canopy(a.side2, 1.25, 1.2, 1.1, [-0.02, -Math.PI * 0.4, -0.03]),
    canopy(a.side1, 1.65, 0.9, 0.8, [0.1, 0.2, 0], [0.05, 0, 0]),
    canopy(a.side1, 1.65, 0.9, 0.8, [-0.05, Math.PI / 4, 0.06], [-0.03, 0, 0.04]),
    canopy(a.side2, 1.65, 0.9, 0.8, [0.04, -Math.PI / 4, -0.03], [0.02, 0, -0.03]),
    canopy(a.main, 1.65, 0.9, 0.8, [0.06, Math.PI / 2, 0.02]),
    canopy(a.main, 1.95, 0.5, 0.4, [0.08, 0.5, 0], [0.1, 0, 0.02]),
    canopy(a.side1, 1.92, 0.4, 0.35, [-0.03, 1.2, 0.04], [-0.05, 0, 0.06]),
  ];
  return _treeParts;
}

interface SmallTreeAssets {
  trunkGeo: THREE.CylinderGeometry;
  trunkMat: THREE.MeshStandardMaterial;
  main: THREE.MeshStandardMaterial;
  side: THREE.MeshStandardMaterial;
}

let _smallTree: SmallTreeAssets | null = null;
function smallTreeAssets(): SmallTreeAssets {
  if (!_smallTree) {
    _smallTree = {
      trunkGeo: new THREE.CylinderGeometry(0.04, 0.06, 0.7, 5),
      trunkMat: new THREE.MeshStandardMaterial({
        color: '#6d4c41',
        roughness: 0.9,
        metalness: 0,
      }),
      main: leafMaterial(makeSmallLeafTexture('#3e6e3e', '#5e8e5e', '#2e5e2e', 26)),
      side: leafMaterial(makeSmallLeafTexture('#427242', '#629262', '#326232', 20)),
    };
  }
  return _smallTree;
}

let _smallTreeParts: PropPart[] | null = null;
export function getSmallTreeParts(): PropPart[] {
  if (_smallTreeParts) return _smallTreeParts;
  const a = smallTreeAssets();
  const plane = unitPlane();

  const canopy = (
    mat: THREE.MeshStandardMaterial,
    y: number,
    w: number,
    h: number,
    rot: readonly [number, number, number],
    offset: readonly [number, number, number] = [0, 0, 0],
  ): PropPart => ({
    geometry: plane,
    material: mat,
    position: [offset[0], y + offset[1], offset[2]],
    rotation: rot,
    scale: [w, h, 1],
    castShadow: false,
  });

  _smallTreeParts = [
    {
      geometry: a.trunkGeo,
      material: a.trunkMat,
      position: [0, 0.35, 0],
      castShadow: true,
      receiveShadow: true,
    },
    canopy(a.main, 0.82, 0.85, 0.75, [0.06, 0, 0.03]),
    canopy(a.side, 0.82, 0.85, 0.75, [0.04, Math.PI / 3, -0.02]),
    canopy(a.side, 0.82, 0.85, 0.75, [-0.03, -Math.PI / 3, 0.02]),
    canopy(a.main, 0.82, 0.85, 0.75, [0.02, Math.PI / 2, 0.01]),
    canopy(a.main, 1.08, 0.55, 0.5, [0.05, 0.3, 0], [0.03, 0, 0.02]),
    canopy(a.side, 1.06, 0.45, 0.4, [-0.02, Math.PI / 4, 0.03], [-0.02, 0, 0.03]),
  ];
  return _smallTreeParts;
}
