import * as THREE from 'three';
import { TILE_ASSETS, getTileVariant, type TileType } from './tileRegistry';

const textureCache = new Map<string, THREE.Texture>();
const loadingPromises = new Map<string, Promise<THREE.Texture>>();

const loader = new THREE.TextureLoader();

function loadTileTexture(tileId: string): Promise<THREE.Texture> {
  if (textureCache.has(tileId)) {
    return Promise.resolve(textureCache.get(tileId)!);
  }
  if (loadingPromises.has(tileId)) {
    return loadingPromises.get(tileId)!;
  }

  const asset = TILE_ASSETS[tileId];
  if (!asset) {
    return Promise.reject(new Error(`Unknown tile: ${tileId}`));
  }

  const promise = new Promise<THREE.Texture>((resolve) => {
    loader.load(
      asset.path,
      (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(tileId, texture);
        resolve(texture);
      },
      undefined,
      () => {
        // Fallback: create a solid color texture
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, 0, 4, 4);
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        textureCache.set(tileId, tex);
        resolve(tex);
      },
    );
  });

  loadingPromises.set(tileId, promise);
  return promise;
}

// Preload a batch of tiles
export async function preloadTiles(tileIds: string[]): Promise<void> {
  const promises = tileIds.map(id => loadTileTexture(id).catch(() => {}));
  await Promise.all(promises);
}

// Get texture for a tile type at a position
export function getTileTexture(type: TileType, x: number, y: number): THREE.Texture | null {
  const variant = getTileVariant(type, x, y);
  return textureCache.get(variant) || null;
}

// Synchronous getter (only works after preload)
export function getTileTextureSync(tileId: string): THREE.Texture | null {
  return textureCache.get(tileId) || null;
}

// Get all tile IDs for preloading
export function getAllTileIds(): string[] {
  return Object.keys(TILE_ASSETS);
}

// Preload all tiles on startup
export async function preloadAllTiles(): Promise<void> {
  await preloadTiles(getAllTileIds());
}
