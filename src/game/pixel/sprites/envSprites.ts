import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from '../PixelCanvas';

export function makeTreeSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 24);

  // trunk
  pixelRect(ctx, 6, 16, 4, 8, '#8d6e63');
  pixelRect(ctx, 7, 16, 2, 8, '#6d4c41');

  // leaves bottom
  pixelRect(ctx, 2, 8, 12, 10, '#388e3c');
  pixelRect(ctx, 1, 10, 14, 6, '#2e7d32');

  // leaves mid
  pixelRect(ctx, 3, 4, 10, 8, '#43a047');
  pixelRect(ctx, 4, 5, 8, 6, '#4caf50');

  // leaves top
  pixelRect(ctx, 5, 1, 6, 5, '#66bb6a');
  pixelRect(ctx, 6, 0, 4, 3, '#81c784');

  // highlights
  pixelRect(ctx, 4, 6, 2, 2, '#a5d6a7');
  pixelRect(ctx, 10, 8, 2, 2, '#a5d6a7');

  const tex = createPixelTexture(c, 'tree');
  tex.needsUpdate = true;
  return tex;
}

export function makeSmallTreeSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(12, 18);

  pixelRect(ctx, 4, 12, 4, 6, '#8d6e63');
  pixelRect(ctx, 5, 12, 2, 6, '#6d4c41');

  pixelRect(ctx, 1, 5, 10, 8, '#43a047');
  pixelRect(ctx, 2, 6, 8, 5, '#4caf50');
  pixelRect(ctx, 3, 2, 6, 5, '#66bb6a');
  pixelRect(ctx, 4, 1, 4, 3, '#81c784');

  pixelRect(ctx, 3, 7, 2, 2, '#a5d6a7');

  const tex = createPixelTexture(c, 'small-tree');
  tex.needsUpdate = true;
  return tex;
}

export function makeBushSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(12, 8);

  pixelRect(ctx, 1, 2, 10, 6, '#43a047');
  pixelRect(ctx, 2, 1, 8, 6, '#4caf50');
  pixelRect(ctx, 3, 0, 6, 4, '#66bb6a');

  pixelRect(ctx, 3, 3, 2, 2, '#81c784');
  pixelRect(ctx, 8, 4, 2, 1, '#a5d6a7');

  const tex = createPixelTexture(c, 'bush');
  tex.needsUpdate = true;
  return tex;
}

export function makeRockSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(10, 8);

  pixelRect(ctx, 1, 2, 8, 6, '#9e9e9e');
  pixelRect(ctx, 2, 1, 6, 6, '#bdbdbd');
  pixelRect(ctx, 3, 0, 4, 4, '#e0e0e0');

  pixelRect(ctx, 2, 5, 2, 2, '#757575');
  pixelRect(ctx, 6, 4, 2, 3, '#616161');

  const tex = createPixelTexture(c, 'rock');
  tex.needsUpdate = true;
  return tex;
}

export function makeFlowerSprite(color: string = '#f48fb1'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 10);

  pixelRect(ctx, 3, 5, 2, 5, '#66bb6a');
  pixelRect(ctx, 2, 3, 4, 3, '#81c784');

  pixelRect(ctx, 2, 0, 4, 4, color);
  pixelRect(ctx, 1, 1, 6, 2, color);
  pixelRect(ctx, 3, 1, 2, 2, '#fff9c4');

  const tex = createPixelTexture(c, `flower-${color}`);
  tex.needsUpdate = true;
  return tex;
}

export function makeGrassTuftSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 6);

  pixelRect(ctx, 1, 2, 2, 4, '#66bb6a');
  pixelRect(ctx, 3, 1, 2, 5, '#81c784');
  pixelRect(ctx, 5, 2, 2, 4, '#a5d6a7');

  const tex = createPixelTexture(c, 'grass-tuft');
  tex.needsUpdate = true;
  return tex;
}

