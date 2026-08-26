import * as THREE from 'three';
import { makeCanvas, createPixelTexture } from '../PixelCanvas';

export type Dir8 = 'down' | 'down_right' | 'right' | 'up_right' | 'up' | 'up_left' | 'left' | 'down_left';
export type AnimState = 'idle' | 'walk';
export type WalkFrame = 0 | 1 | 2 | 3;

const W = 32;
const H = 48;
const cache = new Map<string, THREE.CanvasTexture>();

const OL = '#1a1a2e';

function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

// DOWN = FRONT FACE (facing camera)
function drawDown(ctx: CanvasRenderingContext2D, lo: number) {
  // Hair top with outline
  r(ctx,10,0,12,1,OL); r(ctx,9,1,1,5,OL); r(ctx,22,1,1,5,OL);
  r(ctx,10,0,12,1,'#4e342e');
  r(ctx,8,1,1,6,'#4e342e'); r(ctx,23,1,1,6,'#4e342e');
  r(ctx,9,1,2,7,'#6d4c41'); r(ctx,21,1,2,7,'#6d4c41');
  r(ctx,11,1,10,1,'#8d6e63');
  r(ctx,10,0,12,2,'#4e342e');
  r(ctx,11,0,10,1,'#6d4c41');
  r(ctx,8,3,1,3,'#4e342e'); r(ctx,23,3,1,3,'#4e342e');
  r(ctx,7,5,1,2,'#4e342e'); r(ctx,24,5,1,2,'#4e342e');
  r(ctx,10,1,12,2,'#5d4037');
  // Spiky hair tufts
  r(ctx,8,0,2,3,'#4e342e'); r(ctx,22,0,2,3,'#4e342e');
  r(ctx,7,2,2,2,'#5d4037'); r(ctx,23,2,2,2,'#5d4037');

  // Forehead skin
  r(ctx,9,7,14,1,OL);
  r(ctx,8,7,16,1,'#a1887f');
  r(ctx,9,7,14,1,'#ffe0b2');

  // Face - full front view with outline
  r(ctx,8,8,1,5,OL); r(ctx,23,8,1,5,OL);
  r(ctx,9,8,14,1,OL);
  r(ctx,9,8,14,1,'#ffe0b2');
  r(ctx,10,8,12,1,'#ffcc80');
  r(ctx,9,9,14,1,'#ffe0b2');
  r(ctx,10,9,12,1,'#ffcc80');
  r(ctx,9,10,14,1,'#ffcc80');
  r(ctx,10,11,12,1,'#ffcc80');
  r(ctx,9,12,14,1,'#e6a96e');

  // Eyes - large anime style
  r(ctx,10,9,5,4,OL);
  r(ctx,11,9,3,3,'#1a237e');
  r(ctx,12,9,2,2,'#3f51b5');
  r(ctx,11,9,1,1,'#e8eaf6');
  r(ctx,13,10,1,1,'#1a237e');

  r(ctx,17,9,5,4,OL);
  r(ctx,18,9,3,3,'#1a237e');
  r(ctx,19,9,2,2,'#3f51b5');
  r(ctx,18,9,1,1,'#e8eaf6');
  r(ctx,20,10,1,1,'#1a237e');

  // Mouth
  r(ctx,14,12,4,1,OL);
  r(ctx,15,12,2,1,'#e57373');

  // Neck
  r(ctx,14,13,4,1,'#ffcc80');

  // Body/jacket with outline
  r(ctx,7,14,1,5,OL); r(ctx,24,14,1,5,OL);
  r(ctx,8,14,16,1,OL);
  r(ctx,8,14,16,1,'#1e88e5');
  r(ctx,9,14,14,1,'#1565c0');
  r(ctx,7,15,1,4,OL); r(ctx,24,15,1,4,OL);
  r(ctx,8,15,16,1,'#1565c0');
  r(ctx,9,15,14,1,'#e3f2fd');
  r(ctx,10,15,12,1,'#bbdefb');
  r(ctx,8,16,5,3,'#1e88e5');
  r(ctx,19,16,5,3,'#1e88e5');
  r(ctx,8,16,5,1,'#e3f2fd');
  r(ctx,19,16,5,1,'#e3f2fd');

  // Arms
  r(ctx,5,15,2,4,OL); r(ctx,25,15,2,4,OL);
  r(ctx,5,15+lo,2,4,'#ffe0b2');
  r(ctx,6,15+lo,1,4,'#ffcc80');
  r(ctx,25,15-lo,2,4,'#ffe0b2');
  r(ctx,25,15-lo,1,4,'#ffcc80');

  // Belt/waist
  r(ctx,8,19,16,1,OL);
  r(ctx,9,19,14,1,'#0d47a1');

  // Shorts
  r(ctx,8,20,16,1,OL);
  r(ctx,8,20,7,4,OL); r(ctx,17,20,7,4,OL);
  r(ctx,9,20,6,3,'#0d47a1');
  r(ctx,18,20,6,3,'#0d47a1');
  r(ctx,9,21,6,2,'#1565c0');
  r(ctx,18,21,6,2,'#1565c0');

  // Legs
  r(ctx,9,24+lo,5,4,OL);
  r(ctx,10,24+lo,4,3,'#ffe0b2');
  r(ctx,11,24+lo,2,3,'#ffcc80');
  r(ctx,18,24-lo,5,4,OL);
  r(ctx,19,24-lo,4,3,'#ffe0b2');
  r(ctx,20,24-lo,2,3,'#ffcc80');

  // Shoes
  r(ctx,8,28+lo,6,2,OL);
  r(ctx,9,28+lo,5,1,'#c62828');
  r(ctx,10,28+lo,3,1,'#e53935');
  r(ctx,17,28-lo,6,2,OL);
  r(ctx,18,28-lo,5,1,'#c62828');
  r(ctx,19,28-lo,3,1,'#e53935');
  r(ctx,8,29+lo,6,1,OL);
  r(ctx,17,29-lo,6,1,OL);
  r(ctx,9,29+lo,5,1,'#b71c1c');
  r(ctx,18,29-lo,5,1,'#b71c1c');
}

