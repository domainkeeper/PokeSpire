import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from './PixelCanvas';

export function makeSkyBackground(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(480, 160);

  // gradient sky
  for (let y = 0; y < 160; y++) {
    const t = y / 160;
    const r = Math.round(135 + t * 100);
    const g = Math.round(206 - t * 20);
    const b = Math.round(235 - t * 50);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, 480, 1);
  }

  // clouds
  const drawCloud = (cx: number, cy: number, w: number) => {
    const h = Math.round(w * 0.3);
    pixelRect(ctx, cx, cy, w, h, 'rgba(255,255,255,0.85)');
    pixelRect(ctx, cx + 3, cy - Math.round(h * 0.4), w - 6, h, 'rgba(255,255,255,0.9)');
    pixelRect(ctx, cx + Math.round(w * 0.2), cy - Math.round(h * 0.7), Math.round(w * 0.4), h, 'rgba(255,255,255,0.8)');
  };

  drawCloud(30, 30, 60);
  drawCloud(150, 20, 80);
  drawCloud(300, 35, 50);
  drawCloud(400, 15, 70);

  // distant hills
  for (let x = 0; x < 480; x++) {
    const h1 = Math.round(20 + Math.sin(x * 0.02) * 8 + Math.sin(x * 0.05) * 4);
    const h2 = Math.round(15 + Math.sin(x * 0.015 + 1) * 6 + Math.sin(x * 0.04 + 2) * 3);

    pixelRect(ctx, x, 160 - h1, 1, h1, '#3a6a3a');
    pixelRect(ctx, x, 160 - h2, 1, h2, '#3e6e3e');
  }

  // hills overlay
  for (let x = 0; x < 480; x++) {
    const h = Math.round(10 + Math.sin(x * 0.03 + 3) * 5);
    pixelRect(ctx, x, 160 - h, 1, h, '#427242');
  }

  const tex = createPixelTexture(c, 'sky-bg');
  tex.needsUpdate = true;
  return tex;
}

export function makeRouteBackground(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(480, 160);

  // lighter sky for routes
  for (let y = 0; y < 160; y++) {
    const t = y / 160;
    const r = Math.round(100 + t * 120);
    const g = Math.round(180 - t * 30);
    const b = Math.round(255 - t * 60);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, 480, 1);
  }

  // clouds
  const drawCloud = (cx: number, cy: number, w: number) => {
    const h = Math.round(w * 0.25);
    pixelRect(ctx, cx, cy, w, h, 'rgba(255,255,255,0.8)');
    pixelRect(ctx, cx + 4, cy - Math.round(h * 0.5), w - 8, h, 'rgba(255,255,255,0.85)');
  };

  drawCloud(50, 25, 70);
  drawCloud(200, 15, 90);
  drawCloud(350, 30, 60);

  // distant mountains
  for (let x = 0; x < 480; x++) {
    const h1 = Math.round(30 + Math.sin(x * 0.012) * 15 + Math.sin(x * 0.03) * 8);
    const h2 = Math.round(20 + Math.sin(x * 0.018 + 1.5) * 10 + Math.sin(x * 0.025 + 1) * 5);
    pixelRect(ctx, x, 160 - h1, 1, h1, '#1b5e20');
    pixelRect(ctx, x, 160 - h2, 1, h2, '#2e7d32');
  }

  // treeline
  for (let x = 0; x < 480; x += 8) {
    const h = Math.round(12 + Math.sin(x * 0.1) * 4);
    pixelRect(ctx, x, 160 - h, 8, h, '#388e3c');
    pixelRect(ctx, x + 2, 160 - h - 4, 4, 4, '#43a047');
  }

  const tex = createPixelTexture(c, 'route-bg');
  tex.needsUpdate = true;
  return tex;
}
