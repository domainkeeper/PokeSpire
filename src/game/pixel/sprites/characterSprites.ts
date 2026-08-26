import * as THREE from 'three';
import { makeCanvas, createPixelTexture } from '../PixelCanvas';

export type Dir8 = 'down' | 'down_right' | 'right' | 'up_right' | 'up' | 'up_left' | 'left' | 'down_left';
export type AnimState = 'idle' | 'walk';
export type WalkFrame = 0 | 1 | 2 | 3;

const SPRITE_W = 20;
const SPRITE_H = 28;
const cache = new Map<string, THREE.CanvasTexture>();

function drawCharacterBase(
  ctx: CanvasRenderingContext2D,
  dir: Dir8,
  frame: WalkFrame,
  skinColor: string,
  hairColor: string,
  jacketColor: string,
  jacketAccent: string,
  shortsColor: string,
  shoeColor: string,
) {
  const isFront = dir === 'down' || dir === 'down_right' || dir === 'down_left';
  const isBack = dir === 'up' || dir === 'up_right' || dir === 'up_left';
  const isRight = dir === 'right' || dir === 'down_right' || dir === 'up_right';
  const isLeft = dir === 'left' || dir === 'down_left' || dir === 'up_left';
  const isDiag = dir.includes('_');

  const p = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };

  const armSwing = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const legOffset1 = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const legOffset2 = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const bobY = frame === 1 ? -1 : frame === 3 ? 0 : 0;

  if (isBack) {
    p(6, 0, 8, 5, hairColor);
    p(5, 1, 2, 5, hairColor);
    p(13, 1, 2, 5, hairColor);
    p(6, 5, 8, 2, hairColor);
    p(5, 4, 10, 3, hairColor);
    p(4, 2, 12, 5, hairColor);

    p(5, 7, 10, 6, jacketColor);
    p(6, 8, 8, 4, jacketAccent);

    p(3, 7 + armSwing, 2, 5, skinColor);
    p(15, 7 - armSwing, 2, 5, skinColor);

    p(5, 13, 10, 3, shortsColor);
    p(6, 16 + bobY, 3, 5, skinColor);
    p(11, 16 + bobY, 3, 5, skinColor);
    p(5, 20 + bobY + legOffset1, 4, 2, shoeColor);
    p(11, 20 + bobY + legOffset2, 4, 2, shoeColor);
  } else if (isFront) {
    p(5, 0, 10, 3, hairColor);
    p(4, 1, 2, 6, hairColor);
    p(14, 1, 2, 6, hairColor);
    p(5, 1, 10, 2, hairColor);

    p(5, 3, 10, 6, skinColor);

    if (isRight && !isLeft) {
      p(10, 4, 4, 3, '#1a237e');
      p(11, 4, 3, 2, '#3f51b5');
      p(10, 4, 1, 1, '#fff');
      p(13, 5, 2, 2, skinColor);
    } else if (isLeft && !isRight) {
      p(6, 4, 4, 3, '#1a237e');
      p(7, 4, 3, 2, '#3f51b5');
      p(6, 4, 1, 1, '#fff');
      p(5, 5, 2, 2, skinColor);
    } else {
      p(6, 4, 3, 3, '#1a237e');
      p(11, 4, 3, 3, '#1a237e');
      p(7, 4, 2, 2, '#3f51b5');
      p(12, 4, 2, 2, '#3f51b5');
      p(6, 4, 1, 1, '#fff');
      p(11, 4, 1, 1, '#fff');
      p(9, 7, 2, 1, '#e57373');
    }

    p(4, 9, 12, 6, jacketColor);
    p(6, 10, 3, 4, jacketAccent);
    p(11, 10, 3, 4, jacketAccent);

    const armXOff = isDiag ? (isRight ? 1 : -1) : 0;
    p(2 + armXOff, 9 + armSwing, 2, 5, skinColor);
    p(16 - armXOff, 9 - armSwing, 2, 5, skinColor);

    p(5, 15, 10, 3, shortsColor);
    p(6, 18 + bobY, 3, 5, skinColor);
    p(11, 18 + bobY, 3, 5, skinColor);
    p(5, 22 + bobY + legOffset1, 4, 2, shoeColor);
    p(11, 22 + bobY + legOffset2, 4, 2, shoeColor);
  } else {
    const faceX = isRight ? 11 : 4;
    const faceW = isRight ? 6 : 6;

    p(5, 0, 10, 3, hairColor);
    p(4, 1, 2, 6, hairColor);
    p(14, 1, 2, 6, hairColor);

    p(5, 3, 10, 6, skinColor);

    p(faceX, 4, 3, 3, '#1a237e');
    p(faceX + 1, 4, 2, 2, '#3f51b5');
    p(faceX + (isRight ? 2 : 0), 4, 1, 1, '#fff');

    p(faceX + (isRight ? -1 : faceW), 7, 2, 1, '#e57373');

    p(4, 9, 12, 6, jacketColor);
    p(isRight ? 11 : 6, 10, 3, 4, jacketAccent);

    p(isRight ? 16 : 2, 9 + armSwing, 2, 5, skinColor);
    p(isRight ? 2 : 16, 9 - armSwing, 2, 5, skinColor);

    p(5, 15, 10, 3, shortsColor);
    p(6, 18 + bobY, 3, 5, skinColor);
    p(11, 18 + bobY, 3, 5, skinColor);
    p(5, 22 + bobY + legOffset1, 4, 2, shoeColor);
    p(11, 22 + bobY + legOffset2, 4, 2, shoeColor);
  }
}

