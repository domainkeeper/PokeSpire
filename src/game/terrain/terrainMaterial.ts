import * as THREE from 'three';
import type { Theme } from '../../theme/types';

/**
 * Terrain material.
 *
 * The heightfield tags every vertex with `faceKind` (0 = horizontal top,
 * 1 = vertical cliff/bank face). A tiny shader injection mixes the theme's cliff
 * ramp over vertical faces, so terrace walls read as exposed rock/earth instead
 * of stretched grass - without needing a second mesh, second draw call, or a
 * separate cliff texture atlas.
 *
 * Kept as an injection into MeshStandardMaterial (rather than a custom
 * ShaderMaterial) so it keeps Three's lighting, shadows and fog for free.
 */
export function createTerrainMaterial(map: THREE.Texture, theme: Theme): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.92,
    metalness: 0,
  });

  const cliffBase = new THREE.Color(theme.palette.cliff.base);
  const cliffDark = new THREE.Color(theme.palette.cliff.darkest);

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uCliffBase = { value: cliffBase };
    shader.uniforms.uCliffDark = { value: cliffDark };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float faceKind;
         varying float vFaceKind;
         varying float vWorldY;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vFaceKind = faceKind;
         vWorldY = position.y;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uCliffBase;
         uniform vec3 uCliffDark;
         varying float vFaceKind;
         varying float vWorldY;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         if ( vFaceKind > 0.5 ) {
           // Darken toward the base of the face so cliffs read as having depth.
           float depth = clamp( 0.5 - vWorldY * 1.6, 0.0, 1.0 );
           vec3 cliff = mix( uCliffBase, uCliffDark, depth );
           // Keep a little of the sampled ground colour so the cliff still
           // belongs to the terrain it is cut from.
           diffuseColor.rgb = mix( cliff, diffuseColor.rgb * cliff * 1.6, 0.28 );
         }`,
      );
  };

  // Distinct key so Three does not share a compiled program with plain
  // MeshStandardMaterials that lack the injection.
  mat.customProgramCacheKey = () => `terrain-${theme.id}`;

  return mat;
}