// UP = BACK OF HEAD (away from camera)
function drawUp(ctx: CanvasRenderingContext2D, lo: number) {
  // Back of hair - large mass
  r(ctx,10,0,12,1,OL); r(ctx,9,1,1,5,OL); r(ctx,22,1,1,5,OL);
  r(ctx,10,0,12,1,'#4e342e');
  r(ctx,8,1,1,6,'#4e342e'); r(ctx,23,1,1,6,'#4e342e');
  r(ctx,9,1,2,7,'#6d4c41'); r(ctx,21,1,2,7,'#6d4c41');
  r(ctx,11,1,10,1,'#8d6e63');
  r(ctx,10,0,12,2,'#4e342e');
  r(ctx,11,0,10,1,'#6d4c41');
  r(ctx,8,3,1,3,'#4e342e'); r(ctx,23,3,1,3,'#4e342e');
  r(ctx,7,5,1,2,'#4e342e'); r(ctx,24,5,1,2,'#4e342e');
  r(ctx,10,1,12,2,'#5d4037');
  r(ctx,8,0,2,3,'#4e342e'); r(ctx,22,0,2,3,'#4e342e');
  r(ctx,7,2,2,2,'#5d4037'); r(ctx,23,2,2,2,'#5d4037');

  // Back of head - all hair, no face
  r(ctx,9,7,14,1,OL);
  r(ctx,8,7,16,1,'#6d4c41');
  r(ctx,9,7,14,1,'#5d4037');

  r(ctx,8,8,1,5,OL); r(ctx,23,8,1,5,OL);
  r(ctx,9,8,14,1,OL);
  r(ctx,9,8,14,1,'#5d4037');
  r(ctx,10,8,12,1,'#6d4c41');
  r(ctx,9,9,14,1,'#5d4037');
  r(ctx,10,9,12,1,'#4e342e');
  r(ctx,9,10,14,1,'#5d4037');
  r(ctx,10,11,12,1,'#4e342e');
  r(ctx,9,12,14,1,'#4e342e');

  // Neck
  r(ctx,14,13,4,1,'#ffcc80');

  // Back of jacket
  r(ctx,7,14,1,5,OL); r(ctx,24,14,1,5,OL);
  r(ctx,8,14,16,1,OL);
  r(ctx,8,14,16,1,'#1565c0');
  r(ctx,9,14,14,1,'#0d47a1');
  r(ctx,7,15,1,4,OL); r(ctx,24,15,1,4,OL);
  r(ctx,8,15,16,1,'#1565c0');
  r(ctx,9,15,14,1,'#1e88e5');
  r(ctx,8,16,16,3,'#1565c0');

  // Arms
  r(ctx,5,15,2,4,OL); r(ctx,25,15,2,4,OL);
  r(ctx,5,15+lo,2,4,'#ffe0b2');
  r(ctx,6,15+lo,1,4,'#ffcc80');
  r(ctx,25,15-lo,2,4,'#ffe0b2');
  r(ctx,25,15-lo,1,4,'#ffcc80');

  // Belt
  r(ctx,8,19,16,1,OL);
  r(ctx,9,19,14,1,'#0d47a1');

  // Shorts
  r(ctx,8,20,16,1,OL);
  r(ctx,8,20,7,4,OL); r(ctx,17,20,7,4,OL);
  r(ctx,9,20,6,3,'#0d47a1');
  r(ctx,18,20,6,3,'#0d47a1');
  r(ctx,9,21,6,2,'#1565c0');
  r(ctx,18,21,6,2,'#1565c0');

  // Legs
  r(ctx,9,24+lo,5,4,OL);
  r(ctx,10,24+lo,4,3,'#ffe0b2');
  r(ctx,11,24+lo,2,3,'#ffcc80');
  r(ctx,18,24-lo,5,4,OL);
  r(ctx,19,24-lo,4,3,'#ffe0b2');
  r(ctx,20,24-lo,2,3,'#ffcc80');

  // Shoes
  r(ctx,8,28+lo,6,2,OL);
  r(ctx,9,28+lo,5,1,'#c62828');
  r(ctx,10,28+lo,3,1,'#e53935');
  r(ctx,17,28-lo,6,2,OL);
  r(ctx,18,28-lo,5,1,'#c62828');
  r(ctx,19,28-lo,3,1,'#e53935');
  r(ctx,8,29+lo,6,1,OL);
  r(ctx,17,29-lo,6,1,OL);
  r(ctx,9,29+lo,5,1,'#b71c1c');
  r(ctx,18,29-lo,5,1,'#b71c1c');
}

