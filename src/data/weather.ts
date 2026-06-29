export interface WeatherZone {
  id: string;
  name: string;
  type: 'cyclone' | 'typhoon' | 'gale' | 'high_waves';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  coordinates: {
    lat: number;
    lng: number;
  };
  radiusKm: number;
  windSpeedKts: number;
  waveHeightM: number;
  description: string;
}

export const weatherZones: WeatherZone[] = [
  {
    id: 'north_atlantic_gale',
    name: 'North Atlantic Winter Storm',
    type: 'gale',
    severity: 'High',
    coordinates: { lat: 49.0, lng: -32.0 },
    radiusKm: 900,
    windSpeedKts: 45,
    waveHeightM: 8.5,
    description: 'Extratropical low pressure system creating severe gales and dangerous wave heights.'
  },
  {
    id: 'south_china_sea_typhoon',
    name: 'Typhoon Gaemi (Active)',
    type: 'typhoon',
    severity: 'Critical',
    coordinates: { lat: 18.5, lng: 116.0 },
    radiusKm: 700,
    windSpeedKts: 85,
    waveHeightM: 12.0,
    description: 'Category 3 typhoon moving northwest. All commercial shipping instructed to steer clear.'
  },
  {
    id: 'cape_good_hope_swell',
    name: 'Agulhas Current High Swells',
    type: 'high_waves',
    severity: 'High',
    coordinates: { lat: -35.5, lng: 20.0 },
    radiusKm: 800,
    windSpeedKts: 35,
    waveHeightM: 7.0,
    description: 'Strong westerly winds opposing the Agulhas current, producing rogue waves and high swells.'
  },
  {
    id: 'pacific_low_pressure',
    name: 'North Pacific Low Pressure',
    type: 'gale',
    severity: 'Medium',
    coordinates: { lat: 42.0, lng: 165.0 },
    radiusKm: 1000,
    windSpeedKts: 38,
    waveHeightM: 5.5,
    description: 'Broad low pressure system causing moderate to rough seas across northern shipping lanes.'
  }
];
