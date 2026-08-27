import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets/vfx');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateSlashAtlas() {
  const frames = 8;
  const size = 32;
  const png = new PNG({ width: size * frames, height: size });

  for (let f = 0; f < frames; f++) {
    const progress = f / (frames - 1);
    const centerX = f * size + size / 2;
    const centerY = size / 2;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const idx = (png.width * y + (f * size + x)) << 2;
        const dx = x - (f * size + size / 2);
        const dy = y - size / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Slash arc shape
        const angle = Math.atan2(dy, dx);
        const targetAngle = -0.5 + progress * 1.0;
        const angleDiff = Math.abs(angle - targetAngle);

        if (dist < 12 && dist > 6 && angleDiff < 0.6) {
          const alpha = Math.max(0, 1 - angleDiff / 0.6) * (1 - Math.abs(progress - 0.5) * 0.5);
          png.data[idx] = 255;     // R
          png.data[idx + 1] = 255; // G
          png.data[idx + 2] = 255; // B
          png.data[idx + 3] = Math.floor(alpha * 255);
        } else {
          png.data[idx + 3] = 0;
        }
      }
    }
  }

  const filePath = path.join(OUTPUT_DIR, 'slash.png');
  fs.writeFileSync(filePath, PNG.sync.write(png));
  
  const meta = { frameWidth: size, frameHeight: size, frames, fps: 24 };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'slash.json'), JSON.stringify(meta, null, 2));
  console.log('Generated slash atlas.');
}

function generateImpactAtlas() {
  const frames = 6;
  const size = 32;
  const png = new PNG({ width: size * frames, height: size });

  for (let f = 0; f < frames; f++) {
    const progress = f / (frames - 1);
    const radius = progress * 14;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const idx = (png.width * y + (f * size + x)) << 2;
        const dx = x - (f * size + size / 2);
        const dy = y - size / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const angle = Math.atan2(dy, dx);
        const spikes = Math.abs(Math.sin(angle * 4)) * 4;

        if (dist <= radius + spikes && dist >= radius - 3) {
          const alpha = 1 - progress;
          png.data[idx] = 255;
          png.data[idx + 1] = 240;
          png.data[idx + 2] = 150;
          png.data[idx + 3] = Math.floor(alpha * 255);
        } else {
          png.data[idx + 3] = 0;
        }
      }
    }
  }

  const filePath = path.join(OUTPUT_DIR, 'impact.png');
  fs.writeFileSync(filePath, PNG.sync.write(png));

  const meta = { frameWidth: size, frameHeight: size, frames, fps: 20 };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'impact.json'), JSON.stringify(meta, null, 2));
  console.log('Generated impact atlas.');
}

generateSlashAtlas();
generateImpactAtlas();
console.log('VFX sprite sheets generated successfully.');
