import { NextResponse } from 'next/server';

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

// 5-minute cache for identical routes
const briefCache = new Map<string, { data: any; timestamp: number }>();

// Average helper
const average = (arr: (number | null)[] | undefined): number => {
  if (!arr || arr.length === 0) return 0;
  const valid = arr.filter((x): x is number => x !== null);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, x) => sum + x, 0) / valid.length;
};

// Fetch weather from Open-Meteo
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

    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lngs}&hourly=wave_height,ocean_current_velocity,sea_surface_temperature&forecast_days=1`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&hourly=wind_speed_10m&forecast_days=1`;

    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl).then(res => res.json()).catch(() => null),
      fetch(weatherUrl).then(res => res.json()).catch(() => null)
    ]);

    const keys: ('start' | 'mid' | 'end')[] = ['start', 'mid', 'end'];

    keys.forEach((key, index) => {
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
        const sst = average(marineRes.hourly.sea_surface_temperature);
        const waves = average(marineRes.hourly.wave_height);
        const currents = average(marineRes.hourly.ocean_current_velocity);
        if (sst > 0) report[key].temp = Math.round(sst * 10) / 10;
        if (waves > 0) report[key].waves = Math.round(waves * 10) / 10;
        if (currents > 0) report[key].current = Math.round(currents * 100) / 100;
      }

      if (weatherRes && Array.isArray(weatherRes)) {
        const locData = weatherRes[index];
        if (locData && locData.hourly) {
          const wind = average(locData.hourly.wind_speed_10m);
          if (wind > 0) report[key].wind = Math.round(wind * 10) / 10;
        }
      } else if (weatherRes && weatherRes.hourly) {
        const wind = average(weatherRes.hourly.wind_speed_10m);
        if (wind > 0) report[key].wind = Math.round(wind * 10) / 10;
      }
    });
  } catch (err) {
    console.error("Error fetching weather in API brief:", err);
  }
  return report;
}

export async function POST(request: Request) {
  let requestPayload: any = null;
  try {
    requestPayload = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const {
    from,
    to,
    fromName,
    toName,
    distance,
    eta,
    routeType,
    fuel,
    carbon,
    weatherRisk,
    piracyRisk,
    trafficDensity,
    segments,
    landCrossings,
    waypoints
  } = requestPayload;

  if (!fromName || !toName || !routeType) {
    return NextResponse.json({ error: "Missing required route parameters" }, { status: 400 });
  }

  // 1. Check Cache (5 minutes)
  const cacheKey = `${fromName}-${toName}-${routeType}`;
  const cached = briefCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
    console.log(`Serving cached AI brief for: ${cacheKey}`);
    return NextResponse.json(cached.data);
  }

  // 2. Fetch live weather info if coordinates exist
  let weatherInfo = "No current weather telemetry available.";
  if (waypoints && waypoints.length >= 2) {
    const startWp = waypoints[0];
    const midWp = waypoints[Math.floor(waypoints.length / 2)];
    const endWp = waypoints[waypoints.length - 1];
    const report = await fetchRouteWeather(startWp.lat, startWp.lng, midWp.lat, midWp.lng, endWp.lat, endWp.lng);
    weatherInfo = `Start point: Temp ${report.start.temp}°C, Wind ${report.start.wind} kts, Waves ${report.start.waves}m, Current ${report.start.current} m/s. Mid point: Temp ${report.mid.temp}°C, Wind ${report.mid.wind} kts, Waves ${report.mid.waves}m, Current ${report.mid.current} m/s. End point: Temp ${report.end.temp}°C, Wind ${report.end.wind} kts, Waves ${report.end.waves}m, Current ${report.end.current} m/s.`;
  }

  // 3. Retrieve Live AIS Traffic (if available)
  const globalAis = globalThis as any;
  const liveVessels = globalAis.liveShips ? Array.from(globalAis.liveShips.values()) as any[] : [];
  const aisInfo = liveVessels.length > 0 
    ? `Currently tracking ${liveVessels.length} active vessels globally via stream. Average speed: ${(liveVessels.reduce((sum, v) => sum + v.speed, 0) / liveVessels.length).toFixed(1)} kts.`
    : "No live AIS streaming vessels currently connected.";

  // 4. Construct ASI:One Prompt
  const prompt = `You are a professional maritime intelligence officer. Analyze this voyage option and provide a structured JSON report.
Voyage Data:
- Departure Port: ${fromName}
- Destination Port: ${toName}
- Selected Route Type: ${routeType}
- Route Distance: ${distance} NM
- ETA: ${eta}
- Fuel Estimate: ${fuel}
- Carbon Estimate: ${carbon}
- Weather Risk: ${weatherRisk}
- Piracy Risk: ${piracyRisk}
- Traffic Density: ${trafficDensity}
- Number of Route Segments: ${segments}
- Land Crossings: ${landCrossings}
- Live Marine Weather: ${weatherInfo}
- Live AIS Traffic: ${aisInfo}

You MUST return a raw JSON object with the following exact keys (no markdown formatting, no backticks, no wrap, just the raw JSON object string):
{
  "executiveSummary": "A concise executive summary of the voyage.",
  "routeRecommendation": "Your recommendation regarding this specific route choice.",
  "weatherAnalysis": "Detailed analysis of the current weather variables.",
  "piracyAssessment": "Detailed threat evaluation for the transit zones.",
  "trafficAssessment": "Analysis of the lane congestion index and traffic behavior.",
  "fuelOptimizationAdvice": "Advice on how to optimize fuel burn (e.g. slow steaming).",
  "carbonReductionAdvice": "Environmental assessment and CII rating considerations.",
  "operationalRisks": "Summary of active operational risks.",
  "finalRecommendation": "Your final advisory recommendation to the Captain."
}`;

  const apiKey = process.env.ASI_ONE_API_KEY || 'sk_c89b5589c05e43bca33ecdd32a943b7b093ee9096d194b92b61d23db147f11d8';

  // 5. Query ASI:One API
  const requestBody = {
    model: 'asi1-mini',
    messages: [{ role: 'user', content: prompt }]
  };

  try {
    const response = await fetch('https://api.asi1.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Log request, response and HTTP status on error
      console.error("ASI:One API HTTP Error Details:", {
        requestPayload: requestPayload,
        requestBodyToAsiOne: requestBody,
        httpStatus: response.status,
        responseBody: errorText
      });
      return NextResponse.json({ error: `ASI:One error [Status ${response.status}]: ${errorText || response.statusText}` }, { status: response.status });
    }

    const resJson = await response.json();
    let text = resJson.choices?.[0]?.message?.content;
    if (!text) {
      console.error("ASI:One API returned empty choices content:", resJson);
      return NextResponse.json({ error: "ASI:One returned empty choice message content" }, { status: 500 });
    }

    // Sanitize response in case it contains markdown blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedReport = JSON.parse(text);
    
    // Save to Cache
    briefCache.set(cacheKey, {
      data: parsedReport,
      timestamp: Date.now()
    });

    return NextResponse.json(parsedReport);
  } catch (err: any) {
    // Log unexpected errors
    console.error("Unexpected error in ASI:One AI briefing generation:", {
      requestPayload: requestPayload,
      requestBodyToAsiOne: requestBody,
      errorMessage: err.message,
      errorStack: err.stack
    });
    return NextResponse.json({ error: `AI Briefing Generation Failed: ${err.message}` }, { status: 500 });
  }
}
