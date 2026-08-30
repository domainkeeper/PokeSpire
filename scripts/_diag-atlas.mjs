import { PNG } from 'pngjs';
import { readFileSync } from 'fs';

const id = process.argv[2] || '025';
const meta = JSON.parse(readFileSync(`public/assets/pokemon/${id}/animation.json`, 'utf8'));
const png = PNG.sync.read(readFileSync(`public/assets/pokemon/${id}/sprite-sheet.png`));
const { frameWidth: fw, frameHeight: fh, cols, rows, totalFrames } = meta;
console.log(`#${id}  sheet ${png.width}x${png.height}  frame ${fw}x${fh}  grid ${cols}x${rows}  frames ${totalFrames}`);

function cellStats(f) {
  const col = f % cols, row = Math.floor(f / cols);
  const ox = col * fw, oy = row * fh;
  let opaque = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
  // count horizontal transparent<->opaque transitions per row: streaky garbage has many
  let transitions = 0;
  for (let y = 0; y < fh; y++) {
    let prev = false;
    for (let x = 0; x < fw; x++) {
      const i = ((oy + y) * png.width + (ox + x)) << 2;
      const on = png.data[i + 3] > 16;
      if (on) { opaque++; if (x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
      if (on !== prev) transitions++;
      prev = on;
    }
  }
  const cov = opaque / (fw * fh);
  return { cov, bbox: maxX<0 ? null : [minX,minY,maxX,maxY], tpr: transitions / fh };
}

for (const f of [0, 1, 2, Math.floor(totalFrames/2), totalFrames-1]) {
  if (f >= totalFrames) continue;
  const s = cellStats(f);
  console.log(`  frame ${String(f).padStart(2)}  coverage ${(s.cov*100).toFixed(1)}%  bbox ${s.bbox ? s.bbox.join(',') : 'EMPTY'}  transitions/row ${s.tpr.toFixed(1)}`);
}
console.log('  (a clean sprite has ~2-8 transitions/row; streaky garbage has 20+)');
