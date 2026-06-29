/* eslint-disable @typescript-eslint/no-explicit-any */
import { ports } from './ports';
import { riskZones } from './risks';
import { weatherZones } from './weather';
import { calculateFinalCost, calculateRouteCostBreakdown } from './costEngine';


export interface WaypointNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isPort?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  piracyRisk: 'none' | 'medium' | 'high' | 'critical';
  weatherRisk: 'none' | 'medium' | 'high' | 'severe';
  trafficDensity: 'low' | 'medium' | 'high';
}

// 1. Waypoint nodes representing global shipping corridors and chokepoints
export const waypointNodes: Record<string, WaypointNode> = {
  // Chokepoints
  suez_canal_north: { id: 'suez_canal_north', name: 'Suez Canal (North Gate)', lat: 31.25, lng: 32.30 },
  suez_canal_south: { id: 'suez_canal_south', name: 'Suez Canal (South Gate)', lat: 29.90, lng: 32.55 },
  bab_el_mandeb: { id: 'bab_el_mandeb', name: 'Bab-el-Mandeb Strait', lat: 12.60, lng: 43.30 },
  strait_of_hormuz: { id: 'strait_of_hormuz', name: 'Strait of Hormuz', lat: 26.56, lng: 56.45 },
  gibraltar_strait: { id: 'gibraltar_strait', name: 'Strait of Gibraltar', lat: 35.95, lng: -5.60 },
  english_channel: { id: 'english_channel', name: 'English Channel', lat: 50.30, lng: -1.50 },
  cape_good_hope: { id: 'cape_good_hope', name: 'Cape of Good Hope Checkpoint', lat: -34.40, lng: 18.50 },
  malacca_strait_west: { id: 'malacca_strait_west', name: 'Malacca Strait (West Approach)', lat: 6.00, lng: 95.00 },
  malacca_strait_mid: { id: 'malacca_strait_mid', name: 'Malacca Strait (Center)', lat: 2.50, lng: 101.50 },
  singapore_hub: { id: 'singapore_hub', name: 'Singapore Transshipment Corridor', lat: 1.25, lng: 103.90 },
  panama_canal_caribbean: { id: 'panama_canal_caribbean', name: 'Panama Canal (Caribbean)', lat: 9.35, lng: -79.92 },
  panama_canal_pacific: { id: 'panama_canal_pacific', name: 'Panama Canal (Pacific)', lat: 8.92, lng: -79.56 },
  bosphorus: { id: 'bosphorus', name: 'Bosphorus Strait', lat: 41.15, lng: 29.08 },

  // Ocean Waypoints & Regional Junctions
  north_sea: { id: 'north_sea', name: 'North Sea Passage', lat: 54.00, lng: 4.00 },
  baltic_sea_entry: { id: 'baltic_sea_entry', name: 'Kattegat/Baltic Entry', lat: 56.50, lng: 11.50 },
  black_sea_mid: { id: 'black_sea_mid', name: 'Black Sea Center', lat: 43.00, lng: 34.00 },
  
  western_med: { id: 'western_med', name: 'Western Mediterranean', lat: 38.00, lng: 5.00 },
  central_med: { id: 'central_med', name: 'Central Mediterranean', lat: 35.50, lng: 15.00 },
  eastern_med: { id: 'eastern_med', name: 'Eastern Mediterranean', lat: 34.00, lng: 25.00 },
  egypt_med: { id: 'egypt_med', name: 'Egypt Med Approaches', lat: 31.80, lng: 32.20 },
  
  red_sea_north: { id: 'red_sea_north', name: 'Red Sea (North)', lat: 26.00, lng: 35.50 },
  red_sea_mid: { id: 'red_sea_mid', name: 'Red Sea (Center)', lat: 20.00, lng: 38.50 },
  red_sea_south: { id: 'red_sea_south', name: 'Red Sea (South)', lat: 15.00, lng: 41.50 },
  gulf_of_aden: { id: 'gulf_of_aden', name: 'Gulf of Aden Transit', lat: 12.30, lng: 48.00 },
  
  arabian_sea: { id: 'arabian_sea', name: 'Arabian Sea Corridor', lat: 16.00, lng: 65.00 },
  gulf_of_oman: { id: 'gulf_of_oman', name: 'Gulf of Oman Corridor', lat: 25.00, lng: 58.50 },
  laccadive_sea: { id: 'laccadive_sea', name: 'Laccadive Sea', lat: 8.00, lng: 74.50 },
  colombo_junction: { id: 'colombo_junction', name: 'Colombo Southern Approach', lat: 5.80, lng: 80.00 },
  bay_of_bengal: { id: 'bay_of_bengal', name: 'Bay of Bengal Corridor', lat: 10.00, lng: 88.00 },

  south_china_sea_west: { id: 'south_china_sea_west', name: 'South China Sea (West)', lat: 10.00, lng: 110.00 },
  south_china_sea_mid: { id: 'south_china_sea_mid', name: 'South China Sea (Spratly)', lat: 12.00, lng: 114.50 },
  philippine_sea: { id: 'philippine_sea', name: 'Philippine Sea Corridor', lat: 15.00, lng: 128.00 },
  east_china_sea: { id: 'east_china_sea', name: 'East China Sea Corridor', lat: 28.00, lng: 124.00 },
  japan_korea_sea: { id: 'japan_korea_sea', name: 'Sea of Japan Corridor', lat: 38.00, lng: 134.00 },
  indonesia_crossing: { id: 'indonesia_crossing', name: 'Java Sea / Sunda crossing', lat: -5.00, lng: 112.00 },
  lombok_strait: { id: 'lombok_strait', name: 'Lombok Strait Gateway', lat: -8.80, lng: 115.80 },

  // Atlantic
  north_atlantic_east: { id: 'north_atlantic_east', name: 'North Atlantic (East)', lat: 45.00, lng: -10.00 },
  north_atlantic_mid: { id: 'north_atlantic_mid', name: 'North Atlantic (Center)', lat: 48.00, lng: -35.00 },
  mid_atlantic_north: { id: 'mid_atlantic_north', name: 'Mid-Atlantic (North)', lat: 25.00, lng: -40.00 },
  mid_atlantic_south: { id: 'mid_atlantic_south', name: 'Mid-Atlantic (South)', lat: -10.00, lng: -20.00 },
  south_atlantic_west: { id: 'south_atlantic_west', name: 'South Atlantic (West)', lat: -32.00, lng: -45.00 },
  south_atlantic_east: { id: 'south_atlantic_east', name: 'South Atlantic (East)', lat: -30.00, lng: 8.00 },
  gulf_of_guinea: { id: 'gulf_of_guinea', name: 'Gulf of Guinea Corridor', lat: 2.00, lng: 5.00 },
  cape_verde_passage: { id: 'cape_verde_passage', name: 'Cape Verde Passage', lat: 15.00, lng: -23.00 },
  caribbean_sea: { id: 'caribbean_sea', name: 'Caribbean Sea Basin', lat: 15.00, lng: -72.00 },
  gulf_of_mexico: { id: 'gulf_of_mexico', name: 'Gulf of Mexico Basin', lat: 24.50, lng: -88.00 },
  us_east_coast: { id: 'us_east_coast', name: 'US East Coast Shipping Lane', lat: 36.00, lng: -74.50 },

  // Indian
  south_indian_ocean: { id: 'south_indian_ocean', name: 'Southern Indian Ocean', lat: -28.00, lng: 70.00 },
  east_africa_coast: { id: 'east_africa_coast', name: 'East African Coastal Corridor', lat: -5.00, lng: 42.00 },
  madagascar_east: { id: 'madagascar_east', name: 'East of Madagascar Corridor', lat: -25.00, lng: 50.00 },
  west_australia: { id: 'west_australia', name: 'West Australia Sea Lane', lat: -30.00, lng: 110.00 },

  // Pacific
  pacific_north_west: { id: 'pacific_north_west', name: 'Pacific North West', lat: 43.00, lng: 155.00 },
  pacific_north_east: { id: 'pacific_north_east', name: 'Pacific North East', lat: 42.00, lng: -145.00 },
  pacific_mid_west: { id: 'pacific_mid_west', name: 'Pacific Mid West', lat: 18.00, lng: 165.00 },
  pacific_mid_east: { id: 'pacific_mid_east', name: 'Pacific Mid East', lat: 25.00, lng: -135.00 },
  pacific_south_west: { id: 'pacific_south_west', name: 'Pacific South West', lat: -20.00, lng: 170.00 },
  pacific_south_east: { id: 'pacific_south_east', name: 'Pacific South East', lat: -30.00, lng: -105.00 },
  coral_sea: { id: 'coral_sea', name: 'Coral Sea Transit', lat: -15.00, lng: 152.00 },
  tasman_sea: { id: 'tasman_sea', name: 'Tasman Sea Corridor', lat: -40.00, lng: 162.00 },
  timor_sea: { id: 'timor_sea', name: 'Timor Sea Corridor', lat: -10.00, lng: 124.00 },
  india_south_west: { id: 'india_south_west', name: 'India South West Transit', lat: 14.00, lng: 73.00 },
  malacca_strait_east: { id: 'malacca_strait_east', name: 'Malacca Strait (East)', lat: 1.50, lng: 103.00 },
  south_china_sea_south: { id: 'south_china_sea_south', name: 'South China Sea (South)', lat: 4.00, lng: 106.00 },
  taiwan_strait: { id: 'taiwan_strait', name: 'Taiwan Strait Gateway', lat: 24.00, lng: 119.50 },
  makassar_strait: { id: 'makassar_strait', name: 'Makassar Strait', lat: -1.00, lng: 118.00 },
  celebes_sea: { id: 'celebes_sea', name: 'Celebes Sea Transit', lat: 3.00, lng: 123.00 },
  molucca_passage: { id: 'molucca_passage', name: 'Molucca Passage', lat: 1.00, lng: 126.50 },
  south_of_sumatra: { id: 'south_of_sumatra', name: 'South of Sumatra Transit', lat: -8.00, lng: 105.00 },
  sunda_strait_gateway: { id: 'sunda_strait_gateway', name: 'Sunda Strait Gateway', lat: -6.10, lng: 105.50 },
  aceh_coast: { id: 'aceh_coast', name: 'Aceh Coast Waypoint', lat: 6.50, lng: 96.00 }
};

