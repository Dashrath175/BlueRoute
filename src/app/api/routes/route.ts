import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ports } from '../../../data/ports';
import { getRouteOptions } from '../../../data/routes';
import { initShippingLaneGraph, isShippingGraphReady, haversineDistance } from '../../../data/routingGraph';
import { parseCSV } from '../../../data/datasetLoader';

interface WeatherSnapshot {
  temp: number;
  wind: number;
  waves: number;
  current: number;
}

interface WeatherReport {
  start: WeatherSnapshot;
  mid: WeatherSnapshot;
  end: WeatherSnapshot;
}

// Keep a cached copy of parsed piracy incidents in memory on the server
let cachedPirateIncidents: { lat: number; lng: number }[] | null = null;

function getPirateIncidents(): { lat: number; lng: number }[] {
  if (cachedPirateIncidents) return cachedPirateIncidents;

  try {
    const csvPath = path.join(process.cwd(), 'public/data/pirate_attacks.csv');
    const text = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(text, ',');
    const incidents: { lat: number; lng: number }[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length > 3) {
        const lat = parseFloat(row[3]);
        const lng = parseFloat(row[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          incidents.push({ lat, lng });
        }
      }
    }
    cachedPirateIncidents = incidents;
    console.log(`Server loaded ${incidents.length} piracy incidents from CSV.`);
    return incidents;
  } catch (err) {
    console.error("Error reading piracy dataset on server:", err);
    return [];
  }
}

function initServerGraph() {
  if (isShippingGraphReady) return;
  try {
    const geojsonPath = path.join(process.cwd(), 'public/data/Shipping_Lanes_v1.geojson');
    const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
    
    const countriesPath = path.join(process.cwd(), 'public/data/countries.geojson');
    const countriesData = JSON.parse(fs.readFileSync(countriesPath, 'utf-8'));

    initShippingLaneGraph(data, countriesData);
    console.log("Server-side navigation graph initialized successfully.");
  } catch (err) {
    console.error("Error initializing server-side graph:", err);
  }
}

// Fetch weather from Open-Meteo Marine & Forecast API
async function fetchRouteWeather(
  startLat: number, startLng: number,
  midLat: number, midLng: number,
  endLat: number, endLng: number
): Promise<WeatherReport> {
  const defaultSnapshot = { temp: 22, wind: 12, waves: 1.2, current: 0.15 };
  const report: WeatherReport = {
    start: { ...defaultSnapshot },
    mid: { ...defaultSnapshot },
    end: { ...defaultSnapshot }
  };

  try {
    const lats = `${startLat},${midLat},${endLat}`;
    const lngs = `${startLng},${midLng},${endLng}`;

    // 1. Marine API for Wave Height, Ocean Current, Sea Surface Temp
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lngs}&hourly=wave_height,ocean_current_velocity,sea_surface_temperature&forecast_days=1`;
    // 2. Weather Forecast API for Wind Speed
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&hourly=wind_speed_10m&forecast_days=1`;

    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl).then(res => res.json()).catch(() => null),
      fetch(weatherUrl).then(res => res.json()).catch(() => null)
    ]);

    const average = (arr: (number | null)[] | undefined): number => {
      if (!arr || arr.length === 0) return 0;
      const valid = arr.filter((x): x is number => x !== null);
      if (valid.length === 0) return 0;
      return valid.reduce((sum, x) => sum + x, 0) / valid.length;
    };

    const keys: ('start' | 'mid' | 'end')[] = ['start', 'mid', 'end'];

    keys.forEach((key, index) => {
      // Parse Marine values
      if (marineRes && Array.isArray(marineRes)) {
        const locData = marineRes[index];
        if (locData && locData.hourly) {
          const sst = average(locData.hourly.sea_surface_temperature);
          const waves = average(locData.hourly.wave_height);
          const currents = average(locData.hourly.ocean_current_velocity);
          if (sst > 0) report[key].temp = Math.round(sst * 10) / 10;
          if (waves > 0) report[key].waves = Math.round(waves * 10) / 10;
          if (currents > 0) report[key].current = Math.round(currents * 100) / 100;
        }
      } else if (marineRes && marineRes.hourly) {
        // Single location fallback
        const sst = average(marineRes.hourly.sea_surface_temperature);
        const waves = average(marineRes.hourly.wave_height);
        const currents = average(marineRes.hourly.ocean_current_velocity);
        if (sst > 0) report[key].temp = Math.round(sst * 10) / 10;
        if (waves > 0) report[key].waves = Math.round(waves * 10) / 10;
        if (currents > 0) report[key].current = Math.round(currents * 100) / 100;
      }

      // Parse Wind values
      if (weatherRes && Array.isArray(weatherRes)) {
        const locData = weatherRes[index];
        if (locData && locData.hourly) {
          const wind = average(locData.hourly.wind_speed_10m);
          if (wind > 0) report[key].wind = Math.round(wind * 10) / 10;
        }
      } else if (weatherRes && weatherRes.hourly) {
        // Single location fallback
        const wind = average(weatherRes.hourly.wind_speed_10m);
        if (wind > 0) report[key].wind = Math.round(wind * 10) / 10;
      }
    });

  } catch (err) {
    console.error("Error batch fetching Open-Meteo weather data:", err);
  }

  return report;
}

