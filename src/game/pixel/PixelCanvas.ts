import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

export function createPixelTexture(
  canvas: HTMLCanvasElement,
  key?: string,
): THREE.CanvasTexture {
  const k = key || canvas.toDataURL().slice(0, 50);
  if (textureCache.has(k)) return textureCache.get(k)!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(k, tex);
  return tex;
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

export function pixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
