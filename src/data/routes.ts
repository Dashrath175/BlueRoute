import { Port } from './ports';
import { runDijkstraPathfinder, validateNavigableRoute, haversineDistance, WaypointNode, waypointNodes } from './routingGraph';

export interface Waypoint {
  lat: number;
  lng: number;
}

export interface RouteOption {
  id: string;
  name: 'Fastest Route' | 'Balanced Route' | 'Safest Route';
  color: string;
  waypoints: Waypoint[];
  distanceNm: number; // Nautical miles
  durationDays: number;
  fuelTons: number;
  co2Tons: number;
  overallScore: number;
  segmentsCount: number;
  metrics: {
    weatherRisk: number; // 0 to 100
    trafficDensity: 'High' | 'Medium' | 'Low';
    piracyRisk: 'High' | 'Medium' | 'Low';
    fuelEfficiency: number; // 0 to 100
    carbonScore: number; // 0 to 100
  };
  reasoning: string[];
  simulationAlerts: {
    checkpointIndex: number;
    title: string;
    description: string;
    riskStatus: 'normal' | 'warning' | 'danger';
    weatherStatus: 'stable' | 'rough' | 'severe';
  }[];
  aiBrief?: {
    summary: string;
    briefing: string;
    risks: string;
    fuel: string;
    carbon: string;
    alternate: string;
    weather: string;
  };
}

export interface GlobalShippingLane {
  id: string;
  name: string;
  waypoints: Waypoint[];
}

// Global Sea Lanes (constantly visible on globe)
export const globalShippingLanes: GlobalShippingLane[] = [
  {
    id: 'suez_canal_lane',
    name: 'Suez Canal Route (Europe-Asia)',
    waypoints: [
      { lat: 51.95, lng: 4.02 }, // Rotterdam
      { lat: 43.0, lng: -9.0 },
      { lat: 35.95, lng: -5.60 }, // Gibraltar
      { lat: 38.00, lng: 5.00 }, // Med
      { lat: 34.00, lng: 25.00 },
      { lat: 31.80, lng: 32.20 },
      { lat: 29.90, lng: 32.55 }, // Suez Canal
      { lat: 20.00, lng: 38.50 }, // Red Sea
      { lat: 12.60, lng: 43.30 }, // Bab-el-Mandeb
      { lat: 12.30, lng: 48.00 }, // Gulf of Aden
      { lat: 8.00, lng: 74.50 },   // Laccadive
      { lat: 5.80, lng: 80.00 },   // Colombo
      { lat: 2.50, lng: 101.50 },  // Malacca Strait
      { lat: 1.25, lng: 103.90 }   // Singapore
    ]
  },
  {
    id: 'panama_canal_lane',
    name: 'Panama Canal Route (US Coast-to-Coast)',
    waypoints: [
      { lat: 33.74, lng: -118.26 }, // Los Angeles
      { lat: 25.00, lng: -135.00 },
      { lat: 8.92, lng: -79.56 },  // Panama Canal Pacific
      { lat: 9.35, lng: -79.92 },  // Panama Canal Caribbean
      { lat: 15.00, lng: -72.00 }, // Caribbean
      { lat: 24.50, lng: -88.00 }, // Gulf of Mexico
      { lat: 36.00, lng: -74.50 }, // US East coast
      { lat: 40.67, lng: -74.12 }  // New York
    ]
  },
  {
    id: 'cape_good_hope_lane',
    name: 'Cape of Good Hope Route (Bypass)',
    waypoints: [
      { lat: 51.95, lng: 4.02 }, // Rotterdam
      { lat: 45.00, lng: -10.00 },
      { lat: 15.00, lng: -23.00 }, // West Africa
      { lat: -10.00, lng: -20.00 },
      { lat: -34.40, lng: 18.50 }, // Cape of Good Hope
      { lat: -25.00, lng: 50.00 },  // Madagascar
      { lat: -28.00, lng: 70.00 },   // Indian Ocean
      { lat: 5.80, lng: 80.00 },    // Colombo
      { lat: 18.95, lng: 72.82 }    // Mumbai
    ]
  }
];

// Maps path nodes directly to waypoints without great-circle or direct interpolation
function interpolateNodePath(nodes: WaypointNode[]): { points: Waypoint[], nodeIndices: number[] } {
  const points: Waypoint[] = nodes.map(n => ({ lat: n.lat, lng: n.lng }));
  const nodeIndices: number[] = nodes.map((_, idx) => idx);
  return { points, nodeIndices };
}

