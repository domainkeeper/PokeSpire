import * as THREE from 'three';

const cache = new Map<string, THREE.DataTexture>();

function createGradient(colors: string[]): THREE.DataTexture {
  const key = colors.join(',');
  if (cache.has(key)) return cache.get(key)!;

  const size = colors.length;
  const data = new Uint8Array(size * 4);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i, 0, 1, 1);
  });
  const imgData = ctx.getImageData(0, 0, size, 1);
  data.set(imgData.data);

  const tex = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

export const GRASS_GRADIENT = createGradient(['#5cb85c', '#4caf50', '#388e3c', '#2e7d32']);
export const TREE_GRADIENT = createGradient(['#2e7d32', '#1b5e20', '#0d3d10', '#0a2e0c']);
export const TRUNK_GRADIENT = createGradient(['#8d6e63', '#6d4c41', '#5d4037', '#4e342e']);
export const ROCK_GRADIENT = createGradient(['#bdbdbd', '#9e9e9e', '#757575', '#616161']);
export const PATH_GRADIENT = createGradient(['#d7ccc8', '#bcaaa4', '#a1887f', '#8d6e63']);
export const WATER_GRADIENT = createGradient(['#4fc3f7', '#29b6f6', '#0288d1', '#01579b']);
export const BUILDING_GRADIENT = createGradient(['#ef5350', '#c62828', '#b71c1c', '#880e0e']);
export const BUILDING2_GRADIENT = createGradient(['#42a5f5', '#1565c0', '#0d47a1', '#0a3470']);
export const FLOWER_GRADIENT = createGradient(['#f48fb1', '#ec407a', '#d81b60', '#ad1457']);
export const FENCE_GRADIENT = createGradient(['#bcaaa4', '#a1887f', '#8d6e63', '#6d4c41']);
export const PLAYER_GRADIENT = createGradient(['#42a5f5', '#1e88e5', '#1565c0', '#0d47a1']);
export const SKIN_GRADIENT = createGradient(['#ffcc80', '#ffb74d', '#ffa726', '#ff9800']);
export const SIGN_GRADIENT = createGradient(['#ffe082', '#ffc107', '#ff8f00', '#ff6f00']);
export const NPC_GRADIENT = createGradient(['#ab47bc', '#7b1fa2', '#6a1b9a', '#4a148c']);

export function makeToonMat(color: string, gradient: THREE.DataTexture) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradient });
}
