export interface TrafficCorridor {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  density: number; // 0.0 to 1.0
  averageDailyVessels: number;
  status: 'Congested' | 'Moderate' | 'Clear';
}

export const trafficCorridors: TrafficCorridor[] = [
  {
    id: 'english_channel',
    name: 'English Channel',
    coordinates: { lat: 50.5, lng: -1.5 },
    density: 0.95,
    averageDailyVessels: 500,
    status: 'Congested'
  },
  {
    id: 'malacca_strait_traffic',
    name: 'Strait of Malacca',
    coordinates: { lat: 2.0, lng: 102.0 },
    density: 0.92,
    averageDailyVessels: 400,
    status: 'Congested'
  },
  {
    id: 'suez_canal_traffic',
    name: 'Suez Canal Corridor',
    coordinates: { lat: 30.5, lng: 32.5 },
    density: 0.85,
    averageDailyVessels: 85,
    status: 'Congested'
  },
  {
    id: 'panama_canal_traffic',
    name: 'Panama Canal Corridor',
    coordinates: { lat: 9.1, lng: -79.7 },
    density: 0.80,
    averageDailyVessels: 40,
    status: 'Congested'
  },
  {
    id: 'shanghai_port_traffic',
    name: 'East China Sea (Shanghai)',
    coordinates: { lat: 31.2, lng: 122.5 },
    density: 0.88,
    averageDailyVessels: 600,
    status: 'Congested'
  },
  {
    id: 'singapore_strait_traffic',
    name: 'Singapore Strait',
    coordinates: { lat: 1.2, lng: 103.9 },
    density: 0.96,
    averageDailyVessels: 800,
    status: 'Congested'
  },
  {
    id: 'gibraltar_strait',
    name: 'Strait of Gibraltar',
    coordinates: { lat: 35.9, lng: -5.6 },
    density: 0.75,
    averageDailyVessels: 300,
    status: 'Moderate'
  },
  {
    id: 'rotterdam_anchorage',
    name: 'Rotterdam Anchorage & Approaches',
    coordinates: { lat: 52.1, lng: 3.5 },
    density: 0.78,
    averageDailyVessels: 250,
    status: 'Moderate'
  }
];
