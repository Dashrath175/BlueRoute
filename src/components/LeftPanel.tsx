/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { Anchor, CloudSun, ShieldAlert, Navigation, Activity, Leaf, Palette, X } from 'lucide-react';
import { Port } from '../data/ports';
import { RouteOption } from '../data/routes';
import { DatasetMetrics } from '../data/datasetLoader';

interface LeftPanelProps {
  ports: Port[];
  selectedFromPort: Port | null;
  selectedToPort: Port | null;
  generatedRoutes: RouteOption[];
  activeRouteId: string | null;
  showWeather: boolean;
  showPiracy: boolean;
  showTraffic: boolean;
  onFromPortChange: (port: Port | null) => void;
  onToPortChange: (port: Port | null) => void;
  onActiveRouteSelect: (routeId: string) => void;
  onToggleWeather: (val: boolean) => void;
  onTogglePiracy: (val: boolean) => void;
  onToggleTraffic: (val: boolean) => void;
  datasetMetrics: DatasetMetrics;

  // Theme Props
  selectedPresetKey: string;
  onSelectPreset: (key: string) => void;
  waterColor: string;
  landColor: string;
  bgColor: string;
  onCustomColorChange: (type: 'water' | 'land' | 'bg', value: string) => void;
}

export default function LeftPanel({
  ports,
  selectedFromPort,
  selectedToPort,
  generatedRoutes,
  activeRouteId,
  showWeather,
  showPiracy,
  showTraffic,
  onFromPortChange,
  onToPortChange,
  onActiveRouteSelect,
  onToggleWeather,
  onTogglePiracy,
  onToggleTraffic,
  datasetMetrics,

  // Theme Bindings
  selectedPresetKey,
  onSelectPreset,
  waterColor,
  landColor,
  bgColor,
  onCustomColorChange
}: LeftPanelProps) {
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Sync state if selected from parent (e.g. globe click)
  useEffect(() => {
    if (selectedFromPort) {
      setFromSearch(`${selectedFromPort.city} (${selectedFromPort.country})`);
    } else {
      setFromSearch('');
    }
  }, [selectedFromPort]);

  useEffect(() => {
    if (selectedToPort) {
      setToSearch(`${selectedToPort.city} (${selectedToPort.country})`);
    } else {
      setToSearch('');
    }
  }, [selectedToPort]);

  // Filter ports (only show cargo hubs for voyage planning)
  const filteredFromPorts = ports.filter(port =>
    port.type === 'hub' &&
    `${port.name} ${port.city} ${port.country}`.toLowerCase().includes(fromSearch.toLowerCase()) &&
    port.id !== selectedToPort?.id
  );

  const filteredToPorts = ports.filter(port =>
    port.type === 'hub' &&
    `${port.name} ${port.city} ${port.country}`.toLowerCase().includes(toSearch.toLowerCase()) &&
    port.id !== selectedFromPort?.id
  );

  const activeRoute = generatedRoutes.find(r => r.id === activeRouteId);

  // Environmental rating calculator helper (Brutalist White text on Solid color)
  const getCarbonRating = (co2: number) => {
    if (co2 < 1300) return { grade: 'A', color: 'text-white bg-brand-success border-slate-900', desc: 'Optimal Green corridor. Low speed slow-steaming.' };
    if (co2 < 1700) return { grade: 'B', color: 'text-white bg-brand-glow border-slate-900', desc: 'Standard carbon rating. Normal operations.' };
    if (co2 < 2300) return { grade: 'C', color: 'text-white bg-brand-warning border-slate-900', desc: 'Warning: Increased fuel consumption due to speed/distance.' };
    return { grade: 'E', color: 'text-white bg-brand-danger border-slate-900', desc: 'Critical: Maximum emissions bypass route around continents.' };
  };

  return (
    <aside className="w-96 flex flex-col h-full bg-brand-bg-dark border-r-3 border-slate-900 overflow-y-auto" id="left-sidebar-panel">
      {/* Route Planner Section */}
      <div className="p-4 border-b-3 border-slate-900 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-brand-sky" />
            <h2 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-900">Voyage Route Planner</h2>
          </div>
          <span className="font-mono text-[9px] bg-brand-glow text-white border-2 border-slate-900 px-1.5 py-0.5 rounded-none shadow-[1px_1px_0px_#000] font-bold">AUTO_NAV</span>
        </div>

        {/* Departure Port Search */}
        <div className="relative mb-4">
          <label className="block font-mono text-[10px] uppercase text-slate-900 font-extrabold mb-1">Departure Port (From)</label>
          <div className="relative">
            <Anchor className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              id="departure-search-input"
              type="text"
              autoComplete="off"
              className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2 pl-9 pr-8 font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-sky shadow-[2px_2px_0px_rgba(15,23,42,1)]"
              placeholder="Search departure port..."
              value={fromSearch}
              onChange={(e) => {
                setFromSearch(e.target.value);
                setShowFromSuggestions(true);
                if (!e.target.value) onFromPortChange(null);
              }}
              onFocus={() => setShowFromSuggestions(true)}
            />
            {fromSearch && (
              <button
                type="button"
                onClick={() => {
                  setFromSearch('');
                  onFromPortChange(null);
                  setShowFromSuggestions(false);
                }}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center"
                title="Clear departure"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {showFromSuggestions && fromSearch && filteredFromPorts.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border-2 border-slate-900 rounded-none mt-1 max-h-40 overflow-y-auto shadow-[4px_4px_0px_#1d4ed8]">
              {filteredFromPorts.map(port => (
                <li
                  key={`from-port-${port.id}`}
                  className="px-3 py-2 hover:bg-brand-glow/10 cursor-pointer font-mono text-xs text-slate-900 border-b border-slate-200 flex justify-between items-center"
                  onClick={() => {
                    onFromPortChange(port);
                    setFromSearch(`${port.city} (${port.country})`);
                    setShowFromSuggestions(false);
                  }}
                >
                  <div>
                    <span className="text-slate-900 font-bold">{port.city}</span>
                    <span className="text-slate-500 text-[10px] ml-1">({port.country})</span>
                  </div>
                  <span className="text-[10px] text-brand-sky font-bold">{port.type.toUpperCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Arrival Port Search */}
        <div className="relative mb-3">
          <label className="block font-mono text-[10px] uppercase text-slate-900 font-extrabold mb-1">Destination Port (To)</label>
          <div className="relative">
            <Anchor className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              id="arrival-search-input"
              type="text"
              autoComplete="off"
              className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2 pl-9 pr-8 font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-sky shadow-[2px_2px_0px_rgba(15,23,42,1)]"
              placeholder="Search arrival port..."
              value={toSearch}
              onChange={(e) => {
                setToSearch(e.target.value);
                setShowToSuggestions(true);
                if (!e.target.value) onToPortChange(null);
              }}
              onFocus={() => setShowToSuggestions(true)}
            />
            {toSearch && (
              <button
                type="button"
                onClick={() => {
                  setToSearch('');
                  onToPortChange(null);
                  setShowToSuggestions(false);
                }}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center"
                title="Clear arrival"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {showToSuggestions && toSearch && filteredToPorts.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border-2 border-slate-900 rounded-none mt-1 max-h-40 overflow-y-auto shadow-[4px_4px_0px_#1d4ed8]">
              {filteredToPorts.map(port => (
                <li
                  key={`to-port-${port.id}`}
                  className="px-3 py-2 hover:bg-brand-glow/10 cursor-pointer font-mono text-xs text-slate-900 border-b border-slate-200 flex justify-between items-center"
                  onClick={() => {
                    onToPortChange(port);
                    setToSearch(`${port.city} (${port.country})`);
                    setShowToSuggestions(false);
                  }}
                >
                  <div>
                    <span className="text-slate-900 font-bold">{port.city}</span>
                    <span className="text-slate-500 text-[10px] ml-1">({port.country})</span>
                  </div>
                  <span className="text-[10px] text-brand-sky font-bold">{port.type.toUpperCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Informational Hint */}
        <p className="font-mono text-[9px] text-slate-400 text-right">
          *Tip: You can also select ports by clicking them directly on the globe.
        </p>
      </div>

      {/* Intelligence Layer Toggles */}
      <div className="p-4 border-b-3 border-slate-900 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-brand-sky" />
          <h2 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-900">Tactical Layer Overlays</h2>
        </div>

        <div className="space-y-3">
          {/* Weather Toggle */}
          <div className="flex items-center justify-between bg-white border-2 border-slate-900 rounded-none p-2.5 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 border-2 border-slate-900 rounded-none transition-colors ${showWeather ? 'bg-brand-sky text-white' : 'bg-slate-100 text-slate-400'}`}>
                <CloudSun className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-mono text-xs font-extrabold text-slate-900">Marine Weather Layers</span>
                <span className="block font-mono text-[9px] text-slate-500">Storm zones & Gale warnings</span>
              </div>
            </div>
            <button
              id="toggle-weather-layer"
              onClick={() => onToggleWeather(!showWeather)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-none border-2 border-slate-900 transition-colors duration-200 ease-in-out focus:outline-none ${
                showWeather ? 'bg-brand-sky' : 'bg-slate-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-none bg-white border border-slate-900 shadow ring-0 transition duration-200 ease-in-out ${
                showWeather ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Piracy Toggle */}
          <div className="flex items-center justify-between bg-white border-2 border-slate-900 rounded-none p-2.5 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 border-2 border-slate-900 rounded-none transition-colors ${showPiracy ? 'bg-brand-danger text-white' : 'bg-slate-100 text-slate-400'}`}>
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-mono text-xs font-extrabold text-slate-900">Piracy Threat Areas</span>
                <span className="block font-mono text-[9px] text-slate-500">Gulf of Aden, West Africa, etc.</span>
              </div>
            </div>
            <button
              id="toggle-piracy-layer"
              onClick={() => onTogglePiracy(!showPiracy)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-none border-2 border-slate-900 transition-colors duration-200 ease-in-out focus:outline-none ${
                showPiracy ? 'bg-brand-danger' : 'bg-slate-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-none bg-white border border-slate-900 shadow ring-0 transition duration-200 ease-in-out ${
                showPiracy ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Traffic Toggle */}
          <div className="flex items-center justify-between bg-white border-2 border-slate-900 rounded-none p-2.5 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 border-2 border-slate-900 rounded-none transition-colors ${showTraffic ? 'bg-brand-warning text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-mono text-xs font-extrabold text-slate-900">Traffic Density Grid</span>
                <span className="block font-mono text-[9px] text-slate-500">Commercial shipping corridors</span>
              </div>
            </div>
            <button
              id="toggle-traffic-layer"
              onClick={() => onToggleTraffic(!showTraffic)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-none border-2 border-slate-900 transition-colors duration-200 ease-in-out focus:outline-none ${
                showTraffic ? 'bg-brand-warning' : 'bg-slate-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-none bg-white border border-slate-900 shadow ring-0 transition duration-200 ease-in-out ${
                showTraffic ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Generated Route Selections */}
      {selectedFromPort && selectedToPort && generatedRoutes.length > 0 && (
        <div className="p-4 border-b-3 border-slate-900 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-slate-900">Generated Route Options</h2>
            <span className="font-mono text-[9px] bg-brand-success text-white border-2 border-slate-900 px-1.5 py-0.5 rounded-none shadow-[1px_1px_0px_#000] font-bold">3 CORES PLOTTED</span>
          </div>

          <div className="space-y-3">
            {generatedRoutes.map(route => {
              const isSelected = activeRouteId === route.id;
              return (
                <button
                  key={`route-sel-${route.id}`}
                  onClick={() => onActiveRouteSelect(route.id)}
                  className={`w-full flex flex-col p-3 rounded-none font-mono text-left transition-all border-2 border-slate-900 cursor-pointer ${
                    isSelected
                      ? 'bg-white shadow-[4px_4px_0px_#1d4ed8]'
                      : 'bg-slate-50 hover:bg-slate-100 hover:shadow-[2px_2px_0px_#0f172a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-none border border-slate-900 inline-block"
                        style={{ backgroundColor: route.color }}
                      ></span>
                      <span className={`text-xs font-extrabold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {route.name}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-brand-sky">
                      {route.durationDays} Days
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[9px] text-slate-500 mt-1 border-t-2 border-slate-900 pt-1.5">
                    <div>
                      <span>DIST: </span>
                      <span className="font-extrabold text-slate-900">{route.distanceNm.toLocaleString()} NM</span>
                    </div>
                    <div>
                      <span>CO₂: </span>
                      <span className="font-extrabold text-slate-900">{route.co2Tons} T</span>
                    </div>
                    <div>
                      <span>SCORE: </span>
                      <span className={`font-extrabold ${
                        route.overallScore >= 90 ? 'text-brand-success' : route.overallScore >= 75 ? 'text-brand-sky' : 'text-brand-danger'
                      }`}>{route.overallScore}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Carbon Environmental Analysis */}
      <div className="p-4 flex-1 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="h-4 w-4 text-brand-success" />
          <h2 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-900">Carbon & Eco-Audit</h2>
        </div>

        {activeRoute ? (
          (() => {
            const rating = getCarbonRating(activeRoute.co2Tons);
            return (
              <div className="cyber-panel p-3 rounded-none bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 flex items-center justify-center font-mono text-3xl font-extrabold border-2 border-slate-900 rounded-none shadow-[2px_2px_0px_#0f172a] ${rating.color}`}>
                    {rating.grade}
                  </div>
                  <div>
                    <span className="block font-mono text-[9px] uppercase text-slate-500">Environmental Rating</span>
                    <span className="block font-mono text-xs font-extrabold text-slate-900">CII Rating Compliance</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-700 leading-normal border-b-2 border-slate-900 pb-2">
                  {rating.desc}
                </div>

                <div className="space-y-2 font-mono text-xs pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Carbon Output (CO₂):</span>
                    <span className="font-bold text-slate-950">{activeRoute.co2Tons.toLocaleString()} Metric Tons</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Fuel Burn Estimate:</span>
                    <span className="font-bold text-slate-955">{activeRoute.fuelTons.toLocaleString()} Tons MGO</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Eco-Efficiency Score:</span>
                    <span className="font-bold text-brand-success">{activeRoute.metrics.carbonScore}%</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 border-2 border-slate-900 rounded-none font-mono text-[9px] text-slate-600 leading-relaxed">
                  {"// Slow steaming speeds (12-14kts) decrease engine draft friction, reducing total CO₂ volume by ~22% against design-speed profiles."}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="border-2 border-slate-900 border-dashed rounded-none p-4 text-center bg-slate-50">
            <p className="font-mono text-xs text-slate-400">Select departure and destination ports to generate environmental and carbon footprint audit.</p>
          </div>
        )}
      </div>

      {/* Theme & Color Controls */}
      <div className="p-4 border-t-3 border-slate-900 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-brand-glow" />
          <h2 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-900">Theme & Colors</h2>
        </div>

        <div className="cyber-panel p-3 rounded-none bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-3 font-mono text-xs">
          {/* Preset Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Theme Preset</span>
            <select
              value={selectedPresetKey}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="w-full bg-white border-2 border-slate-900 rounded-none px-2 py-1 text-slate-900 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="midnight">Midnight Command (Default)</option>
              <option value="sandSea">Sand & Sea</option>
              <option value="classicLight">Classic Light</option>
              <option value="cyberNeon">Cyber Neon</option>
              <option value="custom">Custom Theme</option>
            </select>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[8px] text-slate-500 uppercase font-bold">Water</span>
              <input
                type="color"
                value={waterColor}
                onChange={(e) => onCustomColorChange('water', e.target.value)}
                className="w-8 h-8 rounded-none border-2 border-slate-900 cursor-pointer p-0 bg-transparent"
                title="Customize Water Color"
              />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[8px] text-slate-500 uppercase font-bold">Land</span>
              <input
                type="color"
                value={landColor}
                onChange={(e) => onCustomColorChange('land', e.target.value)}
                className="w-8 h-8 rounded-none border-2 border-slate-900 cursor-pointer p-0 bg-transparent"
                title="Customize Land Color"
              />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[8px] text-slate-500 uppercase font-bold">Screen Bg</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => onCustomColorChange('bg', e.target.value)}
                className="w-8 h-8 rounded-none border-2 border-slate-900 cursor-pointer p-0 bg-transparent"
                title="Customize Background Color"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Status Panel */}
      <div className="p-4 border-t-3 border-slate-900 bg-slate-50 font-mono">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-900" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Dataset Status
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-none border border-slate-900 ${
              datasetMetrics.status === 'success' 
                ? 'bg-brand-success' 
                : datasetMetrics.status === 'loading'
                  ? 'bg-brand-warning'
                  : 'bg-brand-danger'
            }`}></span>
            <span className={`text-[9px] font-extrabold ${
              datasetMetrics.status === 'success' 
                ? 'text-brand-success' 
                : datasetMetrics.status === 'loading'
                  ? 'text-brand-warning'
                  : 'text-brand-danger'
            }`}>
              {datasetMetrics.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-[10px] text-slate-600">
          <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a]">
            <span>Total Ports:</span>
            <span className="font-bold text-slate-900">
              {datasetMetrics.status === 'success' ? datasetMetrics.totalPorts.toLocaleString() : '---'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a]">
            <span>Total Piracy Incidents:</span>
            <span className="font-bold text-slate-900">
              {datasetMetrics.status === 'success' ? datasetMetrics.totalPiracy.toLocaleString() : '---'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a]">
            <span>Total Lane Features:</span>
            <span className="font-bold text-slate-900">
              {datasetMetrics.status === 'success' ? datasetMetrics.totalLaneFeatures?.toLocaleString() : '---'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a]">
            <span>Total Graph Nodes:</span>
            <span className="font-bold text-slate-900">
              {datasetMetrics.status === 'success' ? datasetMetrics.totalGraphNodes?.toLocaleString() : '---'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a]">
            <span>Total Graph Edges:</span>
            <span className="font-bold text-slate-900">
              {datasetMetrics.status === 'success' ? datasetMetrics.totalGraphEdges?.toLocaleString() : '---'}
            </span>
          </div>
        </div>

        {datasetMetrics.errors.length > 0 && (
          <div className="mt-3 p-2 bg-brand-danger text-white border-2 border-slate-900 rounded-none text-[9px] font-bold shadow-[2px_2px_0px_#000]">
            <div className="font-extrabold uppercase">Ingestion Errors:</div>
            {datasetMetrics.errors.map((err, i) => (
              <div key={i}>▪ {err}</div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
