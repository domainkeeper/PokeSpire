import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from '../PixelCanvas';

export function makeTreeSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(24, 36);

  // shadow
  pixelRect(ctx, 3, 32, 18, 4, 'rgba(0,0,0,0.12)');

  // trunk
  pixelRect(ctx, 10, 22, 4, 14, '#8d6e63');
  pixelRect(ctx, 11, 22, 2, 14, '#6d4c41');
  pixelRect(ctx, 10, 22, 1, 14, '#a1887f');
  pixelRect(ctx, 13, 22, 1, 14, '#795548');

  // leaves bottom (wide)
  pixelRect(ctx, 1, 14, 22, 10, '#2e7d32');
  pixelRect(ctx, 0, 16, 24, 6, '#1b5e20');

  // leaves mid
  pixelRect(ctx, 2, 8, 20, 12, '#388e3c');
  pixelRect(ctx, 3, 9, 18, 10, '#43a047');

  // leaves top
  pixelRect(ctx, 4, 3, 16, 9, '#66bb6a');
  pixelRect(ctx, 5, 2, 14, 6, '#81c784');
  pixelRect(ctx, 7, 1, 10, 4, '#a5d6a7');
  pixelRect(ctx, 9, 0, 6, 2, '#c8e6c9');

  // anime highlights
  pixelRect(ctx, 4, 10, 3, 3, '#c8e6c9');
  pixelRect(ctx, 15, 12, 3, 3, '#c8e6c9');
  pixelRect(ctx, 10, 5, 4, 2, '#a5d6a7');
  pixelRect(ctx, 6, 17, 2, 2, '#e8f5e9');
  pixelRect(ctx, 17, 8, 2, 2, '#e8f5e9');

  // dark leaf clusters for depth
  pixelRect(ctx, 2, 16, 3, 3, '#1b5e20');
  pixelRect(ctx, 18, 15, 3, 3, '#1b5e20');
  pixelRect(ctx, 8, 10, 3, 2, '#2e7d32');

  const tex = createPixelTexture(c, 'tree-v4');
  tex.needsUpdate = true;
  return tex;
}

export function makeSmallTreeSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 26);

  pixelRect(ctx, 2, 22, 12, 4, 'rgba(0,0,0,0.10)');

  pixelRect(ctx, 6, 16, 4, 10, '#8d6e63');
  pixelRect(ctx, 7, 16, 2, 10, '#6d4c41');

  pixelRect(ctx, 0, 8, 16, 10, '#388e3c');
  pixelRect(ctx, 1, 9, 14, 8, '#43a047');
  pixelRect(ctx, 2, 5, 12, 8, '#66bb6a');
  pixelRect(ctx, 3, 3, 10, 6, '#81c784');
  pixelRect(ctx, 5, 2, 6, 3, '#a5d6a7');
  pixelRect(ctx, 6, 1, 4, 2, '#c8e6c9');

  pixelRect(ctx, 3, 11, 2, 2, '#c8e6c9');
  pixelRect(ctx, 10, 9, 2, 2, '#e8f5e9');
  pixelRect(ctx, 7, 6, 2, 2, '#a5d6a7');

  pixelRect(ctx, 1, 10, 2, 3, '#2e7d32');
  pixelRect(ctx, 13, 11, 2, 3, '#1b5e20');

  const tex = createPixelTexture(c, 'small-tree-v4');
  tex.needsUpdate = true;
  return tex;
}

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

  const tex = createPixelTexture(c, 'bush-v4');
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

  const tex = createPixelTexture(c, 'rock-v4');
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

  const tex = createPixelTexture(c, `flower-v4-${color}`);
  tex.needsUpdate = true;
  return tex;
}

export function makeGrassTuftSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(10, 8);

  pixelRect(ctx, 1, 3, 2, 5, '#43a047');
  pixelRect(ctx, 4, 2, 2, 6, '#66bb6a');
  pixelRect(ctx, 7, 3, 2, 5, '#81c784');

  pixelRect(ctx, 0, 5, 1, 3, '#2e7d32');
  pixelRect(ctx, 9, 5, 1, 3, '#2e7d32');

  const tex = createPixelTexture(c, 'grass-tuft-v4');
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

  const tex = createPixelTexture(c, 'fence-v4');
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

  const tex = createPixelTexture(c, 'sign-v4');
  tex.needsUpdate = true;
  return tex;
}