// Helper to determine alerts based on chokepoint IDs
function getAlertForNode(nodeId: string, index: number) {
  const alertsMap: Record<string, { title: string, description: string, riskStatus: 'normal' | 'warning' | 'danger', weatherStatus: 'stable' | 'rough' | 'severe' }> = {
    'bab_el_mandeb': {
      title: 'Entering Bab-el-Mandeb Strait',
      description: 'Entering Critical Piracy Corridor. Drone threats active. Armed security teams on deck. Sat surveillance lock established.',
      riskStatus: 'danger',
      weatherStatus: 'stable'
    },
    'suez_canal_south': {
      title: 'Suez Canal (South Passage)',
      description: 'Suez Canal entrance confirmed. Preparing canal pilots. Slow-steaming restricted to 8 knots. Lane traffic: High.',
      riskStatus: 'warning',
      weatherStatus: 'stable'
    },
    'suez_canal_north': {
      title: 'Suez Canal (North Passage)',
      description: 'Exiting Suez Canal. Proceeding to Mediterranean Sea corridor. Clear skies, normal shipping flow.',
      riskStatus: 'normal',
      weatherStatus: 'stable'
    },
    'cape_good_hope': {
      title: 'Cape of Good Hope Swells',
      description: 'Rounding Southern Africa. Swell alerts active: 7.2-meter waves, westerly gale gusts 45 kts. Securing deck containers.',
      riskStatus: 'normal',
      weatherStatus: 'severe'
    },
    'singapore_hub': {
      title: 'Singapore Traffic Corridor',
      description: 'Entering Strait of Singapore approach. High lane congestion. Extra bridge lookouts active for collision avoidance.',
      riskStatus: 'warning',
      weatherStatus: 'stable'
    },
    'malacca_strait_mid': {
      title: 'Strait of Malacca Transit',
      description: 'Navigating Malacca chokepoint. Anti-robbery protocols active. Navy patrol escorts visible.',
      riskStatus: 'warning',
      weatherStatus: 'stable'
    },
    'panama_canal_caribbean': {
      title: 'Panama Canal (Caribbean Entrance)',
      description: 'Lock booking slots confirmed. Commencing lock navigation. Draft restrictions: 15.2m max.',
      riskStatus: 'warning',
      weatherStatus: 'stable'
    },
    'panama_canal_pacific': {
      title: 'Panama Canal (Pacific Exit)',
      description: 'Canal transit complete. Entering Pacific Ocean basin. Setting speed profile to Eco-Cruise.',
      riskStatus: 'normal',
      weatherStatus: 'stable'
    },
    'gibraltar_strait': {
      title: 'Strait of Gibraltar Gateway',
      description: 'Crossing Gibraltar Strait. High volume passenger ferry traffic. Atlantic-Med currents stable.',
      riskStatus: 'normal',
      weatherStatus: 'stable'
    },
    'english_channel': {
      title: 'English Channel Transit',
      description: 'Navigating Dover Strait traffic lanes. Fog warnings active, visibility 1.5 NM. Engaging radar tracking.',
      riskStatus: 'warning',
      weatherStatus: 'rough'
    },
    'strait_of_hormuz': {
      title: 'Strait of Hormuz Pass',
      description: 'Strategic chokepoint transit. Naval patrols monitoring channel. GPS interference reported.',
      riskStatus: 'warning',
      weatherStatus: 'stable'
    },
    'gulf_of_guinea': {
      title: 'Gulf of Guinea Corridor',
      description: 'Entering West Africa High Risk Area. Securing lower decks. Piracy watch active.',
      riskStatus: 'danger',
      weatherStatus: 'stable'
    },
    'pacific_north_east': {
      title: 'North Pacific Gale Alert',
      description: 'Sailing under active low pressure cell. Sustained head winds 40 knots, wave swell 5.8m.',
      riskStatus: 'normal',
      weatherStatus: 'rough'
    }
  };

  const alertTemplate = alertsMap[nodeId];
  if (alertTemplate) {
    return {
      checkpointIndex: index,
      ...alertTemplate
    };
  }
  return null;
}

function isSameGeometry(a: WaypointNode[], b: WaypointNode[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
  }
  return true;
}

