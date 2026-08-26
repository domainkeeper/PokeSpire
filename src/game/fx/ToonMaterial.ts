import * as THREE from 'three';

let _gradientMap: THREE.DataTexture | null = null;

export function getToonGradientMap(): THREE.DataTexture {
  if (_gradientMap) return _gradientMap;
  const data = new Uint8Array([60, 120, 180, 240]);
  _gradientMap = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  _gradientMap.minFilter = THREE.NearestFilter;
  _gradientMap.magFilter = THREE.NearestFilter;
  _gradientMap.needsUpdate = true;
  return _gradientMap;
}

const matCache = new Map<string, THREE.MeshToonMaterial>();

export function getToonMat(color: string, opts?: { transparent?: boolean; opacity?: number }): THREE.MeshToonMaterial {
  const key = `${color}-${opts?.transparent ?? false}-${opts?.opacity ?? 1}`;
  if (matCache.has(key)) return matCache.get(key)!;
  const mat = new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: getToonGradientMap(),
    transparent: opts?.transparent,
    opacity: opts?.opacity,
    side: THREE.FrontSide,
  });
  matCache.set(key, mat);
  return mat;
}
