import { create } from 'zustand';

export type QualityTier = 'LOW' | 'MED' | 'HIGH';

interface QualityState {
  tier: QualityTier;
  particleScale: number;
  enableBloom: boolean;
  enableTrails: boolean;
  setTier: (tier: QualityTier) => void;
}

export const useQualityStore = create<QualityState>((set) => ({
  tier: 'MED',
  particleScale: 1.0,
  enableBloom: true,
  enableTrails: true,
  setTier: (tier) => {
    switch (tier) {
      case 'LOW':
        set({ tier, particleScale: 0.5, enableBloom: false, enableTrails: false });
        break;
      case 'MED':
        set({ tier, particleScale: 1.0, enableBloom: true, enableTrails: true });
        break;
      case 'HIGH':
        set({ tier, particleScale: 1.5, enableBloom: true, enableTrails: true });
        break;
    }
  },
}));