export function makeFenceSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 8);

  pixelRect(ctx, 0, 3, 16, 2, '#a1887f');
  pixelRect(ctx, 1, 1, 2, 6, '#8d6e63');
  pixelRect(ctx, 13, 1, 2, 6, '#8d6e63');
  pixelRect(ctx, 7, 1, 2, 6, '#8d6e63');

  pixelRect(ctx, 0, 2, 16, 1, '#bcaaa4');
  pixelRect(ctx, 0, 5, 16, 1, '#6d4c41');

  const tex = createPixelTexture(c, 'fence');
  tex.needsUpdate = true;
  return tex;
}

export function makeSignSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(10, 14);

  pixelRect(ctx, 4, 8, 2, 6, '#6d4c41');
  pixelRect(ctx, 1, 1, 8, 8, '#ffc107');
  pixelRect(ctx, 2, 2, 6, 6, '#ffe082');
  pixelRect(ctx, 3, 3, 4, 1, '#ff8f00');
  pixelRect(ctx, 3, 5, 4, 1, '#ff8f00');

  const tex = createPixelTexture(c, 'sign');
  tex.needsUpdate = true;
  return tex;
}

export function makeWaterSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 16);

  pixelRect(ctx, 0, 0, 16, 16, '#29b6f6');
  pixelRect(ctx, 0, 0, 16, 4, '#4fc3f7');
  pixelRect(ctx, 2, 2, 4, 2, '#81d4fa');
  pixelRect(ctx, 10, 4, 4, 2, '#81d4fa');
  pixelRect(ctx, 6, 8, 4, 2, '#b3e5fc');
  pixelRect(ctx, 12, 10, 3, 1, '#b3e5fc');
  pixelRect(ctx, 1, 12, 5, 2, '#0288d1');
  pixelRect(ctx, 9, 13, 4, 2, '#0277bd');

  const tex = createPixelTexture(c, 'water');
  tex.needsUpdate = true;
  return tex;
}

export function makeBuildingSprite(variant: 'red' | 'blue' = 'red'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(20, 24);

  const roofColor = variant === 'red' ? '#c62828' : '#1565c0';
  const roofLight = variant === 'red' ? '#e53935' : '#1e88e5';
  const roofDark = variant === 'red' ? '#880e0e' : '#0d47a1';
  const windowColor = '#4fc3f7';
  const windowLight = '#b3e5fc';
  const doorColor = '#5d4037';

  // roof
  pixelRect(ctx, 1, 4, 18, 2, roofDark);
  pixelRect(ctx, 2, 2, 16, 3, roofColor);
  pixelRect(ctx, 3, 1, 14, 2, roofLight);
  pixelRect(ctx, 5, 0, 10, 2, roofColor);
  pixelRect(ctx, 7, 0, 6, 1, roofLight);

  // roof trim
  pixelRect(ctx, 1, 6, 18, 1, '#fff');

  // walls
  pixelRect(ctx, 2, 7, 16, 15, '#efebe9');
  pixelRect(ctx, 2, 7, 2, 15, '#d7ccc8');
  pixelRect(ctx, 16, 7, 2, 15, '#d7ccc8');

  // door
  pixelRect(ctx, 8, 16, 4, 6, doorColor);
  pixelRect(ctx, 9, 17, 2, 4, '#4e342e');
  pixelRect(ctx, 11, 19, 1, 1, '#ffc107');

  // windows
  pixelRect(ctx, 3, 10, 4, 4, windowColor);
  pixelRect(ctx, 4, 10, 2, 2, windowLight);
  pixelRect(ctx, 13, 10, 4, 4, windowColor);
  pixelRect(ctx, 14, 10, 2, 2, windowLight);

  // window frames
  pixelRect(ctx, 3, 10, 4, 1, '#fff');
  pixelRect(ctx, 3, 10, 1, 4, '#fff');
  pixelRect(ctx, 13, 10, 4, 1, '#fff');
  pixelRect(ctx, 16, 10, 1, 4, '#fff');

  // ground shadow
  pixelRect(ctx, 0, 22, 20, 2, '#d7ccc8');

  const tex = createPixelTexture(c, `building-${variant}`);
  tex.needsUpdate = true;
  return tex;
}
