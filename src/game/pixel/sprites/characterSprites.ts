import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from '../PixelCanvas';

export function makePlayerSprite(dir: 'down' | 'up' | 'left' | 'right' = 'down'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 24);

  // hair
  pixelRect(ctx, 4, 0, 8, 4, '#5d4037');
  pixelRect(ctx, 3, 1, 2, 5, '#5d4037');
  pixelRect(ctx, 11, 1, 2, 5, '#5d4037');

  // head
  pixelRect(ctx, 4, 3, 8, 7, '#ffcc80');

  // eyes
  if (dir === 'down') {
    pixelRect(ctx, 5, 6, 2, 2, '#1a237e');
    pixelRect(ctx, 9, 6, 2, 2, '#1a237e');
    pixelRect(ctx, 6, 6, 1, 1, '#fff');
    pixelRect(ctx, 10, 6, 1, 1, '#fff');
  } else if (dir === 'up') {
    pixelRect(ctx, 5, 5, 6, 2, '#5d4037');
  } else if (dir === 'left') {
    pixelRect(ctx, 4, 6, 2, 2, '#1a237e');
    pixelRect(ctx, 5, 6, 1, 1, '#fff');
  } else {
    pixelRect(ctx, 10, 6, 2, 2, '#1a237e');
    pixelRect(ctx, 10, 6, 1, 1, '#fff');
  }

  // mouth
  if (dir === 'down') {
    pixelRect(ctx, 7, 9, 2, 1, '#e57373');
  }

  // body / shirt
  pixelRect(ctx, 3, 10, 10, 6, '#42a5f5');
  pixelRect(ctx, 4, 11, 2, 4, '#fff');
  pixelRect(ctx, 10, 11, 2, 4, '#fff');

  // arms
  pixelRect(ctx, 1, 10, 2, 5, '#ffcc80');
  pixelRect(ctx, 13, 10, 2, 5, '#ffcc80');

  // shorts
  pixelRect(ctx, 4, 16, 8, 3, '#1565c0');

  // legs
  pixelRect(ctx, 5, 19, 2, 4, '#ffcc80');
  pixelRect(ctx, 9, 19, 2, 4, '#ffcc80');

  // shoes
  pixelRect(ctx, 4, 22, 3, 2, '#5d4037');
  pixelRect(ctx, 9, 22, 3, 2, '#5d4037');

  const tex = createPixelTexture(c, `player-${dir}`);
  tex.needsUpdate = true;
  return tex;
}

export function makeNpcSprite(color: string = '#7b1fa2'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 24);

  // hat
  pixelRect(ctx, 3, 0, 10, 3, '#4a148c');
  pixelRect(ctx, 2, 2, 12, 2, '#6a1b9a');

  // head
  pixelRect(ctx, 4, 4, 8, 6, '#ffcc80');

  // eyes
  pixelRect(ctx, 5, 6, 2, 2, '#1a237e');
  pixelRect(ctx, 9, 6, 2, 2, '#1a237e');
  pixelRect(ctx, 6, 6, 1, 1, '#fff');
  pixelRect(ctx, 10, 6, 1, 1, '#fff');

  // smile
  pixelRect(ctx, 7, 9, 2, 1, '#e57373');

  // body
  pixelRect(ctx, 3, 10, 10, 6, color);
  pixelRect(ctx, 5, 11, 6, 4, '#9c27b0');

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

  const tex = createPixelTexture(c, `npc-${color}`);
  tex.needsUpdate = true;
  return tex;
}
