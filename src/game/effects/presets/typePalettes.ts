import type { PokemonType } from '../../../data/pokemon/schemas/index';
import type { ParticleTexture } from '../types';

export interface TypePalette {
  colors: [string, string, string, string];
  shape: ParticleTexture;
  heroShape: 'slash' | 'impact' | 'flame' | 'droplet' | 'bolt' | 'leaf' | 'shard' | 'dust' | 'wind' | 'ring' | 'wisp' | 'spiral' | 'void' | 'sparkle';
  motion: 'linear' | 'arc' | 'rising' | 'flicker' | 'flutter' | 'drift' | 'bounce' | 'swirl' | 'sink' | 'snap' | 'float' | 'sweep' | 'swarm' | 'spiral';
  secondary: 'motes' | 'embers' | 'splash' | 'sparks' | 'leaves' | 'frost' | 'dust' | 'bubbles' | 'pebbles' | 'feathers' | 'orbiters' | 'swarm' | 'wisps' | 'spirals' | 'embers_dark' | 'shards' | 'sparkles';
  impact: 'burst' | 'star' | 'splash' | 'crack' | 'scatter' | 'shatter' | 'implosion' | 'glint' | 'twinkle';
  motionConfig: {
    easeIn: number;
    easeOut: number;
    arcHeight?: number;
    jitter?: number;
    fadeIn?: number;
    fadeOut?: number;
    rotation?: number;
  };
}