export function makeWaterSprite(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(20, 20);

  pixelRect(ctx, 0, 0, 20, 20, '#1565c0');
  pixelRect(ctx, 0, 0, 20, 4, '#1e88e5');
  pixelRect(ctx, 0, 6, 20, 4, '#1976d2');
  pixelRect(ctx, 0, 12, 20, 4, '#1565c0');
  pixelRect(ctx, 0, 16, 20, 4, '#0d47a1');

  pixelRect(ctx, 2, 2, 5, 2, '#42a5f5');
  pixelRect(ctx, 12, 1, 5, 2, '#64b5f6');
  pixelRect(ctx, 7, 8, 5, 2, '#90caf9');
  pixelRect(ctx, 15, 7, 4, 2, '#42a5f5');
  pixelRect(ctx, 1, 14, 6, 2, '#42a5f5');
  pixelRect(ctx, 10, 13, 5, 2, '#64b5f6');

  pixelRect(ctx, 5, 3, 2, 1, '#e1f5fe');
  pixelRect(ctx, 14, 2, 2, 1, '#bbdefb');
  pixelRect(ctx, 9, 9, 2, 1, '#e1f5fe');
  pixelRect(ctx, 3, 15, 2, 1, '#bbdefb');
  pixelRect(ctx, 16, 14, 2, 1, '#e1f5fe');

  pixelRect(ctx, 0, 5, 20, 1, '#0d47a1');
  pixelRect(ctx, 0, 11, 20, 1, '#0d47a1');
  pixelRect(ctx, 0, 17, 20, 1, '#0a3878');

  const tex = createPixelTexture(c, 'water-v4');
  tex.needsUpdate = true;
  return tex;
}

export function makeBuildingSprite(variant: 'red' | 'blue' = 'red'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(28, 34);

  const roofColor = variant === 'red' ? '#c62828' : '#1565c0';
  const roofLight = variant === 'red' ? '#ef5350' : '#42a5f5';
  const roofDark = variant === 'red' ? '#880e0e' : '#0d47a1';
  const wallColor = variant === 'red' ? '#fff8e1' : '#e3f2fd';
  const wallShade = variant === 'red' ? '#ffe0b2' : '#bbdefb';
  const wallHighlight = variant === 'red' ? '#fffde7' : '#e8f4fd';
  const windowColor = variant === 'red' ? '#4fc3f7' : '#90caf9';
  const windowLight = variant === 'red' ? '#b3e5fc' : '#e3f2fd';

  pixelRect(ctx, 0, 30, 28, 4, 'rgba(0,0,0,0.12)');

  // roof
  pixelRect(ctx, 1, 7, 26, 2, roofDark);
  pixelRect(ctx, 2, 5, 24, 3, roofColor);
  pixelRect(ctx, 3, 4, 22, 2, roofLight);
  pixelRect(ctx, 5, 3, 18, 2, roofColor);
  pixelRect(ctx, 7, 2, 14, 2, roofLight);
  pixelRect(ctx, 9, 1, 10, 2, roofColor);
  pixelRect(ctx, 11, 0, 6, 1, roofLight);

  pixelRect(ctx, 1, 9, 26, 1, '#fff');

  // walls
  pixelRect(ctx, 2, 10, 24, 19, wallColor);
  pixelRect(ctx, 2, 10, 2, 19, wallShade);
  pixelRect(ctx, 24, 10, 2, 19, wallShade);
  pixelRect(ctx, 2, 10, 24, 2, wallHighlight);

  // door
  pixelRect(ctx, 12, 22, 4, 7, '#5d4037');
  pixelRect(ctx, 13, 23, 2, 6, '#4e342e');
  pixelRect(ctx, 15, 25, 1, 1, '#ffc107');

  // windows
  pixelRect(ctx, 3, 14, 6, 6, windowColor);
  pixelRect(ctx, 4, 14, 4, 3, windowLight);
  pixelRect(ctx, 19, 14, 6, 6, windowColor);
  pixelRect(ctx, 20, 14, 4, 3, windowLight);

  pixelRect(ctx, 3, 14, 6, 1, '#fff');
  pixelRect(ctx, 3, 14, 1, 6, '#fff');
  pixelRect(ctx, 19, 14, 6, 1, '#fff');
  pixelRect(ctx, 24, 14, 1, 6, '#fff');

  pixelRect(ctx, 3, 19, 6, 1, '#bdbdbd');
  pixelRect(ctx, 19, 19, 6, 1, '#bdbdbd');
  pixelRect(ctx, 5, 14, 1, 6, '#bdbdbd');
  pixelRect(ctx, 21, 14, 1, 6, '#bdbdbd');

  if (variant === 'red') {
    pixelRect(ctx, 21, 0, 3, 7, '#8d6e63');
    pixelRect(ctx, 20, 0, 5, 1, '#6d4c41');
    pixelRect(ctx, 22, 0, 1, 1, '#a1887f');
  }

  const tex = createPixelTexture(c, `building-v4-${variant}`);
  tex.needsUpdate = true;
  return tex;
}
