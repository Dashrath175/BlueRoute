import { initShippingLaneGraph, totalLaneFeaturesCount, shippingNodes, shippingNodeMap } from './routingGraph';

export interface DatasetMetrics {
  totalPorts: number;
  totalPiracy: number;
  totalLanes: number;
  totalLaneFeatures: number;
  totalGraphNodes: number;
  totalGraphEdges: number;
  status: 'loading' | 'success' | 'error';
  errors: string[];
}

export function parseCSV(text: string, delimiter: string = ','): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(currentToken);
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentToken);
      if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
        lines.push(row);
      }
      row = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  if (currentToken || row.length > 0) {
    row.push(currentToken);
    if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
      lines.push(row);
    }
  }
  return lines;
}

export async function loadAllDatasets(): Promise<DatasetMetrics> {
  const metrics: DatasetMetrics = {
    totalPorts: 0,
    totalPiracy: 0,
    totalLanes: 0,
    totalLaneFeatures: 0,
    totalGraphNodes: 0,
    totalGraphEdges: 0,
    status: 'loading',
    errors: []
  };

  try {
    const portsRes = await fetch('/data/ports.csv');
    if (!portsRes.ok) throw new Error(`HTTP error fetching ports.csv: ${portsRes.status}`);
    const portsText = await portsRes.text();
    const portsRows = parseCSV(portsText, '\t');
    
    if (portsRows.length > 0) {
      metrics.totalPorts = portsRows.length - 1; // Exclude header
      console.log('BlueRoute - Ports Sample:', portsRows.slice(0, 4));
    } else {
      throw new Error('ports.csv is empty');
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('BlueRoute - Error parsing ports.csv:', err);
    metrics.errors.push(`Ports: ${err.message}`);
  }

  try {
    const piracyRes = await fetch('/data/pirate_attacks.csv');
    if (!piracyRes.ok) throw new Error(`HTTP error fetching pirate_attacks.csv: ${piracyRes.status}`);
    const piracyText = await piracyRes.text();
    const piracyRows = parseCSV(piracyText, ',');
    
    if (piracyRows.length > 0) {
      metrics.totalPiracy = piracyRows.length - 1; // Exclude header
      console.log('BlueRoute - Piracy Sample:', piracyRows.slice(0, 4));
    } else {
      throw new Error('pirate_attacks.csv is empty');
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('BlueRoute - Error parsing pirate_attacks.csv:', err);
    metrics.errors.push(`Piracy: ${err.message}`);
  }

  try {
    const countriesRes = await fetch('/data/countries.geojson');
    if (!countriesRes.ok) throw new Error(`HTTP error fetching countries.geojson: ${countriesRes.status}`);
    const countriesJson = await countriesRes.json();

    const lanesRes = await fetch('/data/Shipping_Lanes_v1.geojson');
    if (!lanesRes.ok) throw new Error(`HTTP error fetching Shipping_Lanes_v1.geojson: ${lanesRes.status}`);
    const lanesJson = await lanesRes.json();
    
    if (lanesJson && lanesJson.features) {
      metrics.totalLanes = lanesJson.features.length;
      console.log('BlueRoute - Shipping Lanes Features Sample:', lanesJson.features.slice(0, 2));
      initShippingLaneGraph(lanesJson, countriesJson);
      metrics.totalLaneFeatures = totalLaneFeaturesCount;
      metrics.totalGraphNodes = shippingNodes.length;
      metrics.totalGraphEdges = Object.keys(shippingNodeMap).reduce((acc, k) => acc + shippingNodeMap[k].neighbors.size, 0) / 2;
    } else {
      throw new Error('Shipping_Lanes_v1.geojson features property is missing');
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('BlueRoute - Error parsing datasets:', err);
    metrics.errors.push(`Shipping Lanes/Countries: ${err.message}`);
  }

  metrics.status = metrics.errors.length === 0 ? 'success' : 'error';
  return metrics;
}
