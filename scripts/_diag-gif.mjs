import { readFileSync } from 'fs';
import { parseGIF, decompressFrames } from 'gifuct-js';

for (const id of ['025', '006', '003']) {
  const gif = parseGIF(readFileSync(`public/assets/pokemon/${id}/animated.gif`));
  const frames = decompressFrames(gif, true);
  console.log(`#${id}  lsd ${gif.lsd.width}x${gif.lsd.height}  frames ${frames.length}`);
  const uniq = new Set();
  for (const f of frames) uniq.add(`${f.dims.width}x${f.dims.height}@${f.dims.left},${f.dims.top} disp=${f.disposalType}`);
  console.log(`  distinct frame rects: ${uniq.size}`);
  for (const u of [...uniq].slice(0, 6)) console.log(`    ${u}`);
  const f0 = frames[0], f1 = frames[1];
  console.log(`  frame0 patch len ${f0.patch.length}  expected(dims) ${f0.dims.width*f0.dims.height*4}  expected(lsd) ${gif.lsd.width*gif.lsd.height*4}`);
  console.log(`  frame1 patch len ${f1.patch.length}  expected(dims) ${f1.dims.width*f1.dims.height*4}  expected(lsd) ${gif.lsd.width*gif.lsd.height*4}`);
  console.log('');
}
