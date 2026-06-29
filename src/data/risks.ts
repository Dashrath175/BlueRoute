export interface RiskZone {
  id: string;
  name: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  radiusKm: number;
  dangerLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  activeThreats: string[];
}

export const riskZones: RiskZone[] = [
  {
    id: 'gulf_of_aden',
    name: 'Gulf of Aden / Somalia Basin',
    description: 'High activity region for maritime piracy, hijacking, and drone attacks. Escorts recommended.',
    coordinates: { lat: 12.5, lng: 48.0 },
    radiusKm: 700,
    dangerLevel: 'Critical',
    activeThreats: ['Armed Hijacking', 'Houthi Drone Strikes', 'Hostile Boarding']
  },
  {
    id: 'gulf_of_guinea',
    name: 'Gulf of Guinea / West Africa',
    description: 'Frequent reports of pirate boardings and crew kidnappings for ransom. High risk near shore.',
    coordinates: { lat: 3.5, lng: 6.0 },
    radiusKm: 600,
    dangerLevel: 'High',
    activeThreats: ['Crew Kidnapping', 'Cargo Theft', 'Illegal Boarding']
  },
  {
    id: 'malacca_strait_risk',
    name: 'Strait of Malacca Corridor',
    description: 'Opportunistic sea robbery and petty theft. Constant naval patrols reduce major hijack risk.',
    coordinates: { lat: 1.5, lng: 102.5 },
    radiusKm: 400,
    dangerLevel: 'Medium',
    activeThreats: ['Opportunistic Robbery', 'Night Boardings']
  },
  {
    id: 'south_china_sea_risk',
    name: 'South China Sea / Spratly Islands',
    description: 'Territorial disputes, illegal fishing skirmishes, and moderate piracy activity.',
    coordinates: { lat: 9.5, lng: 114.5 },
    radiusKm: 500,
    dangerLevel: 'Medium',
    activeThreats: ['Territorial Interceptions', 'Opportunistic Boarding']
  }
];