function makeCharFrame(
  prefix: string,
  dir: Dir8,
  state: AnimState,
  frame: WalkFrame,
  skinColor: string,
  hairColor: string,
  jacketColor: string,
  jacketAccent: string,
  shortsColor: string,
  shoeColor: string,
): THREE.CanvasTexture {
  const key = `${prefix}-${dir}-${state}-${frame}`;
  if (cache.has(key)) return cache.get(key)!;

  const [c, ctx] = makeCanvas(SPRITE_W, SPRITE_H);
  ctx.imageSmoothingEnabled = false;

  const actualFrame = state === 'idle' ? 0 : frame;
  drawCharacterBase(ctx, dir, actualFrame, skinColor, hairColor, jacketColor, jacketAccent, shortsColor, shoeColor);

  const tex = createPixelTexture(c, key);
  cache.set(key, tex);
  return tex;
}

const PLAYER_COLORS = {
  skin: '#ffcc80',
  hair: '#4e342e',
  jacket: '#1e88e5',
  jacketAccent: '#e3f2fd',
  shorts: '#0d47a1',
  shoe: '#c62828',
};

export function makePlayerSprite(dir: Dir8, state: AnimState = 'idle', frame: WalkFrame = 0): THREE.CanvasTexture {
  return makeCharFrame('player', dir, state, frame,
    PLAYER_COLORS.skin, PLAYER_COLORS.hair, PLAYER_COLORS.jacket,
    PLAYER_COLORS.jacketAccent, PLAYER_COLORS.shorts, PLAYER_COLORS.shoe);
}

const NPC_PALETTES: Record<string, { skin: string; hair: string; jacket: string; accent: string; shorts: string; shoe: string }> = {
  professor: { skin: '#ffe0b2', hair: '#5d4037', jacket: '#42a5f5', accent: '#bbdefb', shorts: '#1565c0', shoe: '#3e2723' },
  resident: { skin: '#ffcc80', hair: '#7b1fa2', jacket: '#ab47bc', accent: '#ce93d8', shorts: '#6a1b9a', shoe: '#4a148c' },
  gardener: { skin: '#d7ccc8', hair: '#33691e', jacket: '#66bb6a', accent: '#a5d6a7', shorts: '#2e7d32', shoe: '#1b5e20' },
};

export function makeNpcSprite(
  dir: Dir8,
  state: AnimState = 'idle',
  frame: WalkFrame = 0,
  variant: string = 'professor',
): THREE.CanvasTexture {
  const pal = NPC_PALETTES[variant] || NPC_PALETTES.professor;
  return makeCharFrame(`npc-${variant}`, dir, state, frame,
    pal.skin, pal.hair, pal.jacket, pal.accent, pal.shorts, pal.shoe);
}

export { cache as characterSpriteCache };
