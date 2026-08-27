export type AnchorStand = 'head' | 'bodyCenter' | 'base' | 'auraRing';

export function getAnchorOffset(anchor: AnchorStand, _width = 1, height = 1): [number, number, number] {
  switch (anchor) {
    case 'head':
      return [0, height * 0.9, 0];
    case 'bodyCenter':
      return [0, height * 0.5, 0];
    case 'base':
      return [0, 0.02, 0];
    case 'auraRing':
      return [0, 0.05, 0];
  }
}
