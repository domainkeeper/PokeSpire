import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from '../PixelCanvas';

export function makeTreeSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(20, 28);

  // trunk
  pixelRect(ctx, 8, 18, 4, 10, '#8d6e63');
  pixelRect(ctx, 9, 18, 2, 10, '#6d4c41');

  // leaves bottom (wider)
  pixelRect(ctx, 2, 10, 16, 10, '#2e7d32');
  pixelRect(ctx, 1, 12, 18, 6, '#1b5e20');

  // leaves mid
  pixelRect(ctx, 3, 5, 14, 10, '#388e3c');
  pixelRect(ctx, 4, 6, 12, 8, '#43a047');

  // leaves top
  pixelRect(ctx, 5, 2, 10, 6, '#66bb6a');
  pixelRect(ctx, 6, 1, 8, 4, '#81c784');
  pixelRect(ctx, 8, 0, 4, 3, '#a5d6a7');

  // highlights (anime-style shine)
  pixelRect(ctx, 5, 7, 2, 2, '#c8e6c9');
  pixelRect(ctx, 12, 9, 2, 2, '#c8e6c9');
  pixelRect(ctx, 9, 4, 3, 2, '#a5d6a7');

  // shadow underneath
  pixelRect(ctx, 4, 26, 12, 2, 'rgba(0,0,0,0.15)');

  const tex = createPixelTexture(c, 'tree-v2');
  tex.needsUpdate = true;
  return tex;
}

export function makeSmallTreeSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(14, 20);

  pixelRect(ctx, 5, 14, 4, 6, '#8d6e63');
  pixelRect(ctx, 6, 14, 2, 6, '#6d4c41');

  pixelRect(ctx, 1, 6, 12, 10, '#388e3c');
  pixelRect(ctx, 2, 7, 10, 7, '#43a047');
  pixelRect(ctx, 3, 3, 8, 7, '#66bb6a');
  pixelRect(ctx, 4, 2, 6, 4, '#81c784');
  pixelRect(ctx, 5, 1, 4, 3, '#a5d6a7');

  pixelRect(ctx, 4, 8, 2, 2, '#c8e6c9');

  const tex = createPixelTexture(c, 'small-tree-v2');
  tex.needsUpdate = true;
  return tex;
}

export function makeBushSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(14, 10);

  pixelRect(ctx, 1, 3, 12, 7, '#2e7d32');
  pixelRect(ctx, 2, 2, 10, 7, '#388e3c');
  pixelRect(ctx, 3, 1, 8, 6, '#43a047');
  pixelRect(ctx, 4, 0, 6, 4, '#66bb6a');

  pixelRect(ctx, 4, 4, 2, 2, '#a5d6a7');
  pixelRect(ctx, 9, 3, 2, 2, '#c8e6c9');

  const tex = createPixelTexture(c, 'bush-v2');
  tex.needsUpdate = true;
  return tex;
}

export function makeRockSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(12, 10);

  pixelRect(ctx, 1, 3, 10, 7, '#78909c');
  pixelRect(ctx, 2, 2, 8, 7, '#90a4ae');
  pixelRect(ctx, 3, 1, 6, 5, '#b0bec5');
  pixelRect(ctx, 4, 0, 4, 3, '#cfd8dc');

  pixelRect(ctx, 2, 7, 3, 3, '#546e7a');
  pixelRect(ctx, 7, 6, 3, 4, '#455a64');

  // anime highlight
  pixelRect(ctx, 4, 2, 2, 2, '#eceff1');

  const tex = createPixelTexture(c, 'rock-v2');
  tex.needsUpdate = true;
  return tex;
}

export function makeFlowerSprite(color: string = '#f48fb1'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 10);

  pixelRect(ctx, 3, 5, 2, 5, '#4caf50');
  pixelRect(ctx, 2, 4, 4, 2, '#66bb6a');

  pixelRect(ctx, 2, 0, 4, 4, color);
  pixelRect(ctx, 1, 1, 6, 2, color);
  pixelRect(ctx, 3, 1, 2, 2, '#fff9c4');

  const tex = createPixelTexture(c, `flower-v2-${color}`);
  tex.needsUpdate = true;
  return tex;
}