export const TYPE_PALETTES: Record<PokemonType, TypePalette> = {
  normal: {
    colors: ['#ffffff', '#f5f5dc', '#d4c5a0', '#a8a878'],
    shape: 'circle',
    heroShape: 'impact',
    motion: 'linear',
    secondary: 'motes',
    impact: 'star',
    motionConfig: { easeIn: 0.2, easeOut: 0.4, arcHeight: 0.1 },
  },
  fire: {
    colors: ['#ff4020', '#ff8040', '#ffc060', '#fff0a0'],
    shape: 'circle',
    heroShape: 'flame',
    motion: 'rising',
    secondary: 'embers',
    impact: 'burst',
    motionConfig: { easeIn: 0.1, easeOut: 0.3, arcHeight: 0.3, rotation: 0.5 },
  },
  water: {
    colors: ['#1890ff', '#40b0ff', '#80d8ff', '#c0f0ff'],
    shape: 'drop',
    heroShape: 'droplet',
    motion: 'arc',
    secondary: 'splash',
    impact: 'splash',
    motionConfig: { easeIn: 0.15, easeOut: 0.5, arcHeight: 0.4 },
  },
  electric: {
    colors: ['#fff030', '#fff860', '#ffffff', '#f0f8ff'],
    shape: 'diamond',
    heroShape: 'bolt',
    motion: 'snap',
    secondary: 'sparks',
    impact: 'glint',
    motionConfig: { easeIn: 0.05, easeOut: 0.1, jitter: 0.15 },
  },
  grass: {
    colors: ['#40a020', '#60c030', '#90e050', '#c0ff80'],
    shape: 'leaf',
    heroShape: 'leaf',
    motion: 'flutter',
    secondary: 'leaves',
    impact: 'scatter',
    motionConfig: { easeIn: 0.2, easeOut: 0.6, rotation: 2.0, arcHeight: 0.2 },
  },
  ice: {
    colors: ['#80e8ff', '#b0f8ff', '#e0ffff', '#ffffff'],
    shape: 'shard',
    heroShape: 'shard',
    motion: 'drift',
    secondary: 'frost',
    impact: 'shatter',
    motionConfig: { easeIn: 0.3, easeOut: 0.4, arcHeight: 0.1 },
  },
  fighting: {
    colors: ['#c03028', '#e04030', '#ff6040', '#ffa080'],
    shape: 'square',
    heroShape: 'impact',
    motion: 'linear',
    secondary: 'dust',
    impact: 'star',
    motionConfig: { easeIn: 0.05, easeOut: 0.2 },
  },
  poison: {
    colors: ['#a040a0', '#c060c0', '#e080e0', '#ffa0ff'],
    shape: 'circle',
    heroShape: 'impact',
    motion: 'rising',
    secondary: 'bubbles',
    impact: 'burst',
    motionConfig: { easeIn: 0.3, easeOut: 0.5, arcHeight: 0.15 },
  },
  ground: {
    colors: ['#c09040', '#d8b060', '#e8d080', '#f0e0a0'],
    shape: 'square',
    heroShape: 'dust',
    motion: 'bounce',
    secondary: 'pebbles',
    impact: 'crack',
    motionConfig: { easeIn: 0.1, easeOut: 0.3, arcHeight: 0.25 },
  },
  flying: {
    colors: ['#a890f0', '#c8b8ff', '#e0d8ff', '#f0f0ff'],
    shape: 'diamond',
    heroShape: 'wind',
    motion: 'sweep',
    secondary: 'feathers',
    impact: 'scatter',
    motionConfig: { easeIn: 0.15, easeOut: 0.4, arcHeight: 0.15 },
  },
  psychic: {
    colors: ['#f85888', '#ff80a0', '#ffb0c8', '#ffd8e8'],
    shape: 'ring',
    heroShape: 'ring',
    motion: 'swirl',
    secondary: 'orbiters',
    impact: 'twinkle',
    motionConfig: { easeIn: 0.4, easeOut: 0.6, rotation: 1.5 },
  },
  bug: {
    colors: ['#a8b820', '#c8d840', '#e8f060', '#f8ff80'],
    shape: 'diamond',
    heroShape: 'impact',
    motion: 'swarm',
    secondary: 'swarm',
    impact: 'scatter',
    motionConfig: { easeIn: 0.1, easeOut: 0.3, jitter: 0.2 },
  },
  rock: {
    colors: ['#b0a060', '#c8b878', '#e0d090', '#f0e8b0'],
    shape: 'square',
    heroShape: 'dust',
    motion: 'bounce',
    secondary: 'pebbles',
    impact: 'crack',
    motionConfig: { easeIn: 0.08, easeOut: 0.25, arcHeight: 0.3 },
  },
  ghost: {
    colors: ['#705898', '#9070b8', '#b090d8', '#d0b8f0'],
    shape: 'smoke',
    heroShape: 'wisp',
    motion: 'float',
    secondary: 'wisps',
    impact: 'implosion',
    motionConfig: { easeIn: 0.5, easeOut: 0.7, fadeIn: 0.3, fadeOut: 0.5 },
  },
  dragon: {
    colors: ['#7038f8', '#9058ff', '#b080ff', '#d0b0ff'],
    shape: 'shard',
    heroShape: 'spiral',
    motion: 'spiral',
    secondary: 'spirals',
    impact: 'burst',
    motionConfig: { easeIn: 0.1, easeOut: 0.3, rotation: 3.0, arcHeight: 0.2 },
  },
  dark: {
    colors: ['#302020', '#503040', '#805060', '#b08090'],
    shape: 'smoke',
    heroShape: 'void',
    motion: 'sink',
    secondary: 'embers_dark',
    impact: 'implosion',
    motionConfig: { easeIn: 0.2, easeOut: 0.4, arcHeight: -0.1 },
  },
  steel: {
    colors: ['#b8b8d0', '#d0d0e8', '#e8e8ff', '#ffffff'],
    shape: 'shard',
    heroShape: 'impact',
    motion: 'linear',
    secondary: 'shards',
    impact: 'glint',
    motionConfig: { easeIn: 0.05, easeOut: 0.15 },
  },
  fairy: {
    colors: ['#ff90b0', '#ffb0c8', '#ffd0e0', '#fff0f8'],
    shape: 'star',
    heroShape: 'sparkle',
    motion: 'float',
    secondary: 'sparkles',
    impact: 'twinkle',
    motionConfig: { easeIn: 0.3, easeOut: 0.6, arcHeight: 0.1, rotation: 0.8 },
  },
};

export function getTypePalette(type: PokemonType): TypePalette {
  return TYPE_PALETTES[type];
}
