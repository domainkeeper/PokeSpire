import type { GameMap } from '../../data/mapTypes';
import { objectFootprint } from '../../utils/gridUtils';

const TILE_COLORS: Record<string, [number, number, number, number]> = {
  grass: [74, 124, 58, 255],
  path: [201, 184, 150, 255],
  water: [58, 143, 158, 255],
  dirt: [139, 109, 74, 255],
  sand: [212, 196, 154, 255],
};

/** Minimap color for each prop category. */
const PROP_COLORS: Record<string, [number, number, number, number]> = {
  tree_oak:   [34, 80, 34, 255],
  tree_small: [40, 90, 36, 255],
  tree_pine:  [28, 72, 32, 255],
  tree_palm:  [44, 88, 40, 255],
  bush:       [52, 100, 46, 255],
  bush_berry: [56, 96, 44, 255],
  house_small: [220, 200, 170, 255],
  house_large: [210, 190, 160, 255],
  shop:        [200, 185, 155, 255],
  rock_small: [140, 140, 140, 255],
  rock_large: [120, 120, 120, 255],
  boulder:    [100, 100, 100, 255],
  fence_wood:  [140, 100, 60, 255],
  fence_stone: [130, 130, 130, 255],
  well:      [70, 130, 160, 255],
  bench:     [140, 100, 55, 255],
  lamp_post: [220, 210, 160, 255],
  sign:      [200, 190, 170, 255],
  crate:     [160, 120, 60, 255],
  barrel:    [140, 100, 50, 255],
  flower:     [200, 120, 140, 255],
  mushroom:   [180, 100, 80, 255],
  grass_tuft: [80, 140, 60, 255],
  reed:       [60, 120, 50, 255],
  stump:      [120, 80, 40, 255],
  log:        [110, 75, 35, 255],
};

/** Bitmap resolution multiplier. 2 = each tile is 2x2 pixels on the bitmap. */
const BITMAP_SCALE = 2;

interface CachedBitmap {
  imageData: ImageData;
  /** Bitmap pixel dimensions (map tiles * BITMAP_SCALE). */
  width: number;
  height: number;
  /** Original map tile dimensions. */
  mapWidth: number;
  mapHeight: number;
}

const cache = new Map<string, CachedBitmap>();

function fillRect(
  buf: Uint8ClampedArray, bw: number,
  x0: number, y0: number, x1: number, y1: number,
  r: number, g: number, b: number, a: number,
) {
  const sa = a / 255;
  for (let y = Math.max(0, y0); y <= y1; y++) {
    for (let x = Math.max(0, x0); x <= x1; x++) {
      const i = (y * bw + x) << 2;
      const da = buf[i + 3] / 255;
      const oa = sa + da * (1 - sa);
      if (oa === 0) continue;
      buf[i]     = Math.round((r * sa + buf[i]     * da * (1 - sa)) / oa);
      buf[i + 1] = Math.round((g * sa + buf[i + 1] * da * (1 - sa)) / oa);
      buf[i + 2] = Math.round((b * sa + buf[i + 2] * da * (1 - sa)) / oa);
      buf[i + 3] = Math.round(oa * 255);
    }
  }
}

export function getWorldBitmap(mapData: GameMap): CachedBitmap {
  const hit = cache.get(mapData.name);
  if (hit) return hit;

  const S = BITMAP_SCALE;
  const mw = mapData.width;
  const mh = mapData.height;
  const bw = mw * S;
  const bh = mh * S;
  const imageData = new ImageData(bw, bh);
  const buf = imageData.data;
  const { ground } = mapData;

  // Pass 1: tile colors scaled up
  for (let ty = 0; ty < mh; ty++) {
    const row = ground[ty];
    for (let tx = 0; tx < mw; tx++) {
      const [r, g, b, a] = TILE_COLORS[row[tx]] ?? TILE_COLORS.grass;
      const px = tx * S;
      const py = ty * S;
      fillRect(buf, bw, px, py, px + S - 1, py + S - 1, r, g, b, a);
    }
  }

  // Pass 2: edge darkening (1px border at tile boundaries)
  for (let ty = 0; ty < mh; ty++) {
    for (let tx = 0; tx < mw; tx++) {
      const tile = ground[ty][tx];
      const left  = tx > 0 ? ground[ty][tx - 1] : undefined;
      const right = tx < mw - 1 ? ground[ty][tx + 1] : undefined;
      const up    = ty > 0 ? ground[ty - 1]?.[tx] : undefined;
      const down  = ty < mh - 1 ? ground[ty + 1]?.[tx] : undefined;
      if ((left && left !== tile) || (right && right !== tile) || (up && up !== tile) || (down && down !== tile)) {
        const px = tx * S;
        const py = ty * S;
        // Darken the outer 1px ring of this tile
        for (let dy = 0; dy < S; dy++) {
          for (let dx = 0; dx < S; dx++) {
            if (dx === 0 || dy === 0) {
              const i = ((py + dy) * bw + (px + dx)) << 2;
              buf[i] = Math.floor(buf[i] * 0.72);
              buf[i + 1] = Math.floor(buf[i + 1] * 0.72);
              buf[i + 2] = Math.floor(buf[i + 2] * 0.72);
            }
          }
        }
      }
    }
  }

  // Pass 3: draw objects at their actual footprint size (scaled)
  for (const obj of mapData.objects) {
    const color = PROP_COLORS[obj.type];
    if (!color) continue;
    const fp = objectFootprint(obj);
    const [r, g, b, a] = color;
    const x0 = obj.gx * S;
    const y0 = obj.gy * S;
    const x1 = x0 + fp.w * S - 1;
    const y1 = y0 + fp.h * S - 1;
    fillRect(buf, bw, x0, y0, x1, y1, r, g, b, a);
    // Dark border around the object for definition
    fillRect(buf, bw, x0, y0, x1, y0, 0, 0, 0, 60);
    fillRect(buf, bw, x0, y1, x1, y1, 0, 0, 0, 60);
    fillRect(buf, bw, x0, y0, x0, y1, 0, 0, 0, 60);
    fillRect(buf, bw, x1, y0, x1, y1, 0, 0, 0, 60);
  }

  // Pass 4: NPC markers
  for (const npc of mapData.npcPositions) {
    const px = npc.x * S + S / 2;
    const py = npc.y * S + S / 2;
    fillRect(buf, bw, px - 1, py - 1, px + 1, py + 1, 255, 255, 100, 220);
  }

  // Pass 5: pokemon markers
  if (mapData.pokemon) {
    for (const p of mapData.pokemon) {
      const px = p.gx * S + S / 2;
      const py = p.gy * S + S / 2;
      fillRect(buf, bw, px, py, px, py, 255, 160, 200, 200);
    }
  }

  const entry: CachedBitmap = { imageData, width: bw, height: bh, mapWidth: mw, mapHeight: mh };
  cache.set(mapData.name, entry);
  return entry;
}

export function invalidateWorldBitmap(mapName?: string): void {
  if (mapName) cache.delete(mapName);
  else cache.clear();
}