// RIGHT profile
function drawRight(ctx: CanvasRenderingContext2D, lo: number) {
  r(ctx,11,0,10,1,OL); r(ctx,21,1,1,5,OL);
  r(ctx,11,0,10,1,'#4e342e');
  r(ctx,22,1,1,5,'#4e342e');
  r(ctx,20,1,2,6,'#6d4c41');
  r(ctx,11,1,10,1,'#8d6e63');
  r(ctx,14,0,2,2,'#5d4037');
  r(ctx,22,2,1,3,'#4e342e');
  r(ctx,23,4,1,2,'#4e342e');
  r(ctx,11,1,10,2,'#5d4037');

  r(ctx,8,7,14,1,OL); r(ctx,8,7,13,1,'#a1887f');

  r(ctx,8,8,14,1,OL); r(ctx,9,8,12,1,'#ffcc80');
  r(ctx,20,8,2,1,'#ffe0b2');

  r(ctx,7,9,1,4,OL); r(ctx,21,9,1,4,OL);
  r(ctx,8,9,13,1,OL); r(ctx,9,9,12,1,'#ffcc80');
  r(ctx,20,9,1,1,'#ffe0b2');
  r(ctx,8,10,13,1,'#ffcc80');
  r(ctx,9,11,12,1,'#ffcc80');
  r(ctx,8,12,13,1,'#e6a96e');

  // Eye
  r(ctx,18,9,4,3,OL);
  r(ctx,19,9,2,2,'#1a237e');
  r(ctx,20,9,1,1,'#3f51b5');
  r(ctx,19,9,1,1,'#e8eaf6');

  // Nose
  r(ctx,20,12,2,1,OL); r(ctx,21,12,1,1,'#e6a96e');

  // Mouth
  r(ctx,17,13,3,1,OL); r(ctx,18,13,1,1,'#e57373');

  r(ctx,14,14,4,1,'#ffcc80');

  r(ctx,7,15,1,4,OL); r(ctx,21,15,1,4,OL);
  r(ctx,8,15,13,1,OL); r(ctx,8,15,13,1,'#1e88e5');
  r(ctx,9,15,12,1,'#1565c0');
  r(ctx,7,16,1,3,OL); r(ctx,21,16,1,3,OL);
  r(ctx,8,16,13,1,'#1565c0');
  r(ctx,9,16,12,1,'#e3f2fd');
  r(ctx,8,17,12,2,'#1e88e5');
  r(ctx,19,17,2,2,'#e3f2fd');

  // Arm
  r(ctx,21,16,2,4,OL);
  r(ctx,21,16+lo,2,4,'#ffe0b2');
  r(ctx,22,16+lo,1,4,'#ffcc80');

  r(ctx,8,19,13,1,OL); r(ctx,9,19,12,1,'#0d47a1');
  r(ctx,8,20,13,1,OL);
  r(ctx,8,20,6,4,OL); r(ctx,15,20,6,4,OL);
  r(ctx,9,20,5,3,'#0d47a1');
  r(ctx,16,20,5,3,'#0d47a1');

  r(ctx,9,24+lo,5,4,OL);
  r(ctx,10,24+lo,4,3,'#ffe0b2');
  r(ctx,18,24-lo,5,4,OL);
  r(ctx,19,24-lo,4,3,'#ffe0b2');

  r(ctx,8,28+lo,6,2,OL);
  r(ctx,9,28+lo,5,1,'#c62828');
  r(ctx,10,28+lo,3,1,'#e53935');
  r(ctx,17,28-lo,6,2,OL);
  r(ctx,18,28-lo,5,1,'#c62828');
  r(ctx,19,28-lo,3,1,'#e53935');
  r(ctx,8,29+lo,6,1,OL); r(ctx,17,29-lo,6,1,OL);
  r(ctx,9,29+lo,5,1,'#b71c1c');
  r(ctx,18,29-lo,5,1,'#b71c1c');
}

