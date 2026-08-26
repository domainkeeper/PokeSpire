import * as THREE from 'three';
import { makeCanvas, createPixelTexture } from '../pixel/PixelCanvas';
import type { PropPart } from './InstancedProps';

/*
 * Environment props as instanceable PropParts (see InstancedProps).
 *
 * The bush texture generator previously called ctx.getImageData(x, y, 1, 1) once
 * per pixel in a 14x12 loop - 168 readback calls per texture. It now tracks
 * coverage in a plain array instead.
 */

let _unitPlane: THREE.PlaneGeometry | null = null;
function unitPlane(): THREE.PlaneGeometry {
  if (!_unitPlane) _unitPlane = new THREE.PlaneGeometry(1, 1);
  return _unitPlane;
}

let _unitBox: THREE.BoxGeometry | null = null;
function unitBox(): THREE.BoxGeometry {
  if (!_unitBox) _unitBox = new THREE.BoxGeometry(1, 1, 1);
  return _unitBox;
}

/** Cutout material in the opaque pass so the depth buffer sorts it correctly. */
function cutoutMaterial(
  tex: THREE.Texture,
  roughness = 0.85,
  metalness = 0,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tex,
    transparent: false,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    depthWrite: true,
    roughness,
    metalness,
  });
}

function makeBushTexture(variant: number): THREE.CanvasTexture {
  const W = 14;
  const H = 12;
  const [c, ctx] = makeCanvas(W, H);
  ctx.imageSmoothingEnabled = false;

  const palettes = [
    { dark: '#2a5a2a', base: '#3a6a3a', mid: '#427242', light: '#4a7a4a', bright: '#5a8a5a', highlight: '#6a9a6a' },
    { dark: '#285828', base: '#386838', mid: '#407040', light: '#487848', bright: '#588858', highlight: '#689868' },
    { dark: '#2c5c2c', base: '#3c6c3c', mid: '#447444', light: '#4c7c4c', bright: '#5c8c5c', highlight: '#6c9c6c' },
  ];
  const p = palettes[variant % palettes.length];

  const shapeSeed = variant * 17;
  const blobs = 3 + (shapeSeed % 3);
  const covered = new Uint8Array(W * H);

  for (let i = 0; i < blobs; i++) {
    const bx = 3 + ((shapeSeed + i * 7) % 8);
    const by = 4 + ((shapeSeed + i * 11) % 5);
    const bw = 3 + ((shapeSeed + i * 13) % 3);
    const bh = 2 + ((shapeSeed + i * 3) % 3);

    for (let dy = 0; dy < bh; dy++) {
      for (let dx = 0; dx < bw; dx++) {
        const px = bx + dx;
        const py = by + dy;
        if (px < 0 || px >= W || py < 0 || py >= H) continue;
        const edgeDist = Math.min(dx, dy, bw - 1 - dx, bh - 1 - dy);
        if (edgeDist === 0 && (px * 3 + py * 7 + shapeSeed) % 3 === 0) continue;
        const ci = (dx + dy + shapeSeed) % 5;
        ctx.fillStyle = ci < 1 ? p.dark : ci < 3 ? p.base : ci < 4 ? p.mid : p.light;
        ctx.fillRect(px, py, 1, 1);
        covered[py * W + px] = 1;
      }
    }
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!covered[y * W + x]) continue;
      if ((x * 7 + y * 13 + shapeSeed) % 9 < 2) {
        ctx.fillStyle = p.bright;
        ctx.fillRect(x, y, 1, 1);
      }
      if ((x * 5 + y * 11 + shapeSeed) % 13 < 1) {
        ctx.fillStyle = p.highlight;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return createPixelTexture(c, `bush-v${variant}`);
}

function makeRockTexture(variant: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(12, 10);
  ctx.imageSmoothingEnabled = false;

  const baseColor = variant % 2 === 0 ? '#78909c' : '#607d8b';
  const lightColor = variant % 2 === 0 ? '#b0bec5' : '#90a4ae';
  const darkColor = variant % 2 === 0 ? '#546e7a' : '#455a64';

  for (const blob of [
    { x: 2, y: 3, w: 8, h: 5 },
    { x: 3, y: 2, w: 6, h: 4 },
    { x: 4, y: 1, w: 4, h: 3 },
  ]) {
    for (let dy = 0; dy < blob.h; dy++) {
      for (let dx = 0; dx < blob.w; dx++) {
        const px = blob.x + dx;
        const py = blob.y + dy;
        if (px >= 12 || py >= 10) continue;
        const edgeDist = Math.min(dx, dy, blob.w - 1 - dx, blob.h - 1 - dy);
        if (edgeDist === 0 && (px * 3 + py * 7 + variant) % 3 === 0) continue;
        const ci = (dx + dy + variant) % 4;
        ctx.fillStyle = ci < 1 ? darkColor : ci < 3 ? baseColor : lightColor;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  ctx.fillStyle = '#eceff1';
  ctx.fillRect(4 + (variant % 2), 2, 2, 1);
  ctx.fillRect(6, 1 + (variant % 2), 1, 1);

  return createPixelTexture(c, `rock-v${variant}`);
}

function makeFlowerTexture(color: string): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 12);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#388e3c';
  ctx.fillRect(3, 6, 2, 6);
  ctx.fillStyle = '#43a047';
  ctx.fillRect(2, 5, 4, 2);
  ctx.fillStyle = color;
  ctx.fillRect(2, 0, 4, 5);
  ctx.fillRect(1, 1, 6, 3);
  ctx.fillStyle = '#fff9c4';
  ctx.fillRect(3, 2, 2, 2);
  return createPixelTexture(c, `flower-tex-${color}`);
}

function solid(color: string, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

/* ---------------------------------------------------------------- bushes --- */

let _bushParts: PropPart[][] | null = null;
/** Three visual variants; caller picks by index so bushes are not all identical. */
export function getBushParts(variant: number): PropPart[] {
  if (!_bushParts) {
    _bushParts = [0, 1, 2].map((v) => {
      const mat = cutoutMaterial(makeBushTexture(v));
      const plane = unitPlane();
      const s = 0.85 + v * 0.15;
      const rotOffset = v * 0.3;
      return [
        { geometry: plane, material: mat, position: [0, 0.3 * s, 0], rotation: [0.03, rotOffset, 0], scale: [0.7 * s, 0.55 * s, 1] },
        { geometry: plane, material: mat, position: [0, 0.3 * s, 0], rotation: [0.02, Math.PI / 3 + rotOffset, -0.01], scale: [0.7 * s, 0.55 * s, 1] },
        { geometry: plane, material: mat, position: [0, 0.3 * s, 0], rotation: [-0.02, -Math.PI / 3 + rotOffset, 0.01], scale: [0.7 * s, 0.55 * s, 1] },
      ] satisfies PropPart[];
    });
  }
  return _bushParts[Math.abs(variant) % 3];
}

/* ----------------------------------------------------------------- rocks --- */

let _rockParts: PropPart[][] | null = null;
export function getRockParts(variant: number): PropPart[] {
  if (!_rockParts) {
    _rockParts = [0, 1].map((v) => {
      const mat = cutoutMaterial(makeRockTexture(v), 0.9, 0.05);
      const plane = unitPlane();
      const s = 0.9 + v * 0.2;
      return [
        { geometry: plane, material: mat, position: [0, 0.2 * s, 0], scale: [0.6 * s, 0.45 * s, 1] },
        { geometry: plane, material: mat, position: [0, 0.2 * s, 0], rotation: [0, Math.PI / 2, 0], scale: [0.5 * s, 0.45 * s, 1] },
      ] satisfies PropPart[];
    });
  }
  return _rockParts[Math.abs(variant) % 2];
}

/* --------------------------------------------------------------- flowers --- */

let _flowerParts: PropPart[] | null = null;
export function getFlowerParts(): PropPart[] {
  if (!_flowerParts) {
    const mat = cutoutMaterial(makeFlowerTexture('#c9908a'));
    _flowerParts = [
      { geometry: unitPlane(), material: mat, position: [0, 0.25, 0], scale: [0.2, 0.3, 1] },
    ];
  }
  return _flowerParts;
}

/* ---------------------------------------------------------------- fences --- */

let _fenceParts: PropPart[] | null = null;
export function getFenceParts(): PropPart[] {
  if (_fenceParts) return _fenceParts;

  const [pc, pctx] = makeCanvas(4, 8);
  pctx.imageSmoothingEnabled = false;
  pctx.fillStyle = '#8d6e63';
  pctx.fillRect(0, 0, 4, 8);
  pctx.fillStyle = '#a1887f';
  pctx.fillRect(1, 0, 2, 8);
  pctx.fillStyle = '#6d4c41';
  pctx.fillRect(0, 0, 1, 8);
  const postMat = new THREE.MeshStandardMaterial({
    map: createPixelTexture(pc, 'fence-post'),
    roughness: 0.9,
    metalness: 0,
  });

  const [rc, rctx] = makeCanvas(12, 2);
  rctx.imageSmoothingEnabled = false;
  rctx.fillStyle = '#a1887f';
  rctx.fillRect(0, 0, 12, 2);
  rctx.fillStyle = '#bcaaa4';
  rctx.fillRect(0, 0, 12, 1);
  rctx.fillStyle = '#6d4c41';
  rctx.fillRect(0, 1, 12, 1);
  const railMat = new THREE.MeshStandardMaterial({
    map: createPixelTexture(rc, 'fence-rail'),
    roughness: 0.9,
    metalness: 0,
  });

  const box = unitBox();
  _fenceParts = [
    { geometry: box, material: postMat, position: [-0.4, 0.35, 0], scale: [0.06, 0.7, 0.06], castShadow: true },
    { geometry: box, material: postMat, position: [0, 0.35, 0], scale: [0.06, 0.7, 0.06], castShadow: true },
    { geometry: box, material: postMat, position: [0.4, 0.35, 0], scale: [0.06, 0.7, 0.06], castShadow: true },
    { geometry: box, material: railMat, position: [0, 0.4, 0], scale: [0.9, 0.05, 0.04] },
    { geometry: box, material: railMat, position: [0, 0.22, 0], scale: [0.9, 0.05, 0.04] },
  ];
  return _fenceParts;
}

/* ----------------------------------------------------------------- signs --- */

let _signParts: PropPart[] | null = null;
export function getSignParts(): PropPart[] {
  if (_signParts) return _signParts;

  const [c, ctx] = makeCanvas(8, 8);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#d4a840';
  ctx.fillRect(0, 0, 8, 8);
  ctx.fillStyle = '#e0c070';
  ctx.fillRect(1, 1, 6, 6);
  ctx.fillStyle = '#b08830';
  ctx.fillRect(2, 2, 4, 1);
  ctx.fillRect(2, 4, 4, 1);
  ctx.fillRect(2, 6, 4, 1);
  ctx.fillStyle = '#c89838';
  ctx.fillRect(0, 0, 8, 1);
  ctx.fillRect(0, 0, 1, 8);
  ctx.fillStyle = '#a08028';
  ctx.fillRect(0, 7, 8, 1);
  ctx.fillRect(7, 0, 1, 8);

  const boardMat = new THREE.MeshStandardMaterial({
    map: createPixelTexture(c, 'sign-board-v2'),
    roughness: 0.85,
    metalness: 0,
  });

  _signParts = [
    {
      geometry: new THREE.CylinderGeometry(0.03, 0.04, 0.6, 5),
      material: solid('#6d4c41'),
      position: [0, 0.3, 0],
      castShadow: true,
    },
    { geometry: unitPlane(), material: boardMat, position: [0, 0.7, 0.02], scale: [0.45, 0.4, 1] },
  ];
  return _signParts;
}
