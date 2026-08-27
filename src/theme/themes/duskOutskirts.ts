import type { Theme } from '../types';

/**
 * Dusk Outskirts - transitional dawn/dusk palette between coastal-day and dusk-city.
 * Cool blues warming toward amber, muted foliage, sparse lamp-light.
 */
export const duskOutskirts: Theme = {
  id: 'dusk-outskirts',
  name: 'Dusk Outskirts',
  background: '#4a5a78',

  palette: {
    grass: {
      darkest: '#1a2428',
      dark: '#283838',
      base: '#384c4c',
      light: '#4e6464',
      lightest: '#688080',
    },
    path: {
      darkest: '#5a4e42',
      dark: '#766a5c',
      base: '#928878',
      light: '#aea498',
      lightest: '#cac2b8',
    },
    dirt: {
      darkest: '#3a2c20',
      dark: '#544230',
      base: '#6e5a42',
      light: '#8a7456',
      lightest: '#a8906c',
    },
    sand: {
      darkest: '#6a5c48',
      dark: '#8a7c60',
      base: '#aa9c7a',
      light: '#c4b898',
      lightest: '#ded4bc',
    },
    stone: {
      darkest: '#2e3238',
      dark: '#464c52',
      base: '#606870',
      light: '#7c868e',
      lightest: '#a0acb4',
    },
    waterBed: {
      darkest: '#0e1a24',
      dark: '#182c38',
      base: '#223e4e',
      light: '#2e5266',
      lightest: '#3c6880',
    },
    waterSurface: {
      darkest: '#224860',
      dark: '#305e78',
      base: '#407692',
      light: '#5892ae',
      lightest: '#78b0cc',
    },
    cliff: {
      darkest: '#241c18',
      dark: '#3a2e24',
      base: '#504234',
      light: '#685848',
      lightest: '#827060',
    },

    foliage: {
      darkest: '#142220',
      dark: '#203630',
      base: '#2e4c44',
      light: '#40645a',
      lightest: '#568072',
    },
    foliageAlt: {
      darkest: '#1a2a24',
      dark: '#284038',
      base: '#3a5850',
      light: '#4e7268',
      lightest: '#669082',
    },
    trunk: {
      darkest: '#1a1412',
      dark: '#2e221a',
      base: '#443226',
      light: '#5c4634',
      lightest: '#745c44',
    },
    rock: {
      darkest: '#2e3238',
      dark: '#464c52',
      base: '#606870',
      light: '#7c868e',
      lightest: '#a0acb4',
    },
    wood: {
      darkest: '#3a2820',
      dark: '#543c30',
      base: '#705442',
      light: '#8c6e58',
      lightest: '#aa8a72',
    },

    wall: {
      darkest: '#6a7480',
      dark: '#8892a0',
      base: '#a6b0bc',
      light: '#c2ccd6',
      lightest: '#dce4ea',
    },
    wallAlt: {
      darkest: '#505c68',
      dark: '#6a7888',
      base: '#8694a6',
      light: '#a2b0c0',
      lightest: '#bec8d6',
    },
    roof: {
      darkest: '#5a2820',
      dark: '#7a3830',
      base: '#9c4c40',
      light: '#be6458',
      lightest: '#d88070',
    },
    roofAlt: {
      darkest: '#1c2240',
      dark: '#2c3458',
      base: '#3e4a74',
      light: '#546492',
      lightest: '#7080b0',
    },
    window: {
      darkest: '#282018',
      dark: '#5c4a20',
      base: '#a08030',
      light: '#d8b850',
      lightest: '#ffe898',
    },
    door: {
      darkest: '#1c1418',
      dark: '#302428',
      base: '#463438',
      light: '#5e484c',
      lightest: '#786064',
    },

    flowers: ['#d86080', '#e09060', '#d8c058', '#b060c8', '#e0e8e8', '#d06060'],
    accents: ['#ffe078', '#e08858', '#78d8f0', '#e06898'],
  },

  lighting: {
    sun: {
      color: '#ffd8a8',
      intensity: 1.3,
      azimuth: Math.PI * 0.9,
      elevation: Math.PI * 0.18,
    },
    ambient: { color: '#5a6a8c', intensity: 0.6 },
    hemisphere: { sky: '#6a7a9c', ground: '#2a3448', intensity: 0.66 },
    contactShadowOpacity: 0.34,
  },

  sky: {
    top: '#2a3a5c',
    mid: '#4a5a7c',
    horizon: '#a0887c',
    cloud: '#c0a898',
    cloudShade: '#8a7a6e',
    skylineFar: '#6a7a8c',
    skylineMid: '#4a5a6c',
    skylineNear: '#344050',
    skylineStyle: 'hills',
  },

  fog: { color: '#7a8a9c', near: 12, far: 30, enabled: true },
  water: { tint: '#d8e8f0', opacity: 0.9 },
};