// LEFT profile (mirror of right)
function drawLeft(ctx: CanvasRenderingContext2D, lo: number) {
  r(ctx,11,0,10,1,OL); r(ctx,10,1,1,5,OL);
  r(ctx,11,0,10,1,'#4e342e');
  r(ctx,9,1,1,5,'#4e342e');
  r(ctx,10,1,2,6,'#6d4c41');
  r(ctx,11,1,10,1,'#8d6e63');
  r(ctx,16,0,2,2,'#5d4037');
  r(ctx,9,2,1,3,'#4e342e');
  r(ctx,8,4,1,2,'#4e342e');
  r(ctx,11,1,10,2,'#5d4037');

  r(ctx,10,7,14,1,OL); r(ctx,11,7,13,1,'#a1887f');

  r(ctx,10,8,14,1,OL); r(ctx,11,8,12,1,'#ffcc80');
  r(ctx,10,8,2,1,'#ffe0b2');

  r(ctx,10,9,1,4,OL); r(ctx,24,9,1,4,OL);
  r(ctx,11,9,13,1,OL); r(ctx,11,9,12,1,'#ffcc80');
  r(ctx,10,9,1,1,'#ffe0b2');
  r(ctx,11,10,13,1,'#ffcc80');
  r(ctx,11,11,12,1,'#ffcc80');
  r(ctx,11,12,13,1,'#e6a96e');

  // Eye
  r(ctx,10,9,4,3,OL);
  r(ctx,11,9,2,2,'#1a237e');
  r(ctx,12,9,1,1,'#3f51b5');
  r(ctx,11,9,1,1,'#e8eaf6');

  // Nose
  r(ctx,10,12,2,1,OL); r(ctx,10,12,1,1,'#e6a96e');

  // Mouth
  r(ctx,12,13,3,1,OL); r(ctx,13,13,1,1,'#e57373');

  r(ctx,14,14,4,1,'#ffcc80');

  r(ctx,10,15,1,4,OL); r(ctx,24,15,1,4,OL);
  r(ctx,11,15,13,1,OL); r(ctx,11,15,13,1,'#1e88e5');
  r(ctx,12,15,12,1,'#1565c0');
  r(ctx,10,16,1,3,OL); r(ctx,24,16,1,3,OL);
  r(ctx,11,16,13,1,'#1565c0');
  r(ctx,12,16,12,1,'#e3f2fd');
  r(ctx,11,17,12,2,'#1e88e5');
  r(ctx,11,17,2,2,'#e3f2fd');

  // Arm
  r(ctx,9,16,2,4,OL);
  r(ctx,9,16+lo,2,4,'#ffe0b2');
  r(ctx,9,16+lo,1,4,'#ffcc80');

  r(ctx,11,19,13,1,OL); r(ctx,12,19,12,1,'#0d47a1');
  r(ctx,11,20,13,1,OL);
  r(ctx,11,20,6,4,OL); r(ctx,18,20,6,4,OL);
  r(ctx,12,20,5,3,'#0d47a1');
  r(ctx,19,20,5,3,'#0d47a1');

  r(ctx,11,24+lo,5,4,OL);
  r(ctx,12,24+lo,4,3,'#ffe0b2');
  r(ctx,19,24-lo,5,4,OL);
  r(ctx,20,24-lo,4,3,'#ffe0b2');

  r(ctx,11,28+lo,6,2,OL);
  r(ctx,12,28+lo,5,1,'#c62828');
  r(ctx,13,28+lo,3,1,'#e53935');
  r(ctx,18,28-lo,6,2,OL);
  r(ctx,19,28-lo,5,1,'#c62828');
  r(ctx,20,28-lo,3,1,'#e53935');
  r(ctx,11,29+lo,6,1,OL); r(ctx,18,29-lo,6,1,OL);
  r(ctx,12,29+lo,5,1,'#b71c1c');
  r(ctx,19,29-lo,5,1,'#b71c1c');
}

