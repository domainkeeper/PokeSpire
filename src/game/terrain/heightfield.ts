import * as THREE from 'three';
import type { GameMap, TileType } from '../../data/mapTypes';
import { TILE_SIZE, WATER_DEPTH, ELEVATION_STEP, TERRAIN_CELL } from '../../utils/constants';

/**
 * Terrain heightfield with flat terraces and real cliff faces.
 *
 * Design:
 *  - Elevation is authored per micro-tile (map.elevation, in integer steps) and
 *    downsampled to TERRAIN_CELL-sized terrain cells. Micro-tiles stay the unit
 *    for collision and for the ground texture, so detail is preserved while the
 *    mesh stays cheap.
 *  - Each terrain cell gets its OWN four vertices (not shared with neighbours),
 *    so tops are perfectly flat and elevation changes become crisp steps rather
 *    than smooth ramps. This is what gives the stacked-terrace look.
 *  - Wherever a cell's neighbour is lower, a vertical skirt quad is emitted to
 *    close the gap. Those skirts ARE the cliff/bank faces.
 *  - Water cells sit WATER_DEPTH below their terrace, so shorelines get the same
 *    treatment for free.
 *
 * UV 1 is the ground texture (whole-map planar). UV 2 (`uvFace`) marks vertical
 * faces so the material can tint them with the cliff ramp.
 */

export interface TerrainData {
  geometry: THREE.BufferGeometry;
  /** Surface height in world units per micro-tile, for actor grounding. */
  heightAt: (gx: number, gy: number) => number;
  /** Elevation steps per micro-tile (already resolved / defaulted). */
  steps: Int16Array;
  minY: number;
  maxY: number;
}

const cache = new Map<string, TerrainData>();

function isWater(t: TileType | undefined): boolean {
  return t === 'water';
}

/** Terrace surface height for a terrain cell, in world units. */
function cellHeight(step: number, water: boolean): number {
  return step * ELEVATION_STEP - (water ? WATER_DEPTH : 0);
}

