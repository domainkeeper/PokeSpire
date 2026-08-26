import { EffectComposer, DepthOfField, Bloom, Vignette } from '@react-three/postprocessing';

export function Postprocessing() {
  return (
    <EffectComposer>
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.05}
        bokehScale={3}
        height={480}
      />
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        eskil={false}
      />
    </EffectComposer>
  );
}