function drawDownRight(ctx: CanvasRenderingContext2D, lo: number) {
  r(ctx,10,0,12,1,OL); r(ctx,21,1,1,5,OL);
  r(ctx,10,0,12,1,'#4e342e');
  r(ctx,22,1,1,5,'#4e342e');
  r(ctx,20,1,2,6,'#6d4c41');
  r(ctx,10,1,12,1,'#8d6e63');
  r(ctx,14,0,2,2,'#5d4037');
  r(ctx,22,2,1,3,'#4e342e');
  r(ctx,23,4,1,2,'#4e342e');
  r(ctx,10,1,12,2,'#5d4037');
  r(ctx,8,0,2,3,'#4e342e'); r(ctx,22,0,2,3,'#4e342e');

  r(ctx,8,7,14,1,OL); r(ctx,8,7,13,1,'#a1887f');

  r(ctx,8,8,14,1,OL); r(ctx,9,8,12,1,'#ffcc80');
  r(ctx,19,8,2,1,'#ffe0b2');

  r(ctx,7,9,1,4,OL); r(ctx,21,9,1,4,OL);
  r(ctx,8,9,13,1,OL); r(ctx,9,9,12,1,'#ffcc80');
  r(ctx,19,9,2,1,'#ffe0b2');
  r(ctx,8,10,13,1,'#ffcc80');
  r(ctx,9,11,12,1,'#ffcc80');
  r(ctx,8,12,13,1,'#e6a96e');

  // Eye (right side visible)
  r(ctx,17,9,4,3,OL);
  r(ctx,18,9,2,2,'#1a237e');
  r(ctx,19,9,1,1,'#3f51b5');
  r(ctx,18,9,1,1,'#e8eaf6');

  r(ctx,16,12,3,1,OL); r(ctx,17,12,1,1,'#e57373');

  r(ctx,14,14,4,1,'#ffcc80');

  r(ctx,7,15,1,4,OL); r(ctx,21,15,1,4,OL);
  r(ctx,8,15,13,1,OL); r(ctx,8,15,13,1,'#1e88e5');
  r(ctx,9,15,12,1,'#1565c0');
  r(ctx,7,16,1,3,OL); r(ctx,21,16,1,3,OL);
  r(ctx,8,16,13,1,'#1565c0');
  r(ctx,9,16,12,1,'#e3f2fd');
  r(ctx,8,17,12,2,'#1e88e5');

  r(ctx,21,16,2,4,OL);
  r(ctx,21,16+lo,2,4,'#ffe0b2');
  r(ctx,22,16+lo,1,4,'#ffcc80');

  r(ctx,8,19,13,1,OL); r(ctx,9,19,12,1,'#0d47a1');
  r(ctx,8,20,13,1,OL);
  r(ctx,8,20,6,4,OL); r(ctx,15,20,6,4,OL);
  r(ctx,9,20,5,3,'#0d47a1'); r(ctx,16,20,5,3,'#0d47a1');

  r(ctx,9,24+lo,5,4,OL); r(ctx,10,24+lo,4,3,'#ffe0b2');
  r(ctx,17,24-lo,5,4,OL); r(ctx,18,24-lo,4,3,'#ffe0b2');

  r(ctx,8,28+lo,6,2,OL);
  r(ctx,9,28+lo,5,1,'#c62828'); r(ctx,10,28+lo,3,1,'#e53935');
  r(ctx,17,28-lo,6,2,OL);
  r(ctx,18,28-lo,5,1,'#c62828'); r(ctx,19,28-lo,3,1,'#e53935');
  r(ctx,8,29+lo,6,1,OL); r(ctx,17,29-lo,6,1,OL);
  r(ctx,9,29+lo,5,1,'#b71c1c'); r(ctx,18,29-lo,5,1,'#b71c1c');
}

