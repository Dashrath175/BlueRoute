import { NextResponse } from 'next/server';

interface LiveVessel {
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: string;
  destination: string;
  lastUpdated: number;
}

// Global caching container to preserve WebSocket connection and vessel list across HMR / hot reloads
const globalAis = globalThis as unknown as {
  activeSocket: WebSocket | null;
  liveShips: Map<string, LiveVessel>;
  isConnecting: boolean;
  lastUpdateTime: number;
  seededInitialized: boolean;
};

if (!globalAis.liveShips) {
  globalAis.liveShips = new Map();
  globalAis.activeSocket = null;
  globalAis.isConnecting = false;
  globalAis.lastUpdateTime = Date.now();
  globalAis.seededInitialized = false;
}

const SEED_VESSELS: Omit<LiveVessel, 'lastUpdated'>[] = [
  {
    mmsi: '477123400',
    name: 'M/V SINGAPORE EXPRESS',
    lat: 1.25,
    lng: 104.2, // Singapore Strait
    speed: 15.2,
    heading: 90, // Eastbound
    status: 'Under Way (Engine)',
    destination: 'Shanghai'
  },
  {
    mmsi: '235987000',
    name: 'M/V ARABIAN SEA',
    lat: 15.0,
    lng: 62.0, // Arabian Sea
    speed: 14.0,
    heading: 260, // Westbound
    status: 'Under Way (Engine)',
    destination: 'Jeddah'
  },
  {
    mmsi: '311000123',
    name: 'M/V SUEZ CARRIER',
    lat: 28.5,
    lng: 33.1, // Gulf of Suez
    speed: 8.5,
    heading: 350, // Northbound
    status: 'Under Way (Engine)',
    destination: 'Rotterdam'
  },
  {
    mmsi: '368000456',
    name: 'M/V ATLANTIC TITAN',
    lat: 44.5,
    lng: -25.0, // North Atlantic
    speed: 16.5,
    heading: 80, // Eastbound
    status: 'Under Way (Engine)',
    destination: 'London'
  },
  {
    mmsi: '563000789',
    name: 'M/V CAPE TRADER',
    lat: -34.8,
    lng: 22.5, // Cape Agulhas
    speed: 13.8,
    heading: 120, // Southeastbound
    status: 'Under Way (Engine)',
    destination: 'Singapore'
  },
  {
    mmsi: '244123000',
    name: 'M/V GIBRALTAR STAR',
    lat: 36.0,
    lng: -4.5, // Strait of Gibraltar
    speed: 14.5,
    heading: 95, // Eastbound
    status: 'Under Way (Engine)',
    destination: 'Genoa'
  },
  {
    mmsi: '355789000',
    name: 'M/V PANAMA PIONEER',
    lat: 8.8,
    lng: -79.8, // Panama Canal approach
    speed: 12.0,
    heading: 220, // Southwestbound
    status: 'Under Way (Engine)',
    destination: 'Los Angeles'
  },
  {
    mmsi: '219456789',
    name: 'M/V NORDIC BULKER',
    lat: 56.8,
    lng: 11.2, // Kattegat / Baltic Entry
    speed: 11.5,
    heading: 180, // Southbound
    status: 'Under Way (Engine)',
    destination: 'Gdansk'
  },
  {
    mmsi: '431888222',
    name: 'M/V PACIFIC WAVE',
    lat: 42.8,
    lng: -148.5, // North Pacific
    speed: 15.0,
    heading: 275, // Westbound
    status: 'Under Way (Engine)',
    destination: 'Yokohama'
  },
  {
    mmsi: '636012345',
    name: 'M/V GUINEA CONVOY',
    lat: 2.5,
    lng: 4.8, // Gulf of Guinea
    speed: 12.8,
    heading: 310, // Northwestbound
    status: 'Under Way (Engine)',
    destination: 'Dakar'
  }
];

function initializeSeedVessels() {
  if (globalAis.seededInitialized) return;
  SEED_VESSELS.forEach(v => {
    globalAis.liveShips.set(v.mmsi, {
      ...v,
      lastUpdated: Date.now()
    });
  });
  globalAis.seededInitialized = true;
  globalAis.lastUpdateTime = Date.now();
  console.log("AIS seeded vessels initialized.");
}

