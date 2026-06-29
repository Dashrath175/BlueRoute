import { haversineDistance } from './routingGraph';
import { riskZones } from './risks';
import { weatherZones } from './weather';
import { trafficCorridors } from './traffic';

export interface RoutingEdge {
  fromNode: { lat: number; lng: number };
  toNode: { lat: number; lng: number };
  distance: number; // in nautical miles
  mode: 'fastest' | 'balanced' | 'safest';
}

export interface CostWeights {
  distance: number;
  piracy: number;
  traffic: number;
  weather: number;
  fuel: number;
  carbon: number;
}

export interface CostBreakdown {
  distance: number;
  piracy: number;
  traffic: number;
  weather: number;
  fuel: number;
  carbon: number;
  finalCost: number;
}

// Weights per mode to scale and ignore/prioritize specific cost factors
export const MODE_WEIGHTS: Record<'fastest' | 'balanced' | 'safest', CostWeights> = {
  fastest: {
    distance: 1.0,
    piracy: 0.0,
    traffic: 0.0,
    weather: 0.0,
    fuel: 0.0,
    carbon: 0.0,
  },
  balanced: {
    distance: 1.0,
    piracy: 2.0,
    traffic: 10.0,
    weather: 1.0,
    fuel: 1.2,
    carbon: 1.0,
  },
  safest: {
    distance: 1.0,
    piracy: 30.0,
    traffic: 0.5,
    weather: 10.0,
    fuel: 0.5,
    carbon: 0.5,
  },
};

// Calculate midpoint between two nodes, handling antimeridian wrapping
export function getEdgeMidpoint(fromNode: { lat: number; lng: number }, toNode: { lat: number; lng: number }) {
  let diffLng = toNode.lng - fromNode.lng;
  while (diffLng > 180) diffLng -= 360;
  while (diffLng < -180) diffLng += 360;
  return {
    lat: (fromNode.lat + toNode.lat) / 2,
    lng: fromNode.lng + diffLng / 2
  };
}

export function calculateDistanceCost(edge: RoutingEdge): number {
  const weights = MODE_WEIGHTS[edge.mode];
  return edge.distance * weights.distance;
}

export function calculatePiracyCost(edge: RoutingEdge): number {
  const weights = MODE_WEIGHTS[edge.mode];
  if (weights.piracy === 0) return 0;

  const midpoint = getEdgeMidpoint(edge.fromNode, edge.toNode);
  let dangerFactor = 0.0;

  for (const zone of riskZones) {
    const distToZone = haversineDistance(midpoint.lat, midpoint.lng, zone.coordinates.lat, zone.coordinates.lng);
    const radiusNm = zone.radiusKm / 1.852;
    if (distToZone <= radiusNm) {
      let zoneDanger = 0.0;
      if (zone.dangerLevel === 'Critical') zoneDanger = 1.0;
      else if (zone.dangerLevel === 'High') zoneDanger = 0.5;
      else if (zone.dangerLevel === 'Medium') zoneDanger = 0.2;
      else if (zone.dangerLevel === 'Low') zoneDanger = 0.05;

      dangerFactor = Math.max(dangerFactor, zoneDanger);
    }
  }

  return edge.distance * dangerFactor * weights.piracy;
}

export function calculateTrafficCost(edge: RoutingEdge): number {
  const weights = MODE_WEIGHTS[edge.mode];
  if (weights.traffic === 0) return 0;

  const midpoint = getEdgeMidpoint(edge.fromNode, edge.toNode);
  let trafficDensity = 0.05; // baseline density

  for (const corridor of trafficCorridors) {
    const dist = haversineDistance(midpoint.lat, midpoint.lng, corridor.coordinates.lat, corridor.coordinates.lng);
    const influenceRadiusNm = 200; // 200 NM influence radius for traffic lanes
    if (dist <= influenceRadiusNm) {
      const factor = 1 - (dist / influenceRadiusNm);
      const intensity = corridor.density * factor;
      trafficDensity = Math.max(trafficDensity, intensity);
    }
  }

  return edge.distance * trafficDensity * weights.traffic;
}

export function calculateWeatherCost(edge: RoutingEdge): number {
  const weights = MODE_WEIGHTS[edge.mode];
  if (weights.weather === 0) return 0;

  const midpoint = getEdgeMidpoint(edge.fromNode, edge.toNode);
  let weatherSeverity = 0.0;

  for (const zone of weatherZones) {
    const distToZone = haversineDistance(midpoint.lat, midpoint.lng, zone.coordinates.lat, zone.coordinates.lng);
    const radiusNm = zone.radiusKm / 1.852;
    if (distToZone <= radiusNm) {
      let severityVal = 0.0;
      if (zone.severity === 'Critical') severityVal = 2.0;
      else if (zone.severity === 'High') severityVal = 1.0;
      else if (zone.severity === 'Medium') severityVal = 0.4;
      else if (zone.severity === 'Low') severityVal = 0.1;

      weatherSeverity = Math.max(weatherSeverity, severityVal);
    }
  }

  return edge.distance * weatherSeverity * weights.weather;
}

