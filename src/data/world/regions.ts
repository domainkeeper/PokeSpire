export interface Region {
  id: string;
  name: string;
  themeId: string;
  mapIds: string[];
}

export const REGIONS: Region[] = [
  { id: 'coral-coast', name: 'Coral Coast', themeId: 'coastal-day', mapIds: [] },
  { id: 'heartland-wilds', name: 'Heartland Wilds', themeId: 'coastal-day', mapIds: [] },
  { id: 'dusk-metro', name: 'Dusk Metro', themeId: 'dusk-city', mapIds: [] },
];

export function regionOf(mapId: string): Region | undefined {
  return REGIONS.find((r) => r.mapIds.includes(mapId));
}
