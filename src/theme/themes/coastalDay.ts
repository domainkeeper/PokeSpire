import type { Theme } from '../types';

/**
 * Coastal Day - the lush, saturated, warm-sun coastal look from reference
 * image 1: teal sky with cream dithered clouds, teal ocean on the horizon,
 * saturated mid-greens, cream/bone fenceposts and paths.
 */
export const coastalDay: Theme = {
  id: 'coastal-day',
  name: 'Coastal Day',
  background: '#6ea8a8',

  palette: {
    grass: {
      darkest: '#1f4a1c',
      dark: '#2f6a26',
      base: '#428c33',
      light: '#5cae45',
      lightest: '#82cc5e',
    },
    path: {
      darkest: '#82724a',
      dark: '#a89466',
      base: '#c9b68a',
      light: '#e0d0a8',
      lightest: '#f2e8c8',
    },
    dirt: {
      darkest: '#4a3320',
      dark: '#67492c',
      base: '#88643c',
      light: '#a8814f',
      lightest: '#c4a06c',
    },
    sand: {
      darkest: '#967c4a',
      dark: '#bb9c62',
      base: '#d9bd84',
      light: '#ecd6a4',
      lightest: '#f8ecc8',
    },
    stone: {
      darkest: '#3e4448',
      dark: '#5a6266',
      base: '#7c868a',
      light: '#a2acb0',
      lightest: '#c8d0d2',
    },
    waterBed: {
      darkest: '#0d2a30',
      dark: '#153f47',
      base: '#1f545e',
      light: '#296874',
      lightest: '#357e8a',
    },
    waterSurface: {
      darkest: '#256a76',
      dark: '#31848e',
      base: '#419ea6',
      light: '#5cbcbc',
      lightest: '#8adcd4',
    },
    cliff: {
      darkest: '#3a2a1c',
      dark: '#54402c',
      base: '#6e563c',
      light: '#8a6e4c',
      lightest: '#a68a62',
    },

    foliage: {
      darkest: '#12381a',
      dark: '#1f5424',
      base: '#2e7430',
      light: '#43963e',
      lightest: '#63ba52',
    },
    foliageAlt: {
      darkest: '#1a4020',
      dark: '#2a6030',
      base: '#3c8240',
      light: '#54a452',
      lightest: '#74c468',
    },
    trunk: {
      darkest: '#2a1a12',
      dark: '#3e281a',
      base: '#563824',
      light: '#704c30',
      lightest: '#8c6440',
    },
    rock: {
      darkest: '#3a4246',
      dark: '#556064',
      base: '#76828a',
      light: '#9ba6ae',
      lightest: '#c2ccd2',
    },
    wood: {
      darkest: '#4a3420',
      dark: '#6a4c2e',
      base: '#8c6840',
      light: '#ae8a58',
      lightest: '#ceac78',
    },

    wall: {
      darkest: '#a89474',
      dark: '#c8b490',
      base: '#e8dcb8',
      light: '#f4ecd0',
      lightest: '#fdf8e4',
    },
    wallAlt: {
      darkest: '#7a8a92',
      dark: '#9aacb4',
      base: '#bcd0d6',
      light: '#d6e6ea',
      lightest: '#eef6f8',
    },
    roof: {
      darkest: '#6a2820',
      dark: '#8e3a2c',
      base: '#b8503c',
      light: '#d46c50',
      lightest: '#e89070',
    },
    roofAlt: {
      darkest: '#1e3a52',
      dark: '#2e5674',
      base: '#427494',
      light: '#5c94b4',
      lightest: '#82b8d2',
    },
    window: {
      darkest: '#16283e',
      dark: '#284a68',
      base: '#427494',
      light: '#6aa2bc',
      lightest: '#a2cede',
    },
    door: {
      darkest: '#2e1c12',
      dark: '#462c1c',
      base: '#603e28',
      light: '#7c5436',
      lightest: '#9c7048',
    },

    flowers: ['#e8687c', '#f2a850', '#ecd85c', '#c47ad4', '#f0f4f0', '#e85c5c'],
    accents: ['#ffe08a', '#ff9c50', '#8ae8ff', '#ff7aa8'],
  },

  lighting: {
    sun: {
      color: '#fff2d4',
      intensity: 1.55,
      azimuth: Math.PI * 0.28,
      elevation: Math.PI * 0.3,
    },
    ambient: { color: '#bcdcd8', intensity: 0.58 },
    hemisphere: { sky: '#8fc8c8', ground: '#3e6a2c', intensity: 0.62 },
    contactShadowOpacity: 0.3,
  },

  sky: {
    top: '#3d7e8e',
    mid: '#5fa2a6',
    horizon: '#b0d2c0',
    cloud: '#e4d8b8',
    cloudShade: '#bcae8e',
    skylineFar: '#7fae9c',
    skylineMid: '#4f8a6a',
    skylineNear: '#356c48',
    skylineStyle: 'hills',
    sea: { color: '#3f8f96', shimmer: '#6fbcbc' },
  },

  fog: { color: '#a8ccc4', near: 14, far: 34, enabled: true },
  water: { tint: '#ffffff', opacity: 0.9 },
};