function drawDownLeft(ctx: CanvasRenderingContext2D, lo: number) {
  r(ctx,10,0,12,1,OL); r(ctx,10,1,1,5,OL);
  r(ctx,10,0,12,1,'#4e342e');
  r(ctx,9,1,1,5,'#4e342e');
  r(ctx,10,1,2,6,'#6d4c41');
  r(ctx,10,1,12,1,'#8d6e63');
  r(ctx,16,0,2,2,'#5d4037');
  r(ctx,9,2,1,3,'#4e342e');
  r(ctx,8,4,1,2,'#4e342e');
  r(ctx,10,1,12,2,'#5d4037');
  r(ctx,8,0,2,3,'#4e342e'); r(ctx,22,0,2,3,'#4e342e');

  r(ctx,10,7,14,1,OL); r(ctx,11,7,13,1,'#a1887f');

  r(ctx,10,8,14,1,OL); r(ctx,11,8,12,1,'#ffcc80');
  r(ctx,11,8,2,1,'#ffe0b2');

  r(ctx,10,9,1,4,OL); r(ctx,24,9,1,4,OL);
  r(ctx,11,9,13,1,OL); r(ctx,11,9,12,1,'#ffcc80');
  r(ctx,11,9,2,1,'#ffe0b2');
  r(ctx,11,10,13,1,'#ffcc80');
  r(ctx,11,11,12,1,'#ffcc80');
  r(ctx,11,12,13,1,'#e6a96e');

  // Eye (left side visible)
  r(ctx,11,9,4,3,OL);
  r(ctx,12,9,2,2,'#1a237e');
  r(ctx,13,9,1,1,'#3f51b5');
  r(ctx,12,9,1,1,'#e8eaf6');

  r(ctx,13,12,3,1,OL); r(ctx,14,12,1,1,'#e57373');

  r(ctx,14,14,4,1,'#ffcc80');

  r(ctx,10,15,1,4,OL); r(ctx,24,15,1,4,OL);
  r(ctx,11,15,13,1,OL); r(ctx,11,15,13,1,'#1e88e5');
  r(ctx,12,15,12,1,'#1565c0');
  r(ctx,10,16,1,3,OL); r(ctx,24,16,1,3,OL);
  r(ctx,11,16,13,1,'#1565c0');
  r(ctx,12,16,12,1,'#e3f2fd');
  r(ctx,11,17,12,2,'#1e88e5');

  r(ctx,9,16,2,4,OL);
  r(ctx,9,16+lo,2,4,'#ffe0b2');
  r(ctx,9,16+lo,1,4,'#ffcc80');

  r(ctx,11,19,13,1,OL); r(ctx,12,19,12,1,'#0d47a1');
  r(ctx,11,20,13,1,OL);
  r(ctx,11,20,6,4,OL); r(ctx,18,20,6,4,OL);
  r(ctx,12,20,5,3,'#0d47a1'); r(ctx,19,20,5,3,'#0d47a1');

  r(ctx,11,24+lo,5,4,OL); r(ctx,12,24+lo,4,3,'#ffe0b2');
  r(ctx,19,24-lo,5,4,OL); r(ctx,20,24-lo,4,3,'#ffe0b2');

  r(ctx,11,28+lo,6,2,OL);
  r(ctx,12,28+lo,5,1,'#c62828'); r(ctx,13,28+lo,3,1,'#e53935');
  r(ctx,18,28-lo,6,2,OL);
  r(ctx,19,28-lo,5,1,'#c62828'); r(ctx,20,28-lo,3,1,'#e53935');
  r(ctx,11,29+lo,6,1,OL); r(ctx,18,29-lo,6,1,OL);
  r(ctx,12,29+lo,5,1,'#b71c1c'); r(ctx,19,29-lo,5,1,'#b71c1c');
}

