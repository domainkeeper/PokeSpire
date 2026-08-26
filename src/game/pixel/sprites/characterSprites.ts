import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from '../PixelCanvas';

export function makePlayerSprite(dir: 'down' | 'up' | 'left' | 'right' = 'down'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 24);

  // hair (dark brown, spiky)
  pixelRect(ctx, 4, 0, 8, 4, '#4e342e');
  pixelRect(ctx, 3, 1, 2, 5, '#4e342e');
  pixelRect(ctx, 11, 1, 2, 5, '#4e342e');
  pixelRect(ctx, 5, 0, 2, 1, '#3e2723');
  pixelRect(ctx, 9, 0, 2, 1, '#3e2723');

  // head (warm skin)
  pixelRect(ctx, 4, 3, 8, 7, '#ffcc80');

  // eyes (anime-style, large)
  if (dir === 'down') {
    pixelRect(ctx, 5, 5, 3, 3, '#1a237e');
    pixelRect(ctx, 9, 5, 3, 3, '#1a237e');
    pixelRect(ctx, 6, 5, 2, 2, '#3f51b5');
    pixelRect(ctx, 10, 5, 2, 2, '#3f51b5');
    pixelRect(ctx, 5, 5, 1, 1, '#fff');
    pixelRect(ctx, 9, 5, 1, 1, '#fff');
    pixelRect(ctx, 7, 8, 2, 1, '#e57373');
  } else if (dir === 'up') {
    pixelRect(ctx, 4, 4, 8, 3, '#4e342e');
  } else if (dir === 'left') {
    pixelRect(ctx, 4, 5, 3, 3, '#1a237e');
    pixelRect(ctx, 5, 5, 2, 2, '#3f51b5');
    pixelRect(ctx, 4, 5, 1, 1, '#fff');
  } else {
    pixelRect(ctx, 9, 5, 3, 3, '#1a237e');
    pixelRect(ctx, 10, 5, 2, 2, '#3f51b5');
    pixelRect(ctx, 12, 5, 1, 1, '#fff');
  }

  // body (blue jacket)
  pixelRect(ctx, 3, 10, 10, 6, '#1e88e5');
  pixelRect(ctx, 4, 11, 2, 4, '#e3f2fd');
  pixelRect(ctx, 10, 11, 2, 4, '#e3f2fd');

  // arms
  pixelRect(ctx, 1, 10, 2, 5, '#ffcc80');
  pixelRect(ctx, 13, 10, 2, 5, '#ffcc80');

  // shorts
  pixelRect(ctx, 4, 16, 8, 3, '#0d47a1');

  // legs
  pixelRect(ctx, 5, 19, 2, 4, '#ffcc80');
  pixelRect(ctx, 9, 19, 2, 4, '#ffcc80');

  // shoes (red)
  pixelRect(ctx, 4, 22, 3, 2, '#c62828');
  pixelRect(ctx, 9, 22, 3, 2, '#c62828');

  const tex = createPixelTexture(c, `player-v2-${dir}`);
  tex.needsUpdate = true;
  return tex;
}

export function makeNpcSprite(color: string = '#7b1fa2'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 24);

  // hat
  pixelRect(ctx, 3, 0, 10, 3, '#4a148c');
  pixelRect(ctx, 2, 2, 12, 2, '#6a1b9a');
  pixelRect(ctx, 4, 0, 8, 1, '#9c27b0');

  // head
  pixelRect(ctx, 4, 4, 8, 6, '#ffcc80');

  // eyes (anime)
  pixelRect(ctx, 5, 5, 3, 3, '#1a237e');
  pixelRect(ctx, 9, 5, 3, 3, '#1a237e');
  pixelRect(ctx, 6, 5, 2, 2, '#5c6bc0');
  pixelRect(ctx, 10, 5, 2, 2, '#5c6bc0');
  pixelRect(ctx, 5, 5, 1, 1, '#fff');
  pixelRect(ctx, 9, 5, 1, 1, '#fff');

  // smile
  pixelRect(ctx, 7, 8, 2, 1, '#e57373');

  // body
  pixelRect(ctx, 3, 10, 10, 6, color);
  pixelRect(ctx, 5, 11, 6, 4, '#ce93d8');

  // arms
  pixelRect(ctx, 1, 10, 2, 5, '#ffcc80');
  pixelRect(ctx, 13, 10, 2, 5, '#ffcc80');

  // pants
  pixelRect(ctx, 4, 16, 8, 3, '#4a148c');

  // legs
  pixelRect(ctx, 5, 19, 2, 4, '#ffcc80');
  pixelRect(ctx, 9, 19, 2, 4, '#ffcc80');

  // shoes
  pixelRect(ctx, 4, 22, 3, 2, '#3e2723');
  pixelRect(ctx, 9, 22, 3, 2, '#3e2723');

  const tex = createPixelTexture(c, `npc-v2-${color}`);
  tex.needsUpdate = true;
  return tex;
}
