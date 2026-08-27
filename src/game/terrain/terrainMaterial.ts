import * as THREE from 'three';
import type { Theme } from '../../theme/types';

/**
 * Terrain material.
 *
 * The heightfield tags every vertex with `faceKind` (0 = horizontal top,
 * 1 = vertical cliff/bank face). Cliff faces use a procedural dithered
 * banded texture generated in the fragment shader from the theme's cliff
 * ramp, blended with the surrounding ground texture so cliffs read as
 * a continuation of the terrain — no stretched sampling, no separate texture atlas.
 *
 * Kept as an injection into MeshStandardMaterial so it keeps Three's
 * lighting, shadows and fog for free.
 */
export function createTerrainMaterial(
  map: THREE.Texture,
  theme: Theme,
  groundPixelSize: number,
): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.92,
    metalness: 0,
  });

  const c = theme.palette.cliff;
  const cliffDarkest = new THREE.Color(c.darkest);
  const cliffDark = new THREE.Color(c.dark);
  const cliffBase = new THREE.Color(c.base);
  const cliffLight = new THREE.Color(c.light);
  const cliffLightest = new THREE.Color(c.lightest);

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uCliffDarkest = { value: cliffDarkest };
    shader.uniforms.uCliffDark = { value: cliffDark };
    shader.uniforms.uCliffBase = { value: cliffBase };
    shader.uniforms.uCliffLight = { value: cliffLight };
    shader.uniforms.uCliffLightest = { value: cliffLightest };
    shader.uniforms.uPixelSize = { value: groundPixelSize };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float faceKind;
         varying float vFaceKind;
         varying float vWorldY;
         varying float vFaceU;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vFaceKind = faceKind;
         vWorldY = position.y;
         // Sum of x+z: varies along whichever axis the face runs on
         // (the other axis is constant per-face), giving a stable
         // horizontal coordinate for dithering regardless of face orientation.
         vFaceU = position.x + position.z;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uCliffDarkest;
         uniform vec3 uCliffDark;
         uniform vec3 uCliffBase;
         uniform vec3 uCliffLight;
         uniform vec3 uCliffLightest;
         uniform float uPixelSize;
         varying float vFaceKind;
         varying float vWorldY;
         varying float vFaceU;

         float hash2(vec2 p) {
           return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
         }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         if ( vFaceKind > 0.5 ) {
           // Use the actual ground-texture pixel size so dither grain
           // matches the surrounding terrain density exactly.
           vec2 cell = floor(vec2(vFaceU, vWorldY) / uPixelSize);
           cell = mod(cell, 512.0); // clamp hash input to avoid float32 precision loss
           float n = hash2(cell);

           // Bias darker near the base (depth) like the old gradient did,
           // but as banding instead of a flat multiply.
           float depth = clamp( 0.5 - vWorldY * 1.6, 0.0, 1.0 );

           vec3 rock;
           if (n < 0.08) rock = uCliffDarkest;
           else if (n < 0.22 + depth * 0.25) rock = uCliffDark;
           else if (n < 0.75) rock = uCliffBase;
           else if (n < 0.93) rock = uCliffLight;
           else rock = uCliffLightest;

           // Blend with the actual ground texture at this UV so cliffs
           // inherit the local hue (grass→greener, sand→warmer, etc.)
           #ifdef USE_MAP
             vec3 groundTone = texture2D( map, vMapUv ).rgb;
             diffuseColor.rgb = mix( groundTone, rock, 0.65 );
           #else
             diffuseColor.rgb = rock;
           #endif
         }`,
      );
  };

  // Distinct key so Three does not share a compiled program with plain
  // MeshStandardMaterials that lack the injection.
  mat.customProgramCacheKey = () => `terrain-${theme.id}`;

  return mat;
}