export function makeGrassTuftSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 6);

  pixelRect(ctx, 1, 2, 2, 4, '#66bb6a');
  pixelRect(ctx, 3, 1, 2, 5, '#81c784');
  pixelRect(ctx, 5, 2, 2, 4, '#a5d6a7');

  const tex = createPixelTexture(c, 'grass-tuft-v2');
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

  const tex = createPixelTexture(c, 'fence-v2');
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

  const tex = createPixelTexture(c, 'sign-v2');
  tex.needsUpdate = true;
  return tex;
}

export function makeWaterSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 16);

  pixelRect(ctx, 0, 0, 16, 16, '#039be5');
  pixelRect(ctx, 0, 0, 16, 4, '#29b6f6');
  pixelRect(ctx, 2, 2, 4, 2, '#4fc3f7');
  pixelRect(ctx, 10, 4, 4, 2, '#4fc3f7');
  pixelRect(ctx, 6, 8, 4, 2, '#81d4fa');
  pixelRect(ctx, 12, 10, 3, 1, '#b3e5fc');
  pixelRect(ctx, 1, 12, 5, 2, '#0277bd');
  pixelRect(ctx, 9, 13, 4, 2, '#01579b');

  // animated sparkle
  pixelRect(ctx, 4, 3, 1, 1, '#e1f5fe');
  pixelRect(ctx, 11, 7, 1, 1, '#e1f5fe');

  const tex = createPixelTexture(c, 'water-v2');
  tex.needsUpdate = true;
  return tex;
}

export function makeBuildingSprite(variant: 'red' | 'blue' = 'red'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(24, 28);

  const roofColor = variant === 'red' ? '#c62828' : '#1565c0';
  const roofLight = variant === 'red' ? '#ef5350' : '#42a5f5';
  const roofDark = variant === 'red' ? '#880e0e' : '#0d47a1';
  const wallColor = variant === 'red' ? '#fff8e1' : '#e3f2fd';
  const wallShade = variant === 'red' ? '#ffe0b2' : '#bbdefb';
  const windowColor = variant === 'red' ? '#4fc3f7' : '#90caf9';
  const windowLight = variant === 'red' ? '#b3e5fc' : '#e3f2fd';

  // roof (steep pitch)
  pixelRect(ctx, 1, 5, 22, 2, roofDark);
  pixelRect(ctx, 2, 3, 20, 3, roofColor);
  pixelRect(ctx, 3, 2, 18, 2, roofLight);
  pixelRect(ctx, 5, 1, 14, 2, roofColor);
  pixelRect(ctx, 7, 0, 10, 2, roofLight);
  pixelRect(ctx, 9, 0, 6, 1, '#fff');

  // roof trim
  pixelRect(ctx, 1, 7, 22, 1, '#fff');

  // walls
  pixelRect(ctx, 2, 8, 20, 17, wallColor);
  pixelRect(ctx, 2, 8, 2, 17, wallShade);
  pixelRect(ctx, 20, 8, 2, 17, wallShade);

  // door
  pixelRect(ctx, 10, 19, 4, 6, '#5d4037');
  pixelRect(ctx, 11, 20, 2, 4, '#4e342e');
  pixelRect(ctx, 13, 22, 1, 1, '#ffc107');

  // windows
  pixelRect(ctx, 3, 12, 5, 5, windowColor);
  pixelRect(ctx, 4, 12, 3, 2, windowLight);
  pixelRect(ctx, 16, 12, 5, 5, windowColor);
  pixelRect(ctx, 17, 12, 3, 2, windowLight);

  // window frames
  pixelRect(ctx, 3, 12, 5, 1, '#fff');
  pixelRect(ctx, 3, 12, 1, 5, '#fff');
  pixelRect(ctx, 16, 12, 5, 1, '#fff');
  pixelRect(ctx, 20, 12, 1, 5, '#fff');

  // chimney (red only)
  if (variant === 'red') {
    pixelRect(ctx, 18, 0, 3, 5, '#8d6e63');
    pixelRect(ctx, 17, 0, 5, 1, '#6d4c41');
  }

  // ground shadow
  pixelRect(ctx, 0, 25, 24, 3, 'rgba(0,0,0,0.12)');

  const tex = createPixelTexture(c, `building-v2-${variant}`);
  tex.needsUpdate = true;
  return tex;
}