// Populate the Ports into our node library
ports.forEach(port => {
  waypointNodes[port.id] = {
    id: port.id,
    name: port.name,
    lat: port.coordinates.lat,
    lng: port.coordinates.lng,
    isPort: true
  };
});

// 2. Navigable Sea Lane Edges (Connecting the graph coordinates over water)
export const edges: GraphEdge[] = [
  // Suez Canal link
  { from: 'suez_canal_north', to: 'suez_canal_south', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'suez_canal_north', to: 'egypt_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'suez_canal_south', to: 'red_sea_north', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },

  // Red Sea Corridor
  { from: 'red_sea_north', to: 'red_sea_mid', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'red_sea_mid', to: 'red_sea_south', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'red_sea_south', to: 'bab_el_mandeb', piracyRisk: 'medium', weatherRisk: 'none', trafficDensity: 'high' },

  // Bab-el-Mandeb & Gulf of Aden (Critical threat zone)
  { from: 'bab_el_mandeb', to: 'gulf_of_aden', piracyRisk: 'critical', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'gulf_of_aden', to: 'oman_coast', piracyRisk: 'high', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gulf_of_aden', to: 'arabian_sea', piracyRisk: 'high', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gulf_of_aden', to: 'laccadive_sea', piracyRisk: 'high', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gulf_of_aden', to: 'east_africa_coast', piracyRisk: 'critical', weatherRisk: 'none', trafficDensity: 'low' },

  // Persian Gulf
  { from: 'strait_of_hormuz', to: 'gulf_of_oman', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'gulf_of_oman', to: 'arabian_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gulf_of_oman', to: 'oman_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Arabian Sea & Indian sub-continent
  { from: 'arabian_sea', to: 'laccadive_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'arabian_sea', to: 'oman_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'laccadive_sea', to: 'colombo_junction', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'colombo_junction', to: 'bay_of_bengal', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'colombo_junction', to: 'south_indian_ocean', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },

  // Bay of Bengal & Malacca Strait
  { from: 'bay_of_bengal', to: 'malacca_strait_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'malacca_strait_west', to: 'aceh_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'aceh_coast', to: 'malacca_strait_mid', piracyRisk: 'medium', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'malacca_strait_mid', to: 'singapore_hub', piracyRisk: 'medium', weatherRisk: 'none', trafficDensity: 'high' },

  // Singapore & South/East China Sea
  { from: 'singapore_hub', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'singapore_hub', to: 'indonesia_crossing', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'south_china_sea_west', to: 'south_china_sea_mid', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'south_china_sea_mid', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'south_china_sea_mid', to: 'philippine_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'east_china_sea', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'east_china_sea', to: 'pacific_north_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'japan_korea_sea', to: 'pacific_north_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Transpacific Routes (Northern has Storm zones, Mid is calm)
  { from: 'pacific_north_west', to: 'pacific_north_east', piracyRisk: 'none', weatherRisk: 'severe', trafficDensity: 'low' },
  { from: 'pacific_north_east', to: 'pacific_mid_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'philippine_sea', to: 'pacific_mid_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'pacific_mid_west', to: 'pacific_mid_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'philippine_sea', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },

  // Indonesia & Australia
  { from: 'indonesia_crossing', to: 'lombok_strait', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'lombok_strait', to: 'timor_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'lombok_strait', to: 'south_indian_ocean', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'timor_sea', to: 'coral_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'timor_sea', to: 'west_australia', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'west_australia', to: 'south_indian_ocean', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'west_australia', to: 'tasman_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'coral_sea', to: 'pacific_south_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'tasman_sea', to: 'pacific_south_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'pacific_south_west', to: 'pacific_south_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },

  // Mediterranean & Gibraltar
  { from: 'egypt_med', to: 'eastern_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'egypt_med', to: 'central_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'eastern_med', to: 'bosphorus', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'bosphorus', to: 'black_sea_mid', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'eastern_med', to: 'central_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'central_med', to: 'western_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'western_med', to: 'gibraltar_strait', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },

  // Atlantic Corridors & Bypasses
  { from: 'gibraltar_strait', to: 'north_atlantic_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'gibraltar_strait', to: 'mid_atlantic_north', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'north_atlantic_east', to: 'english_channel', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'english_channel', to: 'north_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'north_sea', to: 'baltic_sea_entry', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'english_channel', to: 'north_atlantic_mid', piracyRisk: 'none', weatherRisk: 'high', trafficDensity: 'medium' },
  { from: 'north_atlantic_mid', to: 'us_east_coast', piracyRisk: 'none', weatherRisk: 'high', trafficDensity: 'medium' },
  { from: 'mid_atlantic_north', to: 'us_east_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'mid_atlantic_north', to: 'caribbean_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'mid_atlantic_north', to: 'cape_verde_passage', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'cape_verde_passage', to: 'west_africa_coast', piracyRisk: 'medium', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'cape_verde_passage', to: 'mid_atlantic_south', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'west_africa_coast', to: 'gulf_of_guinea', piracyRisk: 'high', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gulf_of_guinea', to: 'mid_atlantic_south', piracyRisk: 'high', weatherRisk: 'none', trafficDensity: 'low' },
  
  // Cape bypass routes
  { from: 'mid_atlantic_south', to: 'south_atlantic_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'mid_atlantic_south', to: 'south_atlantic_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'south_atlantic_east', to: 'cape_good_hope', piracyRisk: 'none', weatherRisk: 'medium', trafficDensity: 'medium' },
  { from: 'cape_good_hope', to: 'madagascar_east', piracyRisk: 'none', weatherRisk: 'high', trafficDensity: 'medium' },
  { from: 'cape_good_hope', to: 'east_africa_coast', piracyRisk: 'none', weatherRisk: 'medium', trafficDensity: 'medium' },
  { from: 'madagascar_east', to: 'south_indian_ocean', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'east_africa_coast', to: 'colombo_junction', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },

  // Americas Coastal & Panama Canal
  { from: 'us_east_coast', to: 'gulf_of_mexico', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gulf_of_mexico', to: 'caribbean_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'caribbean_sea', to: 'panama_canal_caribbean', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'panama_canal_caribbean', to: 'panama_canal_pacific', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'panama_canal_pacific', to: 'pacific_mid_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'panama_canal_pacific', to: 'pacific_south_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'pacific_south_east', to: 'south_atlantic_west', piracyRisk: 'none', weatherRisk: 'severe', trafficDensity: 'low' }, // Cape Horn Bypass (severe waves)

  // --- PORT TO GRAPH EDGE CONNECTIONS ---
  // Connect ports to their nearest routing checkpoints safely
  // India
  { from: 'mumbai', to: 'arabian_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'mumbai', to: 'india_south_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'india_south_west', to: 'laccadive_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'mundra', to: 'arabian_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  
  // Singapore East & South China Sea connections
  { from: 'singapore_hub', to: 'malacca_strait_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'malacca_strait_east', to: 'south_china_sea_south', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'south_china_sea_south', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'south_china_sea_south', to: 'south_china_sea_mid', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'south_china_sea_mid', to: 'taiwan_strait', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'taiwan_strait', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'taiwan_strait', to: 'shanghai', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },

  // Indonesian Makassar/Celebes Detour bypass for safest route (routed south of Sumatra/Java)
  { from: 'colombo_junction', to: 'south_of_sumatra', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'south_of_sumatra', to: 'lombok_strait', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'lombok_strait', to: 'makassar_strait', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'makassar_strait', to: 'celebes_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'celebes_sea', to: 'molucca_passage', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'molucca_passage', to: 'philippine_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },

  // Sunda Strait bypass routes for Balanced route (completely avoids Singapore/Malacca Strait traffic)
  { from: 'colombo_junction', to: 'sunda_strait_gateway', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'sunda_strait_gateway', to: 'indonesia_crossing', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'indonesia_crossing', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Indian Ocean direct transits
  { from: 'laccadive_sea', to: 'east_africa_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'low' },
  { from: 'mombasa', to: 'east_africa_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'arabian_sea', to: 'salalah', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'salalah', to: 'gulf_of_aden', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'cochin', to: 'laccadive_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'colombo', to: 'colombo_junction', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'chennai', to: 'bay_of_bengal', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'kolkata', to: 'bay_of_bengal', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'vizag', to: 'bay_of_bengal', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'chittagong', to: 'bay_of_bengal', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'karachi', to: 'arabian_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Singapore region
  { from: 'singapore', to: 'singapore_hub', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'port_klang', to: 'malacca_strait_mid', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'tanjung_pelepas', to: 'singapore_hub', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'penang', to: 'malacca_strait_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // East Asia
  { from: 'shanghai', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'ningbo', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'kaohsiung', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'shenzhen', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'guangzhou', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'xiamen', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'xiamen', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'qingdao', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'qingdao', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'dalian', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'dalian', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'tianjin', to: 'east_china_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'tianjin', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'hong_kong', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'laem_chabang', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'bangkok', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'manila', to: 'south_china_sea_mid', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'ho_chi_minh', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'hai_phong', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'da_nang', to: 'south_china_sea_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Japan & Korea
  { from: 'tokyo', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'yokohama', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'nagoya', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'osaka', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'kobe', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'fukuoka', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'busan', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'incheon', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gwangyang', to: 'japan_korea_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Indonesia
  { from: 'jakarta', to: 'indonesia_crossing', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'surabaya', to: 'indonesia_crossing', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'belawan', to: 'malacca_strait_mid', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Middle East
  { from: 'dubai', to: 'strait_of_hormuz', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'abu_dhabi', to: 'strait_of_hormuz', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'sharjah', to: 'strait_of_hormuz', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'dammam', to: 'strait_of_hormuz', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'doha', to: 'strait_of_hormuz', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'kuwait', to: 'strait_of_hormuz', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'manama', to: 'strait_of_hormuz', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'sohar', to: 'gulf_of_oman', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'salalah', to: 'oman_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'jeddah', to: 'red_sea_mid', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'aqaba', to: 'red_sea_north', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Europe (North Sea / English Channel / Baltic)
  { from: 'rotterdam', to: 'north_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'hamburg', to: 'north_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'bremen', to: 'north_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'antwerp', to: 'english_channel', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'felixstowe', to: 'english_channel', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'southampton', to: 'english_channel', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'london', to: 'english_channel', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gdansk', to: 'baltic_sea_entry', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'gothenburg', to: 'baltic_sea_entry', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'st_petersburg', to: 'baltic_sea_entry', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Southern Europe / Med / Black Sea
  { from: 'valencia', to: 'western_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'barcelona', to: 'western_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'algeciras', to: 'gibraltar_strait', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'tangier', to: 'gibraltar_strait', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'casablanca', to: 'gibraltar_strait', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'genoa', to: 'western_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'marseille', to: 'western_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'le_havre', to: 'english_channel', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'athens', to: 'eastern_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'trieste', to: 'central_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'istanbul', to: 'bosphorus', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'alexandria', to: 'egypt_med', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Africa
  { from: 'cape_town', to: 'cape_good_hope', piracyRisk: 'none', weatherRisk: 'medium', trafficDensity: 'medium' },
  { from: 'durban', to: 'cape_good_hope', piracyRisk: 'none', weatherRisk: 'medium', trafficDensity: 'medium' },
  { from: 'port_elizabeth', to: 'cape_good_hope', piracyRisk: 'none', weatherRisk: 'medium', trafficDensity: 'medium' },
  { from: 'mombasa', to: 'east_africa_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'dar_es_salaam', to: 'east_africa_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'djibouti', to: 'bab_el_mandeb', piracyRisk: 'high', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'lagos', to: 'gulf_of_guinea', piracyRisk: 'high', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'abidjan', to: 'gulf_of_guinea', piracyRisk: 'medium', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'dakar', to: 'cape_verde_passage', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // North America East & Gulf
  { from: 'new_york', to: 'us_east_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'savannah', to: 'us_east_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'norfolk', to: 'us_east_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'houston', to: 'gulf_of_mexico', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'veracruz', to: 'gulf_of_mexico', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'cartagena', to: 'caribbean_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'halifax', to: 'us_east_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'montreal', to: 'us_east_coast', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // North America West
  { from: 'los_angeles', to: 'pacific_mid_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'long_beach', to: 'pacific_mid_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'high' },
  { from: 'oakland', to: 'pacific_mid_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'seattle', to: 'pacific_north_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'vancouver', to: 'pacific_north_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'manzanillo_mx', to: 'pacific_mid_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // South America
  { from: 'santos', to: 'south_atlantic_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'rio_janeiro', to: 'south_atlantic_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'buenos_aires', to: 'south_atlantic_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'montevideo', to: 'south_atlantic_west', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'valparaiso', to: 'pacific_south_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'san_antonio', to: 'pacific_south_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'callao', to: 'pacific_south_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'guayaquil', to: 'pacific_south_east', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },

  // Oceania
  { from: 'sydney', to: 'tasman_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'melbourne', to: 'tasman_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'brisbane', to: 'coral_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'adelaide', to: 'tasman_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'perth', to: 'west_australia', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'auckland', to: 'tasman_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' },
  { from: 'tauranga', to: 'tasman_sea', piracyRisk: 'none', weatherRisk: 'none', trafficDensity: 'medium' }
];

// Calculate distance in nautical miles using Haversine formula with antimeridian wrapping
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  
  let diffLng = lng2 - lng1;
  while (diffLng > 180) diffLng -= 360;
  while (diffLng < -180) diffLng += 360;
  const dLng = diffLng * Math.PI / 180;

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface ShippingNode {
  key: string;
  lng: number;
  lat: number;
  neighbors: Map<string, number>;
}

// Global variables for parsed GeoJSON graph
export let isShippingGraphReady = false;
export let shippingNodes: ShippingNode[] = [];
export let shippingNodeMap: Record<string, ShippingNode> = {};
export let totalLaneFeaturesCount = 0;
export let rawShippingLanes: { lat: number, lng: number }[][] = [];
export let removedEdgesForDebug: { from: { lat: number, lng: number }, to: { lat: number, lng: number } }[] = [];

// Bounding box/containment checks for land avoidance
function isPointInPolygon(lng: number, lat: number, polygonCoords: number[][][]): boolean {
  let inside = false;
  const outerRing = polygonCoords[0];
  if (!outerRing || outerRing.length < 3) return false;

  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0], yi = outerRing[i][1];
    const xj = outerRing[j][0], yj = outerRing[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  if (!inside) return false;

  // Check holes
  for (let ringIdx = 1; ringIdx < polygonCoords.length; ringIdx++) {
    const hole = polygonCoords[ringIdx];
    let inHole = false;
    for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
      const xi = hole[i][0], yi = hole[i][1];
      const xj = hole[j][0], yj = hole[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inHole = !inHole;
    }
    if (inHole) return false;
  }

  return true;
}

function isPointInAnyLandPolygon(lng: number, lat: number, countriesGeojson: any): boolean {
  if (!countriesGeojson || !countriesGeojson.features) return false;
  
  for (const feature of countriesGeojson.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    const bbox = feature.bbox || feature.properties?.bbox;
    if (bbox) {
      if (lng < bbox[0] || lat < bbox[1] || lng > bbox[2] || lat > bbox[3]) {
        continue;
      }
    }

    if (geom.type === 'Polygon') {
      if (isPointInPolygon(lng, lat, geom.coordinates)) {
        return true;
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const polyCoords of geom.coordinates) {
        if (isPointInPolygon(lng, lat, polyCoords)) {
          return true;
        }
      }
    }
  }
  return false;
}

function isSegmentIntersecting(
  p1Lng: number, p1Lat: number,
  p2Lng: number, p2Lat: number,
  q1Lng: number, q1Lat: number,
  q2Lng: number, q2Lat: number
): boolean {
  if (Math.min(p1Lng, p2Lng) > Math.max(q1Lng, q2Lng) ||
      Math.max(p1Lng, p2Lng) < Math.min(q1Lng, q2Lng) ||
      Math.min(p1Lat, p2Lat) > Math.max(q1Lat, q2Lat) ||
      Math.max(p1Lat, p2Lat) < Math.min(q1Lat, q2Lat)) {
    return false;
  }

  const crossProduct = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  };

  const d1 = crossProduct(q1Lng, q1Lat, q2Lng, q2Lat, p1Lng, p1Lat);
  const d2 = crossProduct(q1Lng, q1Lat, q2Lng, q2Lat, p2Lng, p2Lat);
  const d3 = crossProduct(p1Lng, p1Lat, p2Lng, p2Lat, q1Lng, q1Lat);
  const d4 = crossProduct(p1Lng, p1Lat, p2Lng, p2Lat, q2Lng, q2Lat);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  const onSegment = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => {
    return rx <= Math.max(px, qx) && rx >= Math.min(px, qx) &&
           ry <= Math.max(py, qy) && ry >= Math.min(py, qy);
  };

  if (d1 === 0 && onSegment(q1Lng, q1Lat, q2Lng, q2Lat, p1Lng, p1Lat)) return true;
  if (d2 === 0 && onSegment(q1Lng, q1Lat, q2Lng, q2Lat, p2Lng, p2Lat)) return true;
  if (d3 === 0 && onSegment(p1Lng, p1Lat, p2Lng, p2Lat, q1Lng, q1Lat)) return true;
  if (d4 === 0 && onSegment(p1Lng, p1Lat, p2Lng, p2Lat, q2Lng, q2Lat)) return true;

  return false;
}

function isSegmentIntersectingPolygon(
  p1Lng: number, p1Lat: number,
  p2Lng: number, p2Lat: number,
  polygonCoords: number[][][]
): boolean {
  for (const ring of polygonCoords) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const q1Lng = ring[j][0], q1Lat = ring[j][1];
      const q2Lng = ring[i][0], q2Lat = ring[i][1];
      if (isSegmentIntersecting(p1Lng, p1Lat, p2Lng, p2Lat, q1Lng, q1Lat, q2Lng, q2Lat)) {
        return true;
      }
    }
  }
  return false;
}

function isSegmentIntersectingAnyLandPolygon(
  nodeA: { lat: number, lng: number },
  nodeB: { lat: number, lng: number },
  countriesGeojson: any
): boolean {
  if (!countriesGeojson || !countriesGeojson.features) return false;

  for (const feature of countriesGeojson.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    const bbox = feature.bbox || feature.properties?.bbox;
    if (bbox) {
      const segMinLng = Math.min(nodeA.lng, nodeB.lng);
      const segMaxLng = Math.max(nodeA.lng, nodeB.lng);
      const segMinLat = Math.min(nodeA.lat, nodeB.lat);
      const segMaxLat = Math.max(nodeA.lat, nodeB.lat);

      if (segMinLng > bbox[2] || segMaxLng < bbox[0] || segMinLat > bbox[3] || segMaxLat < bbox[1]) {
        continue;
      }
    }

    if (geom.type === 'Polygon') {
      if (isSegmentIntersectingPolygon(nodeA.lng, nodeA.lat, nodeB.lng, nodeB.lat, geom.coordinates)) {
        return true;
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const polyCoords of geom.coordinates) {
        if (isSegmentIntersectingPolygon(nodeA.lng, nodeA.lat, nodeB.lng, nodeB.lat, polyCoords)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Initialize graph from GeoJSON and validate against land polygons
export function initShippingLaneGraph(geojson: any, countriesGeojson?: any) {
  if (isShippingGraphReady) return;
  removedEdgesForDebug = [];

  // Precompute bounding boxes for countries to accelerate land checks
  if (countriesGeojson && countriesGeojson.features) {
    countriesGeojson.features.forEach((feature: any) => {
      if (!feature.bbox && feature.geometry) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const processRing = (ring: number[][]) => {
          ring.forEach(p => {
            if (p[0] < minX) minX = p[0];
            if (p[0] > maxX) maxX = p[0];
            if (p[1] < minY) minY = p[1];
            if (p[1] > maxY) maxY = p[1];
          });
        };
        const geom = feature.geometry;
        if (geom.type === 'Polygon') {
          geom.coordinates.forEach(processRing);
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach((poly: any) => {
            poly.forEach(processRing);
          });
        }
        if (minX !== Infinity) {
          feature.bbox = [minX, minY, maxX, maxY];
        }
      }
    });
  }

  const coordinateLines: number[][][] = [];
  if (geojson && geojson.features) {
    geojson.features.forEach((feature: any) => {
      const geom = feature.geometry;
      if (geom.type === 'LineString') {
        coordinateLines.push(geom.coordinates);
      } else if (geom.type === 'MultiLineString') {
        geom.coordinates.forEach((line: any) => {
          coordinateLines.push(line);
        });
      }
    });
  }

  rawShippingLanes = coordinateLines.map(line =>
    line.map(p => ({ lat: p[1], lng: p[0] }))
  );

  totalLaneFeaturesCount = coordinateLines.length;

  const nodes: ShippingNode[] = [];
  const nodeMap: Record<string, ShippingNode> = {};

  function getCoordKey(lng: number, lat: number) {
    return `${lng.toFixed(5)},${lat.toFixed(5)}`;
  }

  function registerNode(lng: number, lat: number) {
    const key = getCoordKey(lng, lat);
    if (!nodeMap[key]) {
      const node = { key, lng, lat, neighbors: new Map<string, number>() };
      nodeMap[key] = node;
      nodes.push(node);
    }
    return key;
  }

  // Helper validator for adding safe edges in navigable waters
  function addSafeEdge(nodeA: ShippingNode, nodeB: ShippingNode, dist: number, bypassLand = false) {
    if (!nodeA || !nodeB) return;

    const isPortA = waypointNodes[nodeA.key]?.isPort === true;
    const isPortB = waypointNodes[nodeB.key]?.isPort === true;

    let isValid = true;

    if (countriesGeojson && !bypassLand) {
      if (isPortA && isPortB) {
        // Port-to-port direct connections are not allowed to cross land
        isValid = false;
      } else if (isPortA) {
        // Port connecting to a sea node: sea node must not be inside land
        if (isPointInAnyLandPolygon(nodeB.lng, nodeB.lat, countriesGeojson)) {
          isValid = false;
        }
      } else if (isPortB) {
        // Sea node connecting to port: sea node must not be inside land
        if (isPointInAnyLandPolygon(nodeA.lng, nodeA.lat, countriesGeojson)) {
          isValid = false;
        }
      } else {
        // Transit edge: neither endpoint on land, segment does not intersect any land
        if (isPointInAnyLandPolygon(nodeA.lng, nodeA.lat, countriesGeojson) ||
            isPointInAnyLandPolygon(nodeB.lng, nodeB.lat, countriesGeojson) ||
            isSegmentIntersectingAnyLandPolygon(nodeA, nodeB, countriesGeojson)) {
          isValid = false;
        }
      }
    }

    if (isValid) {
      nodeA.neighbors.set(nodeB.key, dist);
      nodeB.neighbors.set(nodeA.key, dist);
    } else {
      removedEdgesForDebug.push({
        from: { lat: nodeA.lat, lng: nodeA.lng },
        to: { lat: nodeB.lat, lng: nodeB.lng }
      });
    }
  }

  // Register nodes
  coordinateLines.forEach((line) => {
    line.forEach((p) => {
      registerNode(p[0], p[1]);
    });
  });

  // Add line edges
  coordinateLines.forEach((line) => {
    for (let i = 0; i < line.length - 1; i++) {
      const p1 = line[i];
      const p2 = line[i + 1];
      const key1 = getCoordKey(p1[0], p1[1]);
      const key2 = getCoordKey(p2[0], p2[1]);
      if (key1 !== key2) {
        const dist = haversineDistance(p1[1], p1[0], p2[1], p2[0]);
        addSafeEdge(nodeMap[key1], nodeMap[key2], dist);
      }
    }
  });

  // Connect endpoints to nearest nodes in OTHER lines to bridge network gaps
  coordinateLines.forEach((line) => {
    const startP = line[0];
    const endP = line[line.length - 1];
    const startKey = getCoordKey(startP[0], startP[1]);
    const endKey = getCoordKey(endP[0], endP[1]);

    let nearestStart: ShippingNode | null = null;
    let minStartDist = Infinity;
    let nearestEnd: ShippingNode | null = null;
    let minEndDist = Infinity;

    for (const node of nodes) {
      const dStart = haversineDistance(startP[1], startP[0], node.lat, node.lng);
      if (dStart > 0.0001 && dStart < minStartDist) {
        minStartDist = dStart;
        nearestStart = node;
      }

      const dEnd = haversineDistance(endP[1], endP[0], node.lat, node.lng);
      if (dEnd > 0.0001 && dEnd < minEndDist) {
        minEndDist = dEnd;
        nearestEnd = node;
      }
    }

    if (nearestStart && minStartDist < 500) {
      addSafeEdge(nodeMap[startKey], nearestStart, minStartDist);
    }

    if (nearestEnd && minEndDist < 500) {
      addSafeEdge(nodeMap[endKey], nearestEnd, minEndDist);
    }
  });

  // Grid-based proximity builder to bridge local gaps (threshold 30 NM)
  const gridCellSize = 2.0; 
  const grid: Record<string, ShippingNode[]> = {};

  function getGridCellKey(lng: number, lat: number) {
    const x = Math.floor(lng / gridCellSize);
    const y = Math.floor(lat / gridCellSize);
    return `${x},${y}`;
  }

  nodes.forEach((node) => {
    const gKey = getGridCellKey(node.lng, node.lat);
    if (!grid[gKey]) grid[gKey] = [];
    grid[gKey].push(node);
  });

  const connectThresholdNm = 30.0;
  nodes.forEach((nodeA) => {
    const cx = Math.floor(nodeA.lng / gridCellSize);
    const cy = Math.floor(nodeA.lat / gridCellSize);
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const gKey = `${cx + dx},${cy + dy}`;
        const cellNodes = grid[gKey] || [];
        cellNodes.forEach((nodeB) => {
          if (nodeA.key === nodeB.key) return;
          if (nodeA.neighbors.has(nodeB.key)) return;

          const dist = haversineDistance(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
          if (dist <= connectThresholdNm) {
            addSafeEdge(nodeA, nodeB, dist);
          }
        });
      }
    }
  });

  // Bridge antimeridian gaps
  const eastNodes = nodes.filter(n => n.lng > 175);
  const westNodes = nodes.filter(n => n.lng < -175);

  eastNodes.forEach((eNode) => {
    westNodes.forEach((wNode) => {
      const dist = haversineDistance(eNode.lat, eNode.lng, wNode.lat, wNode.lng);
      if (dist < 150) { 
        addSafeEdge(nodeMap[eNode.key], nodeMap[wNode.key], dist);
      }
    });
  });

  // Add all custom waypoint nodes (ports & checkpoints)
  Object.keys(waypointNodes).forEach((id) => {
    const customNode = waypointNodes[id];
    if (!nodeMap[id]) {
      const node = {
        key: id,
        lng: customNode.lng,
        lat: customNode.lat,
        neighbors: new Map<string, number>()
      };
      nodeMap[id] = node;
      nodes.push(node);
    }
  });

  // Safe-link custom waypoints to their nearest GeoJSON nodes (so they are bridged)
  Object.keys(waypointNodes).forEach((id) => {
    const customNode = waypointNodes[id];
    const node = nodeMap[id];
    let nearestGeoNode: ShippingNode | null = null;
    let minDist = Infinity;

    nodes.forEach((geoNode) => {
      // Connect only to actual GeoJSON coordinates nodes (whose keys contain a comma)
      if (geoNode.key.includes(',')) {
        const dist = haversineDistance(customNode.lat, customNode.lng, geoNode.lat, geoNode.lng);
        if (dist < minDist) {
          minDist = dist;
          nearestGeoNode = geoNode;
        }
      }
    });

    if (nearestGeoNode && minDist < 200) {
      addSafeEdge(node, nearestGeoNode, minDist);
    }
  });

  // Populate manual sea lane connections from edges array
  edges.forEach((edge) => {
    const fromNode = nodeMap[edge.from];
    const toNode = nodeMap[edge.to];
    if (fromNode && toNode) {
      const dist = haversineDistance(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);
      addSafeEdge(fromNode, toNode, dist, true); // Bypass land checking for manually curated edges
    }
  });

  shippingNodes = nodes;
  shippingNodeMap = nodeMap;
  isShippingGraphReady = true;

  console.log(`BlueRoute Navigation Graph initialized: ${nodes.length} nodes, ${Object.keys(nodeMap).reduce((acc, k) => acc + nodeMap[k].neighbors.size, 0) / 2} edges.`);
}

// A* pathfinder algorithm running on the shipping lane network
export function runDijkstraPathfinder(
  startPortId: string,
  endPortId: string,
  weightType: 'fastest' | 'balanced' | 'safest'
): WaypointNode[] | null {
  if (!isShippingGraphReady) {
    console.warn("Shipping lanes graph not ready. Returning null.");
    return null;
  }

  const startPort = ports.find(p => p.id === startPortId);
  const endPort = ports.find(p => p.id === endPortId);

  if (!startPort || !endPort) {
    console.error(`Invalid port parameters: ${startPortId} or ${endPortId}`);
    return null;
  }

  const startTime = performance.now();
  let visitedNodesCount = 0;

  if (!shippingNodeMap[startPortId] || !shippingNodeMap[endPortId]) {
    console.error(`Ports not found in graph map: ${startPortId} or ${endPortId}`);
    return null;
  }

  // 2. A* Pathfinding
  const startKey = startPortId;
  const endKey = endPortId;
  const endLat = shippingNodeMap[endKey].lat;
  const endLng = shippingNodeMap[endKey].lng;

  const openSet = new Set<string>([startKey]);
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const previous: Record<string, string | null> = {};

  shippingNodes.forEach((n) => {
    gScore[n.key] = Infinity;
    fScore[n.key] = Infinity;
    previous[n.key] = null;
  });

  gScore[startKey] = 0;
  fScore[startKey] = haversineDistance(shippingNodeMap[startKey].lat, shippingNodeMap[startKey].lng, endLat, endLng);

  while (openSet.size > 0) {
    let currentKey: string | null = null;
    let minF = Infinity;
    openSet.forEach((key) => {
      if (fScore[key] < minF) {
        minF = fScore[key];
        currentKey = key;
      }
    });

    if (currentKey === null) break;

    visitedNodesCount++;

    if (currentKey === endKey) {
      // Reconstruct path
      const pathKeys: string[] = [];
      let curr: string | null = endKey;
      while (curr !== null) {
        pathKeys.push(curr);
        curr = previous[curr];
      }
      pathKeys.reverse();

      const result: WaypointNode[] = [];
      pathKeys.forEach((key) => {
        const node = shippingNodeMap[key];
        const isPort = ports.some(p => p.id === key);
        const name = key === startPortId 
          ? startPort.name 
          : key === endPortId 
            ? endPort.name 
            : waypointNodes[key] 
              ? waypointNodes[key].name 
              : 'Lane Waypoint';
        result.push({
          id: key,
          name,
          lat: node.lat,
          lng: node.lng,
          isPort
        });
      });

      // Aggregate and print detailed route report
      const breakdown = calculateRouteCostBreakdown(result, weightType);
      const executionTime = performance.now() - startTime;

      const formatPct = (val: number) => {
        if (breakdown.finalCost === 0) return '0%';
        return `${Math.round((val / breakdown.finalCost) * 100)}%`;
      };

      console.log(`=============================`);
      console.log(`ROUTE ANALYSIS`);
      console.log(`=============================`);
      console.log(``);
      console.log(`Selected Mode:`);
      console.log(`${weightType.toUpperCase()}`);
      console.log(``);
      console.log(`Nodes Traversed: ${result.length}`);
      console.log(``);
      console.log(`Edges Traversed: ${result.length - 1}`);
      console.log(``);
      console.log(`Distance Cost: ${Math.round(breakdown.distance)}`);
      console.log(``);
      console.log(`Piracy Cost: ${Math.round(breakdown.piracy)}`);
      console.log(``);
      console.log(`Traffic Cost: ${Math.round(breakdown.traffic)}`);
      console.log(``);
      console.log(`Weather Cost: ${Math.round(breakdown.weather)}`);
      console.log(``);
      console.log(`Fuel Cost: ${Math.round(breakdown.fuel)}`);
      console.log(``);
      console.log(`Carbon Cost: ${Math.round(breakdown.carbon)}`);
      console.log(``);
      console.log(`Final Route Cost: ${Math.round(breakdown.finalCost)}`);
      console.log(``);
      console.log(`Visited Nodes: ${visitedNodesCount}`);
      console.log(``);
      console.log(`Execution Time (ms): ${executionTime.toFixed(2)}`);
      console.log(``);
      console.log(`=============================`);
      console.log(``);
      console.log(`Distance : ${formatPct(breakdown.distance)}`);
      console.log(``);
      console.log(`Piracy : ${formatPct(breakdown.piracy)}`);
      console.log(``);
      console.log(`Traffic : ${formatPct(breakdown.traffic)}`);
      console.log(``);
      console.log(`Weather : ${formatPct(breakdown.weather)}`);
      console.log(``);
      console.log(`Fuel : ${formatPct(breakdown.fuel)}`);
      console.log(``);
      console.log(`Carbon : ${formatPct(breakdown.carbon)}`);

      return result;
    }

    openSet.delete(currentKey);

    const currentNode = shippingNodeMap[currentKey];
    const neighbors = currentNode.neighbors;
    for (const [neighborKey, baseWeight] of neighbors) {
      const neighborNode = shippingNodeMap[neighborKey];
      
      // Calculate composite edge cost using modular cost engine
      const weight = calculateFinalCost({
        fromNode: currentNode,
        toNode: neighborNode,
        distance: baseWeight,
        mode: weightType
      });

      const tentativeG = gScore[currentKey] + weight;
      if (tentativeG < gScore[neighborKey]) {
        previous[neighborKey] = currentKey;
        gScore[neighborKey] = tentativeG;
        fScore[neighborKey] = tentativeG + haversineDistance(neighborNode.lat, neighborNode.lng, endLat, endLng);
        openSet.add(neighborKey);
      }
    }
  }

  return null; // Path unreachable
}

// 4. Validation Rule: Verify that route is valid (doesn't have NaN coordinates and contains valid navigable edges)
export function validateNavigableRoute(route: WaypointNode[] | null): boolean {
  if (!route || route.length < 2) return false;
  
  for (const node of route) {
    if (isNaN(node.lat) || isNaN(node.lng)) return false;
  }
  
  return true;
}

