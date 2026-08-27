import type { PropId } from '../../props/propRegistry';
import { scatter, type ScatterSpec } from '../../maps/authoring';

export function meadowScatter(
  area: ScatterSpec['area'],
  seed: number,
  density = 0.25,
) {
  return scatter({
    table: [
      { id: 'flower_bush' as PropId, weight: 3 },
      { id: 'bush_round' as PropId, weight: 2 },
      { id: 'rock_small' as PropId, weight: 1 },
    ],
    area, pitch: 5, density, seed,
  });
}

export function forestFloorScatter(
  area: ScatterSpec['area'],
  seed: number,
  density = 0.3,
) {
  return scatter({
    table: [
      { id: 'tree_oak' as PropId, weight: 5 },
      { id: 'tree_pine' as PropId, weight: 3 },
      { id: 'bush_round' as PropId, weight: 2 },
      { id: 'rock_small' as PropId, weight: 1 },
    ],
    area, pitch: 5, density, seed,
  });
}

export function wetlandScatter(
  area: ScatterSpec['area'],
  seed: number,
  density = 0.15,
) {
  return scatter({
    table: [
      { id: 'bush_round' as PropId, weight: 2 },
      { id: 'rock_small' as PropId, weight: 1 },
    ],
    area, pitch: 6, density, seed,
  });
}