// Core V2 dynamic routing generator
export function getRouteOptions(fromId: string, toId: string, fromPort?: Port | null, toPort?: Port | null): RouteOption[] {
  // 1. Resolve start/end nodes
  const startNode = waypointNodes[fromId] || fromPort;
  const endNode = waypointNodes[toId] || toPort;

  if (!startNode || !endNode) return [];

  // 2. Compute the three paths
  const fastestNodes = runDijkstraPathfinder(fromId, toId, 'fastest');
  const balancedNodes = runDijkstraPathfinder(fromId, toId, 'balanced');
  const safestNodes = runDijkstraPathfinder(fromId, toId, 'safest');

  // Verify paths are valid and remain in water
  if (!validateNavigableRoute(fastestNodes) || !validateNavigableRoute(balancedNodes) || !validateNavigableRoute(safestNodes)) {
    console.error("V2 Pathfinder: Generated routes are not navigable or failed validation.", { fastestNodes, balancedNodes, safestNodes });
    return [];
  }

  // Define routing options to construct
  const routeConfigs = [
    {
      type: 'fastest' as const,
      name: 'Fastest Route' as const,
      color: '#FF4D4D', // Red
      nodes: fastestNodes!,
      speedKts: 17,
      fuelTonsPerDay: 23,
      baseScore: 78
    },
    {
      type: 'balanced' as const,
      name: 'Balanced Route' as const,
      color: '#38BDF8', // Blue
      nodes: balancedNodes!,
      speedKts: 14.5,
      fuelTonsPerDay: 16.5,
      baseScore: 92
    },
    {
      type: 'safest' as const,
      name: 'Safest Route' as const,
      color: '#00FF95', // Green
      nodes: safestNodes!,
      speedKts: 14.0,
      fuelTonsPerDay: 16.0,
      baseScore: 89
    }
  ];

  let uniqueConfigs = [routeConfigs[0], routeConfigs[1], routeConfigs[2]];

  // Deduplicate route paths based on geometry
  if (isSameGeometry(routeConfigs[0].nodes, routeConfigs[1].nodes) && isSameGeometry(routeConfigs[1].nodes, routeConfigs[2].nodes)) {
    // All three are identical geometry. Prefer Balanced Route.
    uniqueConfigs = [routeConfigs[1]];
  } else {
    const dup01 = isSameGeometry(routeConfigs[0].nodes, routeConfigs[1].nodes);
    const dup12 = isSameGeometry(routeConfigs[1].nodes, routeConfigs[2].nodes);
    const dup02 = isSameGeometry(routeConfigs[0].nodes, routeConfigs[2].nodes);

    if (dup01) {
      // Fastest and Balanced are duplicates. Keep Balanced and Safest.
      uniqueConfigs = [routeConfigs[1], routeConfigs[2]];
    } else if (dup12) {
      // Balanced and Safest are duplicates. Keep Fastest and Balanced.
      uniqueConfigs = [routeConfigs[0], routeConfigs[1]];
    } else if (dup02) {
      // Fastest and Safest are duplicates. Keep Fastest and Balanced.
      uniqueConfigs = [routeConfigs[0], routeConfigs[1]];
    }
  }

  return uniqueConfigs.map(config => {
    // A. Interpolate the node path to create smooth, dense lines
    const { points, nodeIndices } = interpolateNodePath(config.nodes);

    // B. Calculate actual geographical distance along waypoints
    let distanceNm = 0;
    for (let i = 0; i < config.nodes.length - 1; i++) {
      distanceNm += haversineDistance(
        config.nodes[i].lat, config.nodes[i].lng,
        config.nodes[i+1].lat, config.nodes[i+1].lng
      );
    }
    distanceNm = Math.round(distanceNm);

    // C. Calculate duration, fuel consumption, and CO2 emissions
    const durationDays = Math.round((distanceNm / (config.speedKts * 24)) * 10) / 10;
    const fuelTons = Math.round(durationDays * config.fuelTonsPerDay);
    const co2Tons = Math.round(fuelTons * 3.114); // Standard fuel to CO2 coefficient

    // D. Scan path nodes to generate dynamic chokepoint alerts
    const simulationAlerts: RouteOption['simulationAlerts'] = [
      {
        checkpointIndex: 0,
        title: `Departure: ${startNode.name}`,
        description: `Voyage initialized. Route type set to ${config.name}. Engines online. Satellite link synchronized.`,
        riskStatus: 'normal',
        weatherStatus: 'stable'
      }
    ];

    // Read nodes and map nodes to alert indices
    config.nodes.forEach((node, idx) => {
      // Avoid adding alert for start port at start index if custom alert is already there
      if (idx === 0) return;

      const pIdx = nodeIndices[idx];
      const alert = getAlertForNode(node.id, pIdx);
      if (alert) {
        simulationAlerts.push(alert);
      }
    });

    // Add final arrival alert at the end
    simulationAlerts.push({
      checkpointIndex: points.length - 1,
      title: `Arrival: ${endNode.name}`,
      description: `Voyage completed successfully. Vessel arrived at berth safely. Total distance completed: ${distanceNm.toLocaleString()} NM.`,
      riskStatus: 'normal',
      weatherStatus: 'stable'
    });

    // E. Assess risks based on transited nodes
    const transitsAden = config.nodes.some(n => n.id === 'bab_el_mandeb' || n.id === 'gulf_of_aden');
    const transitsGuinea = config.nodes.some(n => n.id === 'gulf_of_guinea' || n.id === 'west_africa_coast');
    const transitsMalacca = config.nodes.some(n => n.id === 'malacca_strait_mid');
    
    const transitsNorthAtlantic = config.nodes.some(n => n.id === 'north_atlantic_mid' || n.id === 'pacific_north_east');
    const transitsCapeStorms = config.nodes.some(n => n.id === 'cape_good_hope');

    const transitsCanals = config.nodes.some(n => n.id === 'suez_canal_north' || n.id === 'panama_canal_caribbean');

    // Compile risks percentages and indicators
    const piracyRisk: RouteOption['metrics']['piracyRisk'] = transitsAden || transitsGuinea ? 'High' : transitsMalacca ? 'Medium' : 'Low';
    const weatherRisk = transitsNorthAtlantic ? 68 : transitsCapeStorms ? 45 : transitsCanals ? 15 : 8;
    const trafficDensity: RouteOption['metrics']['trafficDensity'] = transitsCanals || transitsMalacca ? 'High' : 'Medium';
    
    // Efficiency factors
    const fuelEfficiency = config.type === 'balanced' ? 95 : config.type === 'safest' ? 82 : 72;
    const carbonScore = config.type === 'balanced' ? 94 : config.type === 'safest' ? 80 : 66;

    // Deduce overall success score
    let overallScore = config.baseScore;
    if (piracyRisk === 'High') overallScore -= 12;
    if (weatherRisk > 40) overallScore -= 8;
    if (trafficDensity === 'High') overallScore -= 4;
    overallScore = Math.max(50, Math.min(98, overallScore));

    // F. Construct professional intelligence officer reasoning bullet points
    const reasoning: string[] = [];
    if (config.type === 'fastest') {
      reasoning.push(`Optimizes purely for scheduling, routing via the shortest water corridor network of ${distanceNm.toLocaleString()} NM.`);
      if (transitsCanals) {
        reasoning.push(`Utilizes key canal chokepoints, saving significant transit distance but incurring channel transit fees.`);
      }
      if (piracyRisk === 'High') {
        reasoning.push(`WARNING: Route incurs critical piracy risk corridor exposure in Bab-el-Mandeb / Guinea basin.`);
      }
      if (weatherRisk > 40) {
        reasoning.push(`WARNING: Exposes cargo to severe weather swells and wind activity.`);
      }
    } else if (config.type === 'balanced') {
      reasoning.push(`Applies slow-steaming speed profiling (14.5 kts) to cut fuel consumption by ~25% and minimize emissions.`);
      if (transitsCanals) {
        reasoning.push(`Balances distance advantages of canals with scheduled transits during low-congestion windows.`);
      }
      reasoning.push(`Maintains secure convoy alignments in risk corridors while protecting transit scheduling limits.`);
    } else { // safest
      reasoning.push(`Prioritizes vessel safety and cargo integrity above all scheduling speed metrics.`);
      if (!transitsAden && fromId !== 'djibouti' && toId !== 'djibouti' && (fromId === 'mumbai' || fromId === 'singapore') && (toId === 'rotterdam' || toId === 'hamburg')) {
        reasoning.push(`Reroutes completely around Africa via the Cape of Good Hope, avoiding Middle East / Red Sea threat vectors.`);
      } else if (piracyRisk === 'Low') {
        reasoning.push(`Successfully skirts all active piracy risk zones to maintain secure transit parameters.`);
      }
      if (weatherRisk > 30 && transitsCapeStorms) {
        reasoning.push(`CAUTION: Rounds the Cape of Good Hope, exposing the vessel to high southerly swells (~6.5m).`);
      } else {
        reasoning.push(`Avoids active typhoon and extratropical storm cells entirely.`);
      }
    }

    return {
      id: `${fromId}-${toId}-${config.type}`,
      name: config.name,
      color: config.color,
      waypoints: points,
      distanceNm,
      durationDays,
      fuelTons,
      co2Tons,
      overallScore,
      segmentsCount: config.nodes.length - 1,
      metrics: {
        weatherRisk,
        trafficDensity,
        piracyRisk,
        fuelEfficiency,
        carbonScore
      },
      reasoning,
      simulationAlerts
    };
  });
}
