import type { MapExit } from '../mapTypes';
import type { Direction } from '../../types/game';

export interface ConnectionEnd {
  map: string;
  edge: 'N' | 'E' | 'S' | 'W';
  from: number;
  to: number;
  spawnX: number;
  spawnY: number;
  facing: Direction;
}

export interface MapConnection { a: ConnectionEnd; b: ConnectionEnd; }

export const CONNECTIONS: MapConnection[] = [
  // coastal-city E ↔ route-1-coast-road W
  {
    a: { map: 'coastal-city', edge: 'E', from: 200, to: 212, spawnX: 8, spawnY: 376, facing: 'right' },
    b: { map: 'route-1-coast-road', edge: 'W', from: 370, to: 382, spawnX: 496, spawnY: 206, facing: 'left' },
  },
  // route-1-coast-road E ↔ verdant-forest W
  {
    a: { map: 'route-1-coast-road', edge: 'E', from: 370, to: 382, spawnX: 8, spawnY: 206, facing: 'right' },
    b: { map: 'verdant-forest', edge: 'W', from: 196, to: 208, spawnX: 500, spawnY: 206, facing: 'left' },
  },
  // verdant-forest E ↔ old-stone-bridge W
  {
    a: { map: 'verdant-forest', edge: 'E', from: 196, to: 208, spawnX: 8, spawnY: 202, facing: 'right' },
    b: { map: 'old-stone-bridge', edge: 'W', from: 196, to: 208, spawnX: 228, spawnY: 202, facing: 'left' },
  },
  // old-stone-bridge E ↔ dusk-outskirts W
  {
    a: { map: 'old-stone-bridge', edge: 'E', from: 196, to: 208, spawnX: 8, spawnY: 286, facing: 'right' },
    b: { map: 'dusk-outskirts', edge: 'W', from: 280, to: 292, spawnX: 688, spawnY: 206, facing: 'left' },
  },
  // dusk-outskirts E ↔ dusk-downtown W
  {
    a: { map: 'dusk-outskirts', edge: 'E', from: 280, to: 292, spawnX: 8, spawnY: 206, facing: 'right' },
    b: { map: 'dusk-downtown', edge: 'W', from: 200, to: 212, spawnX: 496, spawnY: 206, facing: 'left' },
  },
  // Coral Coast connections (PHASE 5)
  // coastal-city N ↔ harbor-district S
  {
    a: { map: 'coastal-city', edge: 'N', from: 240, to: 260, spawnX: 206, spawnY: 340, facing: 'down' },
    b: { map: 'harbor-district', edge: 'S', from: 194, to: 214, spawnX: 206, spawnY: 20, facing: 'up' },
  },
  // harbor-district W ↔ lighthouse-point E
  {
    a: { map: 'harbor-district', edge: 'W', from: 164, to: 184, spawnX: 278, spawnY: 150, facing: 'right' },
    b: { map: 'lighthouse-point', edge: 'E', from: 140, to: 160, spawnX: 20, spawnY: 150, facing: 'left' },
  },
  // coastal-city S ↔ coastal-wetlands N
  {
    a: { map: 'coastal-city', edge: 'S', from: 296, to: 316, spawnX: 306, spawnY: 20, facing: 'down' },
    b: { map: 'coastal-wetlands', edge: 'N', from: 294, to: 314, spawnX: 306, spawnY: 540, facing: 'up' },
  },
  // route-1-coast-road E ↔ seabreeze-cove W
  {
    a: { map: 'route-1-coast-road', edge: 'E', from: 100, to: 130, spawnX: 20, spawnY: 120, facing: 'right' },
    b: { map: 'seabreeze-cove', edge: 'W', from: 114, to: 144, spawnX: 496, spawnY: 120, facing: 'left' },
  },
  // seabreeze-cove S ↔ tidepool-flats N
  {
    a: { map: 'seabreeze-cove', edge: 'S', from: 280, to: 310, spawnX: 20, spawnY: 100, facing: 'right' },
    b: { map: 'tidepool-flats', edge: 'N', from: 94, to: 124, spawnX: 300, spawnY: 500, facing: 'up' },
  },
  // seabreeze-cove E ↔ gull-rock-isle W
  {
    a: { map: 'seabreeze-cove', edge: 'E', from: 240, to: 260, spawnX: 20, spawnY: 150, facing: 'right' },
    b: { map: 'gull-rock-isle', edge: 'W', from: 140, to: 160, spawnX: 340, spawnY: 150, facing: 'left' },
  },
  // Heartland Wilds connections (PHASE 6)
  // coastal-city S → coastal-wetlands N (already done above)
  // verdant-forest N ↔ route-2-meadowway S
  {
    a: { map: 'verdant-forest', edge: 'N', from: 370, to: 400, spawnX: 376, spawnY: 580, facing: 'down' },
    b: { map: 'route-2-meadowway', edge: 'S', from: 364, to: 394, spawnX: 376, spawnY: 20, facing: 'up' },
  },
  // route-2-meadowway N ↔ whisperwind-meadow S
  {
    a: { map: 'route-2-meadowway', edge: 'N', from: 384, to: 404, spawnX: 396, spawnY: 620, facing: 'down' },
    b: { map: 'whisperwind-meadow', edge: 'S', from: 384, to: 404, spawnX: 396, spawnY: 20, facing: 'up' },
  },
  // verdant-forest N → forest-hollow (side area, hidden entrance)
  {
    a: { map: 'verdant-forest', edge: 'N', from: 200, to: 220, spawnX: 230, spawnY: 460, facing: 'down' },
    b: { map: 'forest-hollow', edge: 'S', from: 218, to: 238, spawnX: 218, spawnY: 20, facing: 'up' },
  },
  // verdant-forest S ↔ route-3-riverside N
  {
    a: { map: 'verdant-forest', edge: 'S', from: 370, to: 400, spawnX: 356, spawnY: 20, facing: 'right' },
    b: { map: 'route-3-riverside', edge: 'N', from: 344, to: 374, spawnX: 356, spawnY: 620, facing: 'up' },
  },
  // route-3-riverside S ↔ old-stone-bridge N
  {
    a: { map: 'route-3-riverside', edge: 'S', from: 344, to: 374, spawnX: 118, spawnY: 20, facing: 'right' },
    b: { map: 'old-stone-bridge', edge: 'N', from: 108, to: 138, spawnX: 118, spawnY: 400, facing: 'up' },
  },
  // route-3-riverside E ↔ mistmere-lake W
  {
    a: { map: 'route-3-riverside', edge: 'E', from: 304, to: 324, spawnX: 20, spawnY: 316, facing: 'right' },
    b: { map: 'mistmere-lake', edge: 'W', from: 304, to: 324, spawnX: 700, spawnY: 316, facing: 'left' },
  },
  // old-stone-bridge S ↔ route-4-foothill N
  {
    a: { map: 'old-stone-bridge', edge: 'S', from: 108, to: 138, spawnX: 356, spawnY: 20, facing: 'down' },
    b: { map: 'route-4-foothill', edge: 'N', from: 344, to: 374, spawnX: 356, spawnY: 640, facing: 'up' },
  },
  // route-4-foothill S ↔ craggy-highlands N
  {
    a: { map: 'route-4-foothill', edge: 'S', from: 344, to: 374, spawnX: 386, spawnY: 20, facing: 'down' },
    b: { map: 'craggy-highlands', edge: 'N', from: 374, to: 404, spawnX: 386, spawnY: 700, facing: 'up' },
  },
  // craggy-highlands E ↔ echo-cave-entrance W
  {
    a: { map: 'craggy-highlands', edge: 'E', from: 344, to: 374, spawnX: 178, spawnY: 320, facing: 'right' },
    b: { map: 'echo-cave-entrance', edge: 'W', from: 158, to: 188, spawnX: 760, spawnY: 356, facing: 'left' },
  },
  // craggy-highlands E ↔ sunken-grotto W (side area)
  {
    a: { map: 'craggy-highlands', edge: 'E', from: 200, to: 230, spawnX: 218, spawnY: 400, facing: 'right' },
    b: { map: 'sunken-grotto', edge: 'W', from: 198, to: 228, spawnX: 760, spawnY: 218, facing: 'left' },
  },
  // craggy-highlands S ↔ route-4b-switchback N
  {
    a: { map: 'craggy-highlands', edge: 'S', from: 374, to: 404, spawnX: 276, spawnY: 20, facing: 'down' },
    b: { map: 'route-4b-switchback', edge: 'N', from: 264, to: 294, spawnX: 276, spawnY: 600, facing: 'up' },
  },
  // Dusk Metro connections (PHASE 7)
  // route-4b-switchback S ↔ route-5-dusk-approach N
  {
    a: { map: 'route-4b-switchback', edge: 'S', from: 264, to: 294, spawnX: 356, spawnY: 20, facing: 'down' },
    b: { map: 'route-5-dusk-approach', edge: 'N', from: 344, to: 374, spawnX: 356, spawnY: 600, facing: 'up' },
  },
  // route-5-dusk-approach S ↔ dusk-outskirts N (already done above)
  // route-5-dusk-approach E ↔ windmill-farms W
  {
    a: { map: 'route-5-dusk-approach', edge: 'E', from: 294, to: 314, spawnX: 20, spawnY: 280, facing: 'right' },
    b: { map: 'windmill-farms', edge: 'W', from: 274, to: 294, spawnX: 660, spawnY: 280, facing: 'left' },
  },
  // dusk-outskirts N ↔ dusk-west-gate S
  {
    a: { map: 'dusk-outskirts', edge: 'N', from: 340, to: 360, spawnX: 232, spawnY: 412, facing: 'down' },
    b: { map: 'dusk-west-gate', edge: 'S', from: 220, to: 240, spawnX: 232, spawnY: 20, facing: 'up' },
  },
  // dusk-west-gate E ↔ dusk-residential W
  {
    a: { map: 'dusk-west-gate', edge: 'E', from: 204, to: 224, spawnX: 20, spawnY: 216, facing: 'right' },
    b: { map: 'dusk-residential', edge: 'W', from: 204, to: 224, spawnX: 484, spawnY: 216, facing: 'left' },
  },
  // dusk-residential E ↔ dusk-downtown W (already done above)
  // dusk-downtown E ↔ dusk-night-market W
  {
    a: { map: 'dusk-downtown', edge: 'E', from: 200, to: 220, spawnX: 20, spawnY: 170, facing: 'right' },
    b: { map: 'dusk-night-market', edge: 'W', from: 164, to: 184, spawnX: 492, spawnY: 170, facing: 'left' },
  },
  // dusk-downtown S ↔ dusk-industrial N
  {
    a: { map: 'dusk-downtown', edge: 'S', from: 220, to: 250, spawnX: 238, spawnY: 20, facing: 'down' },
    b: { map: 'dusk-industrial', edge: 'N', from: 224, to: 254, spawnX: 238, spawnY: 412, facing: 'up' },
  },
  // dusk-downtown E ↔ dusk-riverside-park W
  {
    a: { map: 'dusk-downtown', edge: 'E', from: 400, to: 420, spawnX: 20, spawnY: 156, facing: 'right' },
    b: { map: 'dusk-riverside-park', edge: 'W', from: 154, to: 174, spawnX: 492, spawnY: 156, facing: 'left' },
  },
  // dusk-riverside-park E ↔ dusk-heights W
  {
    a: { map: 'dusk-riverside-park', edge: 'E', from: 154, to: 174, spawnX: 218, spawnY: 380, facing: 'right' },
    b: { map: 'dusk-heights', edge: 'W', from: 194, to: 214, spawnX: 340, spawnY: 156, facing: 'left' },
  },
  // dusk-riverside-park S ↔ route-6-metro-fringe N
  {
    a: { map: 'dusk-riverside-park', edge: 'S', from: 154, to: 174, spawnX: 346, spawnY: 20, facing: 'down' },
    b: { map: 'route-6-metro-fringe', edge: 'N', from: 334, to: 354, spawnX: 346, spawnY: 580, facing: 'up' },
  },
  // dusk-west-gate S ↔ dusk-depot N
  {
    a: { map: 'dusk-west-gate', edge: 'S', from: 114, to: 134, spawnX: 126, spawnY: 20, facing: 'down' },
    b: { map: 'dusk-depot', edge: 'N', from: 114, to: 134, spawnX: 126, spawnY: 340, facing: 'up' },
  },
];

function endToExit(here: ConnectionEnd, there: ConnectionEnd, hereW: number, hereH: number): MapExit {
  const THICK = 2;
  let x = 0, y = 0, w = 0, h = 0;
  const len = here.to - here.from;
  if (here.edge === 'N') { x = here.from; y = 0;            w = len; h = THICK; }
  if (here.edge === 'S') { x = here.from; y = hereH - THICK; w = len; h = THICK; }
  if (here.edge === 'W') { x = 0;            y = here.from; w = THICK; h = len; }
  if (here.edge === 'E') { x = hereW - THICK; y = here.from; w = THICK; h = len; }
  return { x, y, w, h, toMap: there.map, spawnX: there.spawnX, spawnY: there.spawnY, facing: there.facing };
}

import { getMapMeta } from './mapRegistry';

export function compileExitsFor(mapId: string): MapExit[] {
  const out: MapExit[] = [];
  for (const c of CONNECTIONS) {
    if (c.a.map === mapId) {
      const m = getMapMeta(mapId)!; out.push(endToExit(c.a, c.b, m.width, m.height));
    }
    if (c.b.map === mapId) {
      const m = getMapMeta(mapId)!; out.push(endToExit(c.b, c.a, m.width, m.height));
    }
  }
  return out;
}
