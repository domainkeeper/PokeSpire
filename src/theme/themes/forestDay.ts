import type { Theme } from '../types';

/**
 * Forest Day - deeper desaturated greens, lower sun intensity, denser fog.
 * A canopy-filtered, slightly dim forest atmosphere.
 */
export const forestDay: Theme = {
  id: 'forest-day',
  name: 'Forest Day',
  background: '#4a7a5a',

  palette: {
    grass: {
      darkest: '#162e18',
      dark: '#244a22',
      base: '#346430',
      light: '#467e3e',
      lightest: '#609a56',
    },
    path: {
      darkest: '#5a4e38',
      dark: '#766a4e',
      base: '#948666',
      light: '#b0a280',
      lightest: '#cec0a0',
    },
    dirt: {
      darkest: '#3a2818',
      dark: '#543c24',
      base: '#6e5232',
      light: '#8a6a42',
      lightest: '#a68456',
    },
    sand: {
      darkest: '#7a6840',
      dark: '#9a8858',
      base: '#b8a672',
      light: '#d0c090',
      lightest: '#e8dab4',
    },
    stone: {
      darkest: '#2e3638',
      dark: '#485254',
      base: '#626e72',
      light: '#808c90',
      lightest: '#a4b0b4',
    },
    waterBed: {
      darkest: '#0a2028',
      dark: '#12343c',
      base: '#1a4852',
      light: '#245c68',
      lightest: '#2e7280',
    },
    waterSurface: {
      darkest: '#1e5a64',
      dark: '#2a7278',
      base: '#388c92',
      light: '#4ca8ae',
      lightest: '#70c4c8',
    },
    cliff: {
      darkest: '#2a1e14',
      dark: '#403020',
      base: '#584430',
      light: '#705840',
      lightest: '#8a6e52',
    },

    foliage: {
      darkest: '#0c2c12',
      dark: '#18421c',
      base: '#265a28',
      light: '#387436',
      lightest: '#4e9248',
    },
    foliageAlt: {
      darkest: '#14341a',
      dark: '#224e28',
      base: '#326a38',
      light: '#46884a',
      lightest: '#5ea860',
    },
    trunk: {
      darkest: '#1e120c',
      dark: '#322014',
      base: '#48301e',
      light: '#604228',
      lightest: '#785634',
    },
    rock: {
      darkest: '#2e3638',
      dark: '#485254',
      base: '#647074',
      light: '#849094',
      lightest: '#a8b4b8',
    },
    wood: {
      darkest: '#3a2818',
      dark: '#543c28',
      base: '#705438',
      light: '#8c6e4a',
      lightest: '#aa8a60',
    },

    wall: {
      darkest: '#7a8a7a',
      dark: '#98a898',
      base: '#b4c4b4',
      light: '#d0ded0',
      lightest: '#eaf2ea',
    },
    wallAlt: {
      darkest: '#5a6a66',
      dark: '#788a86',
      base: '#96aaa6',
      light: '#b4c4c0',
      lightest: '#d2e0de',
    },
    roof: {
      darkest: '#4a2018',
      dark: '#683024',
      base: '#884434',
      light: '#a85c48',
      lightest: '#c87860',
    },
    roofAlt: {
      darkest: '#1a2a40',
      dark: '#283e5a',
      base: '#3a5476',
      light: '#507094',
      lightest: '#6e90b4',
    },
    window: {
      darkest: '#14243a',
      dark: '#244460',
      base: '#3a6480',
      light: '#5888a8',
      lightest: '#80b0cc',
    },
    door: {
      darkest: '#241a10',
      dark: '#3a2a1a',
      base: '#523c26',
      light: '#6c5234',
      lightest: '#886a46',
    },

    flowers: ['#c86870', '#d89850', '#d0c850', '#a868b8', '#d8e8e0', '#c85050'],
    accents: ['#e8d080', '#e08850', '#70d0e8', '#d868a0'],
  },

  lighting: {
    sun: {
      color: '#e8e0c8',
      intensity: 1.2,
      azimuth: Math.PI * 0.3,
      elevation: Math.PI * 0.25,
    },
    ambient: { color: '#8aaa8c', intensity: 0.52 },
    hemisphere: { sky: '#6a9a7a', ground: '#2a4a28', intensity: 0.58 },
    contactShadowOpacity: 0.34,
  },

  sky: {
    top: '#2e5a48',
    mid: '#4a7a5c',
    horizon: '#8aaa8c',
    cloud: '#b0c4a8',
    cloudShade: '#8a9c80',
    skylineFar: '#5a8a6a',
    skylineMid: '#3a6a4a',
    skylineNear: '#245034',
    skylineStyle: 'hills',
  },

  fog: { color: '#8aaa94', near: 10, far: 26, enabled: true },
  water: { tint: '#e0f0e8', opacity: 0.92 },
};
