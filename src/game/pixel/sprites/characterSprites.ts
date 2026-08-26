import * as THREE from 'three';

export type Dir8 = 'down' | 'down_right' | 'right' | 'up_right' | 'up' | 'up_left' | 'left' | 'down_left';
export type AnimState = 'idle' | 'walk';
export type WalkFrame = 0 | 1 | 2 | 3;

const FRAME_COUNT = 4;
const loader = new THREE.TextureLoader();

const DIR_FILES: Record<Dir8, string> = {
  down: 'Character_Down',
  down_right: 'Character_DownRight',
  right: 'Character_Right',
  up_right: 'Character_UpRight',
  up: 'Character_Up',
  up_left: 'Character_UpLeft',
  left: 'Character_Left',
  down_left: 'Character_DownLeft',
};

const base = '/assets/characters/TopDownCharacter/Character/';

const textureCache = new Map<string, THREE.Texture>();
const loadingCache = new Map<string, Promise<THREE.Texture>>();

function loadDirTexture(dir: Dir8): THREE.Texture {
  const key = `char-${dir}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const existing = loadingCache.get(key);
  if (existing) {
    // Return a placeholder that will be replaced when loaded
    const placeholder = new THREE.Texture();
    placeholder.magFilter = THREE.NearestFilter;
    placeholder.minFilter = THREE.NearestFilter;
    existing.then((tex) => {
      placeholder.image = tex.image;
      placeholder.needsUpdate = true;
    });
    textureCache.set(key, placeholder);
    return placeholder;
  }

  const url = `${base}${DIR_FILES[dir]}.png`;
  const promise = new Promise<THREE.Texture>((resolve) => {
    loader.load(url, (tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(1 / FRAME_COUNT, 1);
      resolve(tex);
    });
  });

  const placeholder = new THREE.Texture();
  placeholder.magFilter = THREE.NearestFilter;
  placeholder.minFilter = THREE.NearestFilter;
  loadingCache.set(key, promise);
  textureCache.set(key, placeholder);

  promise.then((tex) => {
    const cached = textureCache.get(key);
    if (cached) {
      cached.image = tex.image;
      cached.needsUpdate = true;
      // Copy settings
      cached.repeat.set(1 / FRAME_COUNT, 1);
      cached.magFilter = THREE.NearestFilter;
      cached.minFilter = THREE.NearestFilter;
      cached.colorSpace = THREE.SRGBColorSpace;
    }
  });

  return placeholder;
}

export function getCharacterTexture(dir: Dir8): THREE.Texture {
  return loadDirTexture(dir);
}

export function setCharacterFrame(tex: THREE.Texture, frame: WalkFrame) {
  tex.offset.x = frame * (1 / FRAME_COUNT);
  tex.needsUpdate = true;
}

export function ensureCharacterTexturesLoaded(): void {
  const dirs = Object.keys(DIR_FILES) as Dir8[];
  for (const dir of dirs) {
    loadDirTexture(dir);
  }
}