export function calculateFuelCost(edge: RoutingEdge): number {
  const weights = MODE_WEIGHTS[edge.mode];
  if (weights.fuel === 0) return 0;

  let speedKts = 14.5;
  let fuelTonsPerDay = 16.5;

  if (edge.mode === 'fastest') {
    speedKts = 17.0;
    fuelTonsPerDay = 23.0;
  } else if (edge.mode === 'safest') {
    speedKts = 14.0;
    fuelTonsPerDay = 16.0;
  }

  const durationDays = edge.distance / (speedKts * 24);
  const baseFuel = durationDays * fuelTonsPerDay;

  // Add fuel drag penalty for weather waves
  const midpoint = getEdgeMidpoint(edge.fromNode, edge.toNode);
  let weatherFactor = 1.0;
  for (const zone of weatherZones) {
    const distToZone = haversineDistance(midpoint.lat, midpoint.lng, zone.coordinates.lat, zone.coordinates.lng);
    const radiusNm = zone.radiusKm / 1.852;
    if (distToZone <= radiusNm) {
      if (zone.severity === 'Critical') weatherFactor = Math.max(weatherFactor, 1.5);
      else if (zone.severity === 'High') weatherFactor = Math.max(weatherFactor, 1.25);
      else if (zone.severity === 'Medium') weatherFactor = Math.max(weatherFactor, 1.1);
      else if (zone.severity === 'Low') weatherFactor = Math.max(weatherFactor, 1.02);
    }
  }

  const fuelTons = baseFuel * weatherFactor;
  // Convert fuel tons to equivalent distance scale (1 ton fuel ≈ 22.5 NM)
  const fuelScaleFactor = 22.5;

  return fuelTons * fuelScaleFactor * weights.fuel;
}

export function calculateCarbonCost(edge: RoutingEdge): number {
  const weights = MODE_WEIGHTS[edge.mode];
  if (weights.carbon === 0) return 0;

  let speedKts = 14.5;
  let fuelTonsPerDay = 16.5;

  if (edge.mode === 'fastest') {
    speedKts = 17.0;
    fuelTonsPerDay = 23.0;
  } else if (edge.mode === 'safest') {
    speedKts = 14.0;
    fuelTonsPerDay = 16.0;
  }

  const durationDays = edge.distance / (speedKts * 24);
  const baseFuel = durationDays * fuelTonsPerDay;

  const midpoint = getEdgeMidpoint(edge.fromNode, edge.toNode);
  let weatherFactor = 1.0;
  for (const zone of weatherZones) {
    const distToZone = haversineDistance(midpoint.lat, midpoint.lng, zone.coordinates.lat, zone.coordinates.lng);
    const radiusNm = zone.radiusKm / 1.852;
    if (distToZone <= radiusNm) {
      if (zone.severity === 'Critical') weatherFactor = Math.max(weatherFactor, 1.5);
      else if (zone.severity === 'High') weatherFactor = Math.max(weatherFactor, 1.25);
      else if (zone.severity === 'Medium') weatherFactor = Math.max(weatherFactor, 1.1);
      else if (zone.severity === 'Low') weatherFactor = Math.max(weatherFactor, 1.02);
    }
  }

  const fuelTons = baseFuel * weatherFactor;
  const co2Tons = fuelTons * 3.114;

  // Scale carbon tons to comparable cost scale
  const carbonScaleFactor = 5.0;

  return co2Tons * carbonScaleFactor * weights.carbon;
}

// Cost function registry for modularity and extensibility
export const costCalculators: Record<string, (edge: RoutingEdge) => number> = {
  distance: calculateDistanceCost,
  piracy: calculatePiracyCost,
  traffic: calculateTrafficCost,
  weather: calculateWeatherCost,
  fuel: calculateFuelCost,
  carbon: calculateCarbonCost
};

// Compute composite edge cost using all registered calculators
export function calculateFinalCost(edge: RoutingEdge): number {
  let totalCost = 0;
  for (const key of Object.keys(costCalculators)) {
    totalCost += costCalculators[key](edge);
  }
  return totalCost;
}

// Aggregate detailed cost breakdown for an entire node path
export function calculateRouteCostBreakdown(
  nodes: { lat: number; lng: number }[],
  mode: 'fastest' | 'balanced' | 'safest'
): CostBreakdown {
  const breakdown: CostBreakdown = {
    distance: 0,
    piracy: 0,
    traffic: 0,
    weather: 0,
    fuel: 0,
    carbon: 0,
    finalCost: 0
  };

  for (let i = 0; i < nodes.length - 1; i++) {
    const fromNode = nodes[i];
    const toNode = nodes[i + 1];
    const dist = haversineDistance(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);
    const edge: RoutingEdge = {
      fromNode,
      toNode,
      distance: dist,
      mode
    };

    breakdown.distance += calculateDistanceCost(edge);
    breakdown.piracy += calculatePiracyCost(edge);
    breakdown.traffic += calculateTrafficCost(edge);
    breakdown.weather += calculateWeatherCost(edge);
    breakdown.fuel += calculateFuelCost(edge);
    breakdown.carbon += calculateCarbonCost(edge);
  }

  breakdown.finalCost =
    breakdown.distance +
    breakdown.piracy +
    breakdown.traffic +
    breakdown.weather +
    breakdown.fuel +
    breakdown.carbon;

  return breakdown;
}