function drawUpRight(ctx: CanvasRenderingContext2D, lo: number) {
  r(ctx,11,0,10,1,OL); r(ctx,21,1,1,5,OL);
  r(ctx,11,0,10,1,'#4e342e');
  r(ctx,22,1,1,5,'#4e342e');
  r(ctx,20,1,2,6,'#6d4c41');
  r(ctx,11,1,10,1,'#8d6e63');
  r(ctx,14,0,2,2,'#5d4037');
  r(ctx,22,2,1,3,'#4e342e');
  r(ctx,23,4,1,2,'#4e342e');
  r(ctx,11,1,10,2,'#5d4037');

  r(ctx,8,7,14,1,OL); r(ctx,8,7,13,1,'#6d4c41');
  r(ctx,9,7,12,1,'#5d4037');

  r(ctx,8,8,1,5,OL); r(ctx,21,8,1,5,OL);
  r(ctx,9,8,12,1,OL); r(ctx,9,8,12,1,'#5d4037');
  r(ctx,10,8,10,1,'#6d4c41');
  r(ctx,9,9,12,1,'#5d4037');
  r(ctx,10,9,10,1,'#4e342e');
  r(ctx,9,10,12,1,'#5d4037');
  r(ctx,10,11,10,1,'#4e342e');
  r(ctx,9,12,12,1,'#4e342e');

  r(ctx,14,13,4,1,'#ffcc80');

  r(ctx,7,14,1,5,OL); r(ctx,21,14,1,5,OL);
  r(ctx,8,14,13,1,OL); r(ctx,8,14,13,1,'#1565c0');
  r(ctx,9,14,12,1,'#0d47a1');
  r(ctx,7,15,1,4,OL); r(ctx,21,15,1,4,OL);
  r(ctx,8,15,13,1,'#1565c0');
  r(ctx,9,15,12,1,'#1e88e5');
  r(ctx,8,16,13,2,'#1565c0');

  r(ctx,21,16,2,4,OL);
  r(ctx,21,16+lo,2,4,'#ffe0b2');
  r(ctx,22,16+lo,1,4,'#ffcc80');

  r(ctx,8,19,13,1,OL); r(ctx,9,19,12,1,'#0d47a1');
  r(ctx,8,20,13,1,OL);
  r(ctx,8,20,6,4,OL); r(ctx,15,20,6,4,OL);
  r(ctx,9,20,5,3,'#0d47a1'); r(ctx,16,20,5,3,'#0d47a1');

  r(ctx,9,24+lo,5,4,OL); r(ctx,10,24+lo,4,3,'#ffe0b2');
  r(ctx,17,24-lo,5,4,OL); r(ctx,18,24-lo,4,3,'#ffe0b2');

  r(ctx,8,28+lo,6,2,OL);
  r(ctx,9,28+lo,5,1,'#c62828'); r(ctx,10,28+lo,3,1,'#e53935');
  r(ctx,17,28-lo,6,2,OL);
  r(ctx,18,28-lo,5,1,'#c62828'); r(ctx,19,28-lo,3,1,'#e53935');
  r(ctx,8,29+lo,6,1,OL); r(ctx,17,29-lo,6,1,OL);
  r(ctx,9,29+lo,5,1,'#b71c1c'); r(ctx,18,29-lo,5,1,'#b71c1c');
}

