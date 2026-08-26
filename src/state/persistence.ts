import type { SaveGame } from '../types/game';

const SAVE_KEY = 'pokespire-save-v1';

export function saveGame(state: SaveGame): void {
  try {
    const data = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, data);
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export function loadSave(): SaveGame | null {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as SaveGame;
    if (parsed.version !== 1) {
      console.warn('Save version mismatch, resetting');
      return null;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load save:', error);
    return null;
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}