export function buildTerrain(mapData: GameMap): TerrainData {
  const key = `${mapData.name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { width, height } = mapData;
  const cw = Math.ceil(width / TERRAIN_CELL);
  const ch = Math.ceil(height / TERRAIN_CELL);

  // ---- resolve per-micro-tile elevation -----------------------------------
  const steps = new Int16Array(width * height);
  if (mapData.elevation) {
    for (let y = 0; y < height; y++) {
      const row = mapData.elevation[y];
      if (!row) continue;
      for (let x = 0; x < width; x++) steps[y * width + x] = row[x] ?? 0;
    }
  }

  // ---- downsample to terrain cells ----------------------------------------
  // Elevation: max wins, so a terrace never sinks below authored ground.
  // Water: any water micro-tile makes the cell water, so ponds never vanish.
  const cellStep = new Int16Array(cw * ch);
  const cellWater = new Uint8Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      let s = -32768;
      let w = 0;
      for (let sy = 0; sy < TERRAIN_CELL; sy++) {
        const gy = cy * TERRAIN_CELL + sy;
        if (gy >= height) continue;
        const groundRow = mapData.ground[gy];
        for (let sx = 0; sx < TERRAIN_CELL; sx++) {
          const gx = cx * TERRAIN_CELL + sx;
          if (gx >= width) continue;
          s = Math.max(s, steps[gy * width + gx]);
          if (isWater(groundRow?.[gx])) w = 1;
        }
      }
      cellStep[cy * cw + cx] = s === -32768 ? 0 : s;
      cellWater[cy * cw + cx] = w;
    }
  }

  const cellY = new Float32Array(cw * ch);
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < cw * ch; i++) {
    const y = cellHeight(cellStep[i], cellWater[i] === 1);
    cellY[i] = y;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // ---- count geometry -----------------------------------------------------
  const cellSize = TERRAIN_CELL * TILE_SIZE;
  let skirtCount = 0;
  const neighbourY = (cx: number, cy: number): number => {
    if (cx < 0 || cy < 0 || cx >= cw || cy >= ch) return -Infinity; // map edge: full skirt
    return cellY[cy * cw + cx];
  };
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      const y = cellY[cy * cw + cx];
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const ny = neighbourY(cx + dx, cy + dy);
        if (ny < y - 1e-6) skirtCount++;
      }
    }
  }

  const quadCount = cw * ch + skirtCount;
  const positions = new Float32Array(quadCount * 4 * 3);
  const normals = new Float32Array(quadCount * 4 * 3);
  const uvs = new Float32Array(quadCount * 4 * 2);
  /** 0 = horizontal top surface, 1 = vertical cliff face. */
  const faceKind = new Float32Array(quadCount * 4);
  const indices = new Uint32Array(quadCount * 6);

  let v = 0;
  let ix = 0;

  const pushQuad = (
    p: readonly [number, number, number][],
    n: readonly [number, number, number],
    uv: readonly [number, number][],
    kind: number,
  ) => {
    const base = v;
    for (let i = 0; i < 4; i++) {
      positions[v * 3] = p[i][0];
      positions[v * 3 + 1] = p[i][1];
      positions[v * 3 + 2] = p[i][2];
      normals[v * 3] = n[0];
      normals[v * 3 + 1] = n[1];
      normals[v * 3 + 2] = n[2];
      uvs[v * 2] = uv[i][0];
      uvs[v * 2 + 1] = uv[i][1];
      faceKind[v] = kind;
      v++;
    }
    indices[ix++] = base;
    indices[ix++] = base + 1;
    indices[ix++] = base + 2;
    indices[ix++] = base;
    indices[ix++] = base + 2;
    indices[ix++] = base + 3;
  };

  // Planar UV over the whole map; canvas textures are Y-flipped vs world Z.
  const worldW = width * TILE_SIZE;
  const worldD = height * TILE_SIZE;
  const uvAt = (x: number, z: number): [number, number] => [x / worldW, 1 - z / worldD];

  // ---- tops ---------------------------------------------------------------
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      const y = cellY[cy * cw + cx];
      const x0 = cx * cellSize;
      const z0 = cy * cellSize;
      const x1 = x0 + cellSize;
      const z1 = z0 + cellSize;
      pushQuad(
        [
          [x0, y, z0],
          [x0, y, z1],
          [x1, y, z1],
          [x1, y, z0],
        ],
        [0, 1, 0],
        [uvAt(x0, z0), uvAt(x0, z1), uvAt(x1, z1), uvAt(x1, z0)],
        0,
      );
    }
  }

  // ---- skirts (cliff / bank faces) ---------------------------------------
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      const y = cellY[cy * cw + cx];
      const x0 = cx * cellSize;
      const z0 = cy * cellSize;
      const x1 = x0 + cellSize;
      const z1 = z0 + cellSize;

      const edges = [
        { d: [1, 0] as const, a: [x1, z0] as const, b: [x1, z1] as const, n: [1, 0, 0] as const },
        { d: [-1, 0] as const, a: [x0, z1] as const, b: [x0, z0] as const, n: [-1, 0, 0] as const },
        { d: [0, 1] as const, a: [x1, z1] as const, b: [x0, z1] as const, n: [0, 0, 1] as const },
        { d: [0, -1] as const, a: [x0, z0] as const, b: [x1, z0] as const, n: [0, 0, -1] as const },
      ];

      for (const e of edges) {
        const nyRaw = neighbourY(cx + e.d[0], cy + e.d[1]);
        if (nyRaw >= y - 1e-6) continue;
        // At the map edge drop a generous skirt so no gap shows under the world.
        const bottom = nyRaw === -Infinity ? minY - ELEVATION_STEP * 4 : nyRaw;
        pushQuad(
          [
            [e.a[0], y, e.a[1]],
            [e.a[0], bottom, e.a[1]],
            [e.b[0], bottom, e.b[1]],
            [e.b[0], y, e.b[1]],
          ],
          e.n,
          // Cliff faces sample the ground texture at their top edge; the
          // material tints them via faceKind so they read as rock, not grass.
          [uvAt(e.a[0], e.a[1]), uvAt(e.a[0], e.a[1]), uvAt(e.b[0], e.b[1]), uvAt(e.b[0], e.b[1])],
          1,
        );
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('faceKind', new THREE.BufferAttribute(faceKind, 1));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeBoundingSphere();

  const heightAt = (gx: number, gy: number): number => {
    const cx = Math.floor(gx / TERRAIN_CELL);
    const cy = Math.floor(gy / TERRAIN_CELL);
    if (cx < 0 || cy < 0 || cx >= cw || cy >= ch) return 0;
    return cellY[cy * cw + cx];
  };

  const data: TerrainData = { geometry: geo, heightAt, steps, minY, maxY };
  cache.set(key, data);
  return data;
}

/** Elevation steps at a micro-tile, for collision. */
export function elevationAt(mapData: GameMap, gx: number, gy: number): number {
  if (!mapData.elevation) return 0;
  if (gx < 0 || gy < 0 || gx >= mapData.width || gy >= mapData.height) return 0;
  return mapData.elevation[gy]?.[gx] ?? 0;
}