function drawUpLeft(ctx: CanvasRenderingContext2D, lo: number) {
  r(ctx,11,0,10,1,OL); r(ctx,10,1,1,5,OL);
  r(ctx,11,0,10,1,'#4e342e');
  r(ctx,9,1,1,5,'#4e342e');
  r(ctx,10,1,2,6,'#6d4c41');
  r(ctx,11,1,10,1,'#8d6e63');
  r(ctx,16,0,2,2,'#5d4037');
  r(ctx,9,2,1,3,'#4e342e');
  r(ctx,8,4,1,2,'#4e342e');
  r(ctx,11,1,10,2,'#5d4037');

  r(ctx,10,7,14,1,OL); r(ctx,11,7,13,1,'#6d4c41');
  r(ctx,11,7,12,1,'#5d4037');

  r(ctx,10,8,1,5,OL); r(ctx,23,8,1,5,OL);
  r(ctx,11,8,12,1,OL); r(ctx,11,8,12,1,'#5d4037');
  r(ctx,12,8,10,1,'#6d4c41');
  r(ctx,11,9,12,1,'#5d4037');
  r(ctx,12,9,10,1,'#4e342e');
  r(ctx,11,10,12,1,'#5d4037');
  r(ctx,12,11,10,1,'#4e342e');
  r(ctx,11,12,12,1,'#4e342e');

  r(ctx,14,13,4,1,'#ffcc80');

  r(ctx,10,14,1,5,OL); r(ctx,24,14,1,5,OL);
  r(ctx,11,14,13,1,OL); r(ctx,11,14,13,1,'#1565c0');
  r(ctx,12,14,12,1,'#0d47a1');
  r(ctx,10,15,1,4,OL); r(ctx,24,15,1,4,OL);
  r(ctx,11,15,13,1,'#1565c0');
  r(ctx,12,15,12,1,'#1e88e5');
  r(ctx,11,16,13,2,'#1565c0');

  r(ctx,9,16,2,4,OL);
  r(ctx,9,16+lo,2,4,'#ffe0b2');
  r(ctx,9,16+lo,1,4,'#ffcc80');

  r(ctx,11,19,13,1,OL); r(ctx,12,19,12,1,'#0d47a1');
  r(ctx,11,20,13,1,OL);
  r(ctx,11,20,6,4,OL); r(ctx,18,20,6,4,OL);
  r(ctx,12,20,5,3,'#0d47a1'); r(ctx,19,20,5,3,'#0d47a1');

  r(ctx,11,24+lo,5,4,OL); r(ctx,12,24+lo,4,3,'#ffe0b2');
  r(ctx,19,24-lo,5,4,OL); r(ctx,20,24-lo,4,3,'#ffe0b2');

  r(ctx,11,28+lo,6,2,OL);
  r(ctx,12,28+lo,5,1,'#c62828'); r(ctx,13,28+lo,3,1,'#e53935');
  r(ctx,18,28-lo,6,2,OL);
  r(ctx,19,28-lo,5,1,'#c62828'); r(ctx,20,28-lo,3,1,'#e53935');
  r(ctx,11,29+lo,6,1,OL); r(ctx,18,29-lo,6,1,OL);
  r(ctx,12,29+lo,5,1,'#b71c1c'); r(ctx,19,29-lo,5,1,'#b71c1c');
}

const DRAW: Record<string, (ctx: CanvasRenderingContext2D, lo: number) => void> = {
  down: drawDown, up: drawUp, right: drawRight, left: drawLeft,
  down_right: drawDownRight, down_left: drawDownLeft,
  up_right: drawUpRight, up_left: drawUpLeft,
};

function getWalkOffset(frame: WalkFrame): number {
  if (frame === 0) return 0;
  if (frame === 1) return 1;
  if (frame === 2) return 0;
  return -1;
}

function makeFrame(dir: Dir8, state: AnimState, frame: WalkFrame, prefix: string): THREE.CanvasTexture {
  const key = `${prefix}-${dir}-${state}-${frame}`;
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = makeCanvas(W, H);
  ctx.imageSmoothingEnabled = false;
  const lo = state === 'walk' ? getWalkOffset(frame) : 0;
  const drawFn = DRAW[dir] || DRAW.down;
  drawFn(ctx, lo);
  const tex = createPixelTexture(c, key);
  cache.set(key, tex);
  return tex;
}

export function makePlayerSprite(dir: Dir8, state: AnimState = 'idle', frame: WalkFrame = 0): THREE.CanvasTexture {
  return makeFrame(dir, state, frame, 'player');
}

export function makeNpcSprite(
  dir: Dir8, state: AnimState = 'idle', frame: WalkFrame = 0, _variant: string = 'professor',
): THREE.CanvasTexture {
  return makeFrame(dir, state, frame, `npc-${_variant}`);
}

export { cache as characterSpriteCache };