function updateVesselPositions() {
  const now = Date.now();
  const elapsedHours = (now - globalAis.lastUpdateTime) / 3600000;
  globalAis.lastUpdateTime = now;

  if (elapsedHours <= 0) return;

  globalAis.liveShips.forEach((ship) => {
    // Only simulate coordinates updates if the vessel was NOT updated by stream in the last 20 seconds
    if (now - ship.lastUpdated > 20000) {
      const distance = ship.speed * elapsedHours;
      const headingRad = (ship.heading * Math.PI) / 180;
      
      const dLat = (distance * Math.cos(headingRad)) / 60; // 1 degree latitude = 60 NM
      const dLng = (distance * Math.sin(headingRad)) / (60 * Math.cos((ship.lat * Math.PI) / 180));
      
      ship.lat += dLat;
      ship.lng += dLng;
      
      // Wrap coordinates
      if (ship.lng > 180) ship.lng -= 360;
      if (ship.lng < -180) ship.lng += 360;
      if (ship.lat > 85) ship.lat = 85;
      if (ship.lat < -85) ship.lat = -85;
      
      ship.lastUpdated = now;
    }
  });
}

function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'Under Way (Engine)',
    1: 'At Anchor',
    2: 'Not Under Command',
    3: 'Restricted Manoeuvrability',
    4: 'Constrained by Draught',
    5: 'Moored',
    6: 'Aground',
    7: 'Fishing',
    8: 'Sailing',
    15: 'Undefined'
  };
  return statusMap[status] || `Status ${status}`;
}

export function startAisStream() {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.warn("AISSTREAM_API_KEY is not defined. Only simulated seeded vessels will be active.");
    return;
  }

  if (globalAis.activeSocket || globalAis.isConnecting) {
    return;
  }

  globalAis.isConnecting = true;
  console.log("Connecting to AISStream WebSocket...");

  try {
    const ws = new (globalThis as any).WebSocket("wss://stream.aisstream.io/v0/stream");
    globalAis.activeSocket = ws;

    ws.onopen = () => {
      console.log("AISStream WebSocket connection established successfully.");
      globalAis.isConnecting = false;
      
      // Subscribe to global bounding boxes (covers main global commercial shipping corridors)
      const subscriptionMessage = {
        APIKey: apiKey,
        BoundingBoxes: [
          [[-90, -180], [90, 180]]
        ]
      };
      ws.send(JSON.stringify(subscriptionMessage));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const mmsi = data.MetaData?.MMSI || data.MetaData?.MMSI_String;
        if (!mmsi) return;

        const existing = (globalAis.liveShips.get(mmsi.toString()) || {}) as any;
        
        const name = data.MetaData?.ShipName || existing.name || `Vessel ${mmsi}`;
        const lat = data.MetaData?.latitude || existing.lat;
        const lng = data.MetaData?.longitude || existing.lng;
        const speed = data.Message?.PositionReport?.Sog !== undefined ? data.Message.PositionReport.Sog : (existing.speed || 0);
        const heading = data.Message?.PositionReport?.TrueHeading || data.Message?.PositionReport?.Cog || existing.heading || 0;
        const status = data.Message?.PositionReport?.NavigationalStatus !== undefined ? data.Message.PositionReport.NavigationalStatus : 0;
        const destination = data.Message?.ShipStaticData?.Destination || existing.destination || 'Open Ocean';

        if (lat !== undefined && lng !== undefined) {
          globalAis.liveShips.set(mmsi.toString(), {
            mmsi: mmsi.toString(),
            name: name.toString().trim(),
            lat,
            lng,
            speed,
            heading,
            status: getStatusText(status),
            destination: destination.toString().trim(),
            lastUpdated: Date.now()
          });
        }
      } catch (err) {
        // Suppress parsing errors on malformed AIS payloads
      }
    };

    ws.onclose = () => {
      console.log("AISStream WebSocket connection closed. Reconnecting in 6 seconds...");
      globalAis.activeSocket = null;
      globalAis.isConnecting = false;
      setTimeout(startAisStream, 6000);
    };

    ws.onerror = (err: any) => {
      console.error("AISStream WebSocket error details:", err);
      ws.close();
    };

  } catch (err) {
    console.error("Failed to construct AISStream WebSocket:", err);
    globalAis.activeSocket = null;
    globalAis.isConnecting = false;
    setTimeout(startAisStream, 6000);
  }
}

// API endpoint handler
export async function GET() {
  // Ensure seed and background stream are running
  initializeSeedVessels();
  startAisStream();

  // Update positions for vessels to simulate dynamic movement
  updateVesselPositions();

  const vessels = Array.from(globalAis.liveShips.values());
  return NextResponse.json(vessels);
}