// Generate dynamic local fallback briefing text in case ASI:One is offline or key is missing
function generateLocalFallbackBrief(routeName: string, fromPort: any, toPort: any, weather: WeatherReport, piracyCount: number) {
  const isFastest = routeName.toLowerCase().includes('fastest');
  const isSafest = routeName.toLowerCase().includes('safest');

  let summary = `Direct voyage from ${fromPort.city} to ${toPort.city} optimizing for standard shipping lanes.`;
  let briefing = `Voyage initialized for M/V Blue Rotation. Route parameters optimized for commercial operations.`;
  let risks = `Navigational risks are within normal threshold. Historical piracy incident count near coordinates: ${piracyCount}.`;
  let fuel = `Fuel consumption mapped under design speed guidelines. Engine draft profiles set to normal.`;
  let carbon = `Vessel CII compliance index estimated at normal emissions. CO2 output monitored.`;
  let alternate = `Selected route provides standard balance compared to alternate voyages.`;
  let weatherText = `Forecast reports wind speeds averaging ${weather.mid.wind} kts and swell wave heights around ${weather.mid.waves} meters at midpoint.`;
  let bullets = [
    `Executes shipping corridor transit from ${fromPort.city} to ${toPort.city}.`,
    `Middle weather forecast: Wave swells at ${weather.mid.waves}m with winds of ${weather.mid.wind} kts.`,
    `Local Threat Assessment: ${piracyCount} historical incident records detected.`
  ];

  if (isFastest) {
    summary = `Pure scheduling route prioritizing shortest distance corridor of voyage.`;
    briefing = `Commercial charter instructions dictate maximum speed parameters (17.0 kts). Fast-steaming profile active.`;
    risks = `WARNING: Exposes vessel to transit risk zones including piracy channels (${piracyCount} historical occurrences) and high traffic canals.`;
    fuel = `Fast-steaming incurs higher draft drag. Fuel efficiency reduced, consuming approx 23.0 tons daily.`;
    carbon = `Higher emissions profile. Increased CO2 volumes from fast-cruise RPM speeds.`;
    alternate = `Rerouting to Safest Route will decrease piracy and weather exposure but extend duration significantly.`;
    bullets.push("Charters route to destination on absolute shortest track.");
  } else if (isSafest) {
    summary = `Safety-first route designed to bypass key geopolitical hotspots and storm cells.`;
    briefing = `Captain instructed to prioritize vessel stability, crew safety and hull integrity over strict schedule limits.`;
    risks = `Threat vectors successfully neutralized. Rerouting skirts active threat sectors, reducing piracy exposure.`;
    fuel = `Slow-steaming at 14.0 kts. Incurs longer transit duration but maintains low daily fuel consumption.`;
    carbon = `Improved carbon rating. Prolonged duration offsets daily emission savings, but CII grade remains high.`;
    alternate = `Faster routes (Fastest/Balanced) will save time but expose the cargo to higher piracy or wave hazards.`;
    bullets.push("Neutralizes risk exposure by steering clear of active threat basins.");
  } else {
    // Balanced
    summary = `Optimal voyage balancing transit schedule, fuel optimization and risk exposure.`;
    briefing = `Standard operating profile. Slow-steaming strategy engaged (14.5 kts) to achieve optimal efficiency parameters.`;
    risks = `Maintains defensive escort posture in moderate piracy zones while tracking weather storm movements.`;
    fuel = `Applies slow-steaming speed profiling, cutting fuel consumption by ~25% compared to high-speed transits.`;
    carbon = `CII Environmental Compliance index target met. Low-emission cruise profile active.`;
    alternate = `Fastest route is shorter but riskier; Safest route is more secure but adds considerable delay.`;
    bullets.push("Applies slow-steaming profiling to achieve balanced commercial returns.");
  }

  return { summary, briefing, risks, fuel, carbon, alternate, weather: weatherText, bullets };
}

