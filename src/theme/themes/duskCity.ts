import type { Theme } from '../types';

/**
 * Dusk City - the purple / magenta sunset city look from reference image 2:
 * deep violet sky bleeding to magenta at the horizon, cool desaturated
 * foliage lit by warm rim light, city silhouette, lamp-lit accents.
 */
export const duskCity: Theme = {
  id: 'dusk-city',
  name: 'Dusk City',
  background: '#3a2456',

  palette: {
    grass: {
      darkest: '#1a1430',
      dark: '#2a2048',
      base: '#3c3060',
      light: '#524478',
      lightest: '#6e5c96',
    },
    path: {
      darkest: '#3a2c48',
      dark: '#54405e',
      base: '#705878',
      light: '#8e7494',
      lightest: '#ac92b0',
    },
    dirt: {
      darkest: '#2a1c30',
      dark: '#3e2a42',
      base: '#563c56',
      light: '#6e506c',
      lightest: '#8a6884',
    },
    sand: {
      darkest: '#4a3448',
      dark: '#6a4c5e',
      base: '#8c6a76',
      light: '#ac8a92',
      lightest: '#ccaeb0',
    },
    stone: {
      darkest: '#241c38',
      dark: '#382e50',
      base: '#4e426a',
      light: '#685c86',
      lightest: '#8a7ea6',
    },
    waterBed: {
      darkest: '#0e0a24',
      dark: '#181038',
      base: '#241a4e',
      light: '#322666',
      lightest: '#443480',
    },
    waterSurface: {
      darkest: '#2a1e58',
      dark: '#3c2c76',
      base: '#523e96',
      light: '#7058b0',
      lightest: '#9c80cc',
    },
    cliff: {
      darkest: '#231832',
      dark: '#372446',
      base: '#4c345c',
      light: '#644874',
      lightest: '#7e5e8c',
    },

    foliage: {
      darkest: '#1c1030',
      dark: '#2e1a42',
      base: '#442654',
      light: '#5e3a66',
      lightest: '#7c527c',
    },
    foliageAlt: {
      darkest: '#2a1428',
      dark: '#42203a',
      base: '#5e3050',
      light: '#7c4666',
      lightest: '#9c607e',
    },
    trunk: {
      darkest: '#1c1220',
      dark: '#2e1e30',
      base: '#422c42',
      light: '#583e56',
      lightest: '#70526c',
    },
    rock: {
      darkest: '#221c34',
      dark: '#362e4c',
      base: '#4c4266',
      light: '#665a82',
      lightest: '#867aa0',
    },
    wood: {
      darkest: '#2a1c2a',
      dark: '#402c3c',
      base: '#5a4052',
      light: '#765668',
      lightest: '#947080',
    },

    wall: {
      darkest: '#3e3058',
      dark: '#564474',
      base: '#725e92',
      light: '#907cae',
      lightest: '#b09cc8',
    },
    wallAlt: {
      darkest: '#302a4e',
      dark: '#443a68',
      base: '#5c4e86',
      light: '#7668a2',
      lightest: '#9288bc',
    },
    roof: {
      darkest: '#3a1830',
      dark: '#562444',
      base: '#78345c',
      light: '#9c4a74',
      lightest: '#c0688e',
    },
    roofAlt: {
      darkest: '#1e1840',
      dark: '#2e2458',
      base: '#423474',
      light: '#584892',
      lightest: '#7462ae',
    },
    window: {
      darkest: '#2a1c1a',
      dark: '#6a4a24',
      base: '#b8903c',
      light: '#e8c464',
      lightest: '#fff0a8',
    },
    door: {
      darkest: '#1e1420',
      dark: '#32222e',
      base: '#48323e',
      light: '#604450',
      lightest: '#7c5c66',
    },

    flowers: ['#e85c96', '#f2789c', '#c45ce8', '#ff9ec4', '#8a5ce8', '#ffd06a'],
    accents: ['#ffd06a', '#ff8a5c', '#7ae4ff', '#ff5c9c'],
  },

  lighting: {
    sun: {
      color: '#ffa878',
      intensity: 1.15,
      azimuth: Math.PI * 1.15,
      // Low sun: long, dramatic dusk shadows.
      elevation: Math.PI * 0.11,
    },
    ambient: { color: '#6a4c94', intensity: 0.66 },
    hemisphere: { sky: '#7a4a9c', ground: '#2a1c40', intensity: 0.72 },
    contactShadowOpacity: 0.38,
  },

  sky: {
    top: '#241a4e',
    mid: '#5a3078',
    horizon: '#b8507e',
    cloud: '#8a4a8e',
    cloudShade: '#4e2a5e',
    skylineFar: '#5c3a76',
    skylineMid: '#402a5c',
    skylineNear: '#2a1c42',
    skylineStyle: 'city',
    disc: { color: '#ffb070', x: 0.62, y: 0.78, radius: 14 },
  },

  fog: { color: '#5a3a72', near: 12, far: 30, enabled: true },
  water: { tint: '#c8b0e8', opacity: 0.88 },
};
