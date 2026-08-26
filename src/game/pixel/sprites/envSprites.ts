import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from '../PixelCanvas';

export function makeBushSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 12);

  pixelRect(ctx, 0, 9, 16, 3, 'rgba(0,0,0,0.08)');

  pixelRect(ctx, 1, 4, 14, 8, '#2e7d32');
  pixelRect(ctx, 2, 3, 12, 8, '#388e3c');
  pixelRect(ctx, 3, 2, 10, 7, '#43a047');
  pixelRect(ctx, 4, 1, 8, 5, '#66bb6a');
  pixelRect(ctx, 5, 0, 6, 3, '#81c784');

  pixelRect(ctx, 5, 5, 2, 2, '#a5d6a7');
  pixelRect(ctx, 10, 4, 2, 2, '#c8e6c9');
  pixelRect(ctx, 7, 2, 2, 2, '#e8f5e9');
  pixelRect(ctx, 2, 6, 2, 2, '#1b5e20');
  pixelRect(ctx, 12, 6, 2, 2, '#1b5e20');

  const tex = createPixelTexture(c, 'bush-v5');
  tex.needsUpdate = true;
  return tex;
}

export function makeRockSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(14, 12);

  pixelRect(ctx, 1, 9, 12, 3, 'rgba(0,0,0,0.10)');

  pixelRect(ctx, 1, 4, 12, 8, '#78909c');
  pixelRect(ctx, 2, 3, 10, 8, '#90a4ae');
  pixelRect(ctx, 3, 2, 8, 6, '#b0bec5');
  pixelRect(ctx, 4, 1, 6, 4, '#cfd8dc');

  pixelRect(ctx, 2, 8, 4, 4, '#546e7a');
  pixelRect(ctx, 8, 7, 4, 5, '#455a64');

  pixelRect(ctx, 4, 3, 3, 2, '#eceff1');
  pixelRect(ctx, 6, 2, 2, 1, '#fff');

  pixelRect(ctx, 1, 6, 2, 2, '#37474f');
  pixelRect(ctx, 10, 5, 2, 3, '#37474f');

  const tex = createPixelTexture(c, 'rock-v5');
  tex.needsUpdate = true;
  return tex;
}

export function makeFlowerSprite(color: string = '#f48fb1'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(10, 12);

  pixelRect(ctx, 4, 7, 2, 5, '#388e3c');
  pixelRect(ctx, 3, 6, 4, 2, '#43a047');
  pixelRect(ctx, 5, 8, 1, 3, '#2e7d32');

  pixelRect(ctx, 3, 0, 4, 5, color);
  pixelRect(ctx, 2, 1, 6, 3, color);
  pixelRect(ctx, 4, 2, 2, 2, '#fff9c4');
  pixelRect(ctx, 3, 1, 1, 1, '#fff');
  pixelRect(ctx, 6, 1, 1, 1, '#fff');

  pixelRect(ctx, 2, 0, 1, 1, '#c2185b');
  pixelRect(ctx, 7, 0, 1, 1, '#c2185b');

  const tex = createPixelTexture(c, `flower-v5-${color}`);
  tex.needsUpdate = true;
  return tex;
}

export function makeFenceSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(20, 10);

  pixelRect(ctx, 0, 4, 20, 3, '#a1887f');
  pixelRect(ctx, 0, 3, 20, 1, '#bcaaa4');
  pixelRect(ctx, 0, 7, 20, 1, '#6d4c41');

  pixelRect(ctx, 1, 0, 3, 9, '#8d6e63');
  pixelRect(ctx, 8, 0, 3, 9, '#8d6e63');
  pixelRect(ctx, 16, 0, 3, 9, '#8d6e63');

  pixelRect(ctx, 1, 0, 3, 1, '#a1887f');
  pixelRect(ctx, 8, 0, 3, 1, '#a1887f');
  pixelRect(ctx, 16, 0, 3, 1, '#a1887f');

  pixelRect(ctx, 0, 3, 20, 1, 'rgba(255,255,255,0.12)');

  const tex = createPixelTexture(c, 'fence-v5');
  tex.needsUpdate = true;
  return tex;
}

export function makeSignSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(12, 16);

  pixelRect(ctx, 5, 10, 2, 6, '#6d4c41');
  pixelRect(ctx, 5, 10, 2, 1, '#8d6e63');

  pixelRect(ctx, 1, 1, 10, 10, '#ffc107');
  pixelRect(ctx, 2, 2, 8, 8, '#ffe082');
  pixelRect(ctx, 3, 3, 6, 1, '#ff8f00');
  pixelRect(ctx, 3, 5, 6, 1, '#ff8f00');
  pixelRect(ctx, 3, 7, 6, 1, '#ff8f00');

  pixelRect(ctx, 1, 1, 10, 1, '#f9a825');
  pixelRect(ctx, 1, 10, 10, 1, '#f57f17');
  pixelRect(ctx, 1, 1, 1, 10, '#f9a825');
  pixelRect(ctx, 10, 1, 1, 10, '#f57f17');

  pixelRect(ctx, 3, 4, 6, 1, '#e65100');
  pixelRect(ctx, 3, 6, 6, 1, '#e65100');
  pixelRect(ctx, 3, 8, 6, 1, '#e65100');

  const tex = createPixelTexture(c, 'sign-v5');
  tex.needsUpdate = true;
  return tex;
}
