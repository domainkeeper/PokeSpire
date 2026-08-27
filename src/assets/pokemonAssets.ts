/**
 * Asset path resolution for Pokemon game assets.
 * All game code should use these functions instead of constructing paths manually.
 */

const PAD = (id: number) => String(id).padStart(3, '0');

const POKE_BASE = '/assets/pokemon';
const ITEM_BASE = '/assets/items';
const BERRY_BASE = '/assets/items/berries';
const TYPE_BASE = '/assets/types';
const BATTLE_BASE = '/assets/battle';

/** Get the base directory for a Pokemon's assets. */
export function pokemonDir(id: number): string {
  return `${POKE_BASE}/${PAD(id)}`;
}

/** Front-facing sprite (static). */
export function pokemonSprite(id: number): string {
  return `${pokemonDir(id)}/front.png`;
}

/** Back-facing sprite (static). */
export function pokemonBackSprite(id: number): string {
  return `${pokemonDir(id)}/back.png`;
}

/** Shiny front sprite. */
export function pokemonShinySprite(id: number): string {
  return `${pokemonDir(id)}/shiny-front.png`;
}

/** Shiny back sprite. */
export function pokemonShinyBackSprite(id: number): string {
  return `${pokemonDir(id)}/shiny-back.png`;
}

/** Party/Pokedex icon. */
export function pokemonIcon(id: number): string {
  return `${pokemonDir(id)}/icon.png`;
}

/** Animated sprite (GIF from Showdown). */
export function pokemonAnimated(id: number): string {
  return `${pokemonDir(id)}/animated.gif`;
}

/** Pokemon cry audio (.ogg). */
export function pokemonCry(id: number): string {
  return `${pokemonDir(id)}/cry.ogg`;
}

/** Form-specific sprite. */
export function pokemonFormSprite(id: number, formSlug: string): string {
  return `${pokemonDir(id)}/forms/${formSlug}/front.png`;
}

/** Item icon. Items use slugified names, not numeric IDs. */
export function itemIcon(itemSlug: string): string {
  return `${ITEM_BASE}/icons/${itemSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
}

/** Berry sprite. */
export function berrySprite(berrySlug: string): string {
  return `${BERRY_BASE}/${berrySlug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
}

/** Type icon. */
export function typeIcon(typeName: string): string {
  return `${TYPE_BASE}/${typeName.toLowerCase()}.png`;
}

/** Battle effect placeholder. */
export function battleEffect(effectName: string): string {
  return `${BATTLE_BASE}/effects/${effectName}.png`;
}

/** Status effect icon. */
export function statusIcon(statusName: string): string {
  return `${BATTLE_BASE}/status/${statusName}.png`;
}

/**
 * Fallback sprite for missing Pokemon assets.
 * Returns the path to a generic placeholder.
 */
export function fallbackSprite(): string {
  return `${POKE_BASE}/000/front.png`;
}

/**
 * Check if a sprite URL resolves to a real asset at runtime.
 * Returns true if the image loaded successfully, false otherwise.
 */
export function checkAssetExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