// Call ASI:One API
async function generateAiBriefing(
  fromPort: any,
  toPort: any,
  weather: WeatherReport,
  vesselCount: number,
  avgSpeed: number,
  piracyCount: number,
  routesData: any[]
): Promise<any> {
  const apiKey = process.env.ASI_ONE_API_KEY;
  if (!apiKey) {
    console.warn("ASI_ONE_API_KEY is not defined. Using high-quality local fallback briefing.");
    return null;
  }

  const prompt = `
You are an expert maritime intelligence officer. Analyze the following 3 shipping routes and generate professional briefings.

Context:
- Departure: ${fromPort.name} (${fromPort.city}, ${fromPort.country})
- Destination: ${toPort.name} (${toPort.city}, ${toPort.country})

Live Weather Conditions along the route:
- Start Port: Temp ${weather.start.temp}°C, Wind ${weather.start.wind}kts, Waves ${weather.start.waves}m, Current ${weather.start.current}m/s
- Midpoint: Temp ${weather.mid.temp}°C, Wind ${weather.mid.wind}kts, Waves ${weather.mid.waves}m, Current ${weather.mid.current}m/s
- End Port: Temp ${weather.end.temp}°C, Wind ${weather.end.wind}kts, Waves ${weather.end.waves}m, Current ${weather.end.current}m/s

Live AIS Traffic details:
- Active vessels monitored in shipping lane corridors: ${vesselCount}
- Average speed of monitored vessels: ${avgSpeed.toFixed(1)} kts

Piracy Threats:
- Historical piracy incidents registered near this route: ${piracyCount}

Computed Shipping Routes:
${routesData.map(r => `
Name: ${r.name}
Distance: ${r.distanceNm} NM
Duration: ${r.durationDays} Days
Fuel: ${r.fuelTons} Tons MGO
CO2: ${r.co2Tons} Tons CO2
`).join('\n')}

For each route option, generate the following components:
1. Route summary (1-2 sentence overview)
2. Voyage briefing (professional instructions for captain)
3. Risk explanation (evaluation of piracy, traffic, and weather risks)
4. Fuel optimization summary (analysis of speed profiling and daily burn)
5. Carbon analysis (compliance and CII rating)
6. Alternate route explanation (comparison and why alternate options were rejected)
7. Weather interpretation (analysis of waves, wind, and ocean currents)
8. Strategic summary bullet points (3-4 concise professional highlights)

Return your response strictly as a JSON object matching the following structure. Do NOT wrap the JSON in markdown blocks (e.g. \`\`\`json), do not include any explanatory text outside the JSON:
{
  "fastest": {
    "summary": "...",
    "briefing": "...",
    "risks": "...",
    "fuel": "...",
    "carbon": "...",
    "alternate": "...",
    "weather": "...",
    "bullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4"]
  },
  "balanced": {
    "summary": "...",
    "briefing": "...",
    "risks": "...",
    "fuel": "...",
    "carbon": "...",
    "alternate": "...",
    "weather": "...",
    "bullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4"]
  },
  "safest": {
    "summary": "...",
    "briefing": "...",
    "risks": "...",
    "fuel": "...",
    "carbon": "...",
    "alternate": "...",
    "weather": "...",
    "bullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4"]
  }
}
`;

  try {
    const response = await fetch('https://api.asi1.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'asi1-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`ASI:One API error: ${response.status} ${response.statusText}`);
    }

    const resJson = await response.json();
    let text = resJson.choices?.[0]?.message?.content || '';
    
    // Sanitize response in case it contains markdown blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("Failed to generate AI briefing from ASI:One API:", err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from or to port parameters' }, { status: 400 });
  }

  // 1. Initialize Graph and resolve ports
  initServerGraph();

  const fromPort = ports.find(p => p.id === from);
  const toPort = ports.find(p => p.id === to);

  if (!fromPort || !toPort) {
    return NextResponse.json({ error: 'Invalid start or destination port' }, { status: 400 });
  }

  // 2. Compute the three route alternatives
  const routes = getRouteOptions(from, to, fromPort, toPort);
  if (!routes || routes.length === 0) {
    return NextResponse.json({ error: 'No navigable maritime route found.' }, { status: 404 });
  }

  // 3. Batch fetch real-time weather from Open-Meteo for key coordinates
  // Use first route's waypoints to extract start, midpoint, and end coordinates
  const activeRoute = routes.find(r => r.name === 'Balanced Route') || routes[0];
  const waypoints = activeRoute.waypoints;
  const startWp = waypoints[0];
  const midWp = waypoints[Math.floor(waypoints.length / 2)];
  const endWp = waypoints[waypoints.length - 1];

  const weatherReport = await fetchRouteWeather(
    startWp.lat, startWp.lng,
    midWp.lat, midWp.lng,
    endWp.lat, endWp.lng
  );

  // 4. Load AIS stream metrics from cache
  const globalAis = globalThis as any;
  const liveVessels = globalAis.liveShips ? Array.from(globalAis.liveShips.values()) as any[] : [];
  const vesselsCount = liveVessels.length;
  const avgSpeed = vesselsCount > 0 ? liveVessels.reduce((sum, v) => sum + v.speed, 0) / vesselsCount : 13.5;

  // 5. Query piracy incidents near the route
  const pirateIncidents = getPirateIncidents();
  let piracyIncidentsCount = 0;
  const sampleWaypoints = activeRoute.waypoints.filter((_, idx) => idx % 5 === 0);
  
  pirateIncidents.forEach(incident => {
    for (const wp of sampleWaypoints) {
      const dist = haversineDistance(wp.lat, wp.lng, incident.lat, incident.lng);
      if (dist < 300) { // dentro de 300 NM de la ruta
        piracyIncidentsCount++;
        break; // contar solo una vez
      }
    }
  });

  // 6. Skip synchronous ASI:One briefing to optimize speed (<1s page loads)
  // The client side fetches the AI brief asynchronously in the background via /api/brief
  const aiBriefings = null;

  // 7. Inject briefings and custom bullet reasonings into routes response
  const mappedRoutes = routes.map(route => {
    const typeKey = route.name.toLowerCase().includes('fastest')
      ? 'fastest'
      : route.name.toLowerCase().includes('safest')
        ? 'safest'
        : 'balanced';

    // Retrieve briefing (from API or high-quality local fallback)
    const routeBrief = (aiBriefings && aiBriefings[typeKey]) 
      ? aiBriefings[typeKey]
      : generateLocalFallbackBrief(route.name, fromPort, toPort, weatherReport, piracyIncidentsCount);

    return {
      ...route,
      reasoning: routeBrief.bullets || route.reasoning,
      aiBrief: {
        summary: routeBrief.summary,
        briefing: routeBrief.briefing,
        risks: routeBrief.risks,
        fuel: routeBrief.fuel,
        carbon: routeBrief.carbon,
        alternate: routeBrief.alternate,
        weather: routeBrief.weather
      }
    };
  });

  return NextResponse.json(mappedRoutes);
}
