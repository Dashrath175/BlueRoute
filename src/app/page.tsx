/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import TopNav from '../components/TopNav';
import LeftPanel from '../components/LeftPanel';
import RightPanel from '../components/RightPanel';
import MaritimeGlobe from '../components/MaritimeGlobe';
import StatusBar from '../components/StatusBar';
import { ports, Port } from '../data/ports';
import { RouteOption, getRouteOptions } from '../data/routes';
import { loadAllDatasets, DatasetMetrics } from '../data/datasetLoader';


export interface ThemePreset {
  name: string;
  waterColor: string;
  landColor: string;
  bgColor: string;
  panelBgColor: string;
  panelBorderColor: string;
  textMainColor: string;
  textMutedColor: string;
  shadowColor: string;
  globeTextColor: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  midnight: {
    name: 'Midnight Command',
    waterColor: '#0b1626',      // Dark slate blue ocean
    landColor: '#334155',       // Slate-700 land
    bgColor: '#070a13',         // Slate-950 deep background
    panelBgColor: '#0f172a',    // Slate-900 panels
    panelBorderColor: '#1e293b',// Slate-800 borders
    textMainColor: '#f8fafc',   // Slate-50 bright text
    textMutedColor: '#94a3b8',  // Slate-400 muted text
    shadowColor: '#020617',     // Slate-950 shadows
    globeTextColor: '#f8fafc',  // White label text for dark land
  },
  sandSea: {
    name: 'Sand & Sea',
    waterColor: '#bae6fd',      // Light sky blue ocean (matches brand)
    landColor: '#fef3c7',       // Soft sandy-beige land
    bgColor: '#0f172a',         // Dark slate background (easy on eyes)
    panelBgColor: '#1e293b',    // Slate-800 panels
    panelBorderColor: '#334155',// Slate-700 borders
    textMainColor: '#f8fafc',   // Slate-50 bright text
    textMutedColor: '#cbd5e1',  // Slate-300 muted text
    shadowColor: '#0f172a',     // Dark slate shadows
    globeTextColor: '#0f172a',  // Dark label text for light sand land
  },
  classicLight: {
    name: 'Classic Light',
    waterColor: '#e0f2fe',      // Very light sky blue
    landColor: '#e4e4e7',       // Light zinc grey land
    bgColor: '#ffffff',         // Pure white background
    panelBgColor: '#ffffff',    // Pure white panels
    panelBorderColor: '#0f172a',// Thick dark border
    textMainColor: '#0f172a',   // Dark slate text
    textMutedColor: '#475569',  // Slate-600 text
    shadowColor: '#0f172a',     // Bold black shadows
    globeTextColor: '#0f172a',  // Dark label text
  },
  cyberNeon: {
    name: 'Cyber Neon',
    waterColor: '#022c22',      // Deep emerald ocean
    landColor: '#064e3b',       // Emerald-900 land
    bgColor: '#020617',         // Pure black background
    panelBgColor: '#020617',    // Pure black cards
    panelBorderColor: '#10b981',// Bright emerald borders
    textMainColor: '#10b981',   // Neon green text
    textMutedColor: '#047857',  // Muted green text
    shadowColor: '#064e3b',     // Deep green shadow
    globeTextColor: '#10b981',  // Green labels
  }
};

export default function CommandCenterPage() {
  // Navigation State
  const [selectedFromPort, setSelectedFromPort] = useState<Port | null>(null);
  const [selectedToPort, setSelectedToPort] = useState<Port | null>(null);
  const [generatedRoutes, setGeneratedRoutes] = useState<RouteOption[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [liveShips, setLiveShips] = useState<any[]>([]);

  // Theme Settings state (Default to easy-on-the-eyes Midnight Command dark mode)
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('midnight');
  const [waterColor, setWaterColor] = useState(THEME_PRESETS.midnight.waterColor);
  const [landColor, setLandColor] = useState(THEME_PRESETS.midnight.landColor);
  const [bgColor, setBgColor] = useState(THEME_PRESETS.midnight.bgColor);
  const [panelBgColor, setPanelBgColor] = useState(THEME_PRESETS.midnight.panelBgColor);
  const [panelBorderColor, setPanelBorderColor] = useState(THEME_PRESETS.midnight.panelBorderColor);
  const [textMainColor, setTextMainColor] = useState(THEME_PRESETS.midnight.textMainColor);
  const [textMutedColor, setTextMutedColor] = useState(THEME_PRESETS.midnight.textMutedColor);
  const [shadowColor, setShadowColor] = useState(THEME_PRESETS.midnight.shadowColor);
  const [globeTextColor, setGlobeTextColor] = useState(THEME_PRESETS.midnight.globeTextColor);

  // Sync theme changes with DOM custom variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--background', bgColor);
    root.style.setProperty('--panel-bg', panelBgColor);
    root.style.setProperty('--panel-border', panelBorderColor);
    root.style.setProperty('--text-main', textMainColor);
    root.style.setProperty('--text-muted', textMutedColor);
    root.style.setProperty('--shadow-color', shadowColor);

    // Set panel hover states dynamically based on dark/light
    const isDark = selectedPresetKey !== 'classicLight';
    root.style.setProperty('--panel-bg-hover', isDark ? '#1f2937' : '#f8fafc');
    root.style.setProperty('--text-muted-more', isDark ? '#94a3b8' : '#64748b');
  }, [bgColor, panelBgColor, panelBorderColor, textMainColor, textMutedColor, shadowColor, selectedPresetKey]);

  // Handle Preset updates
  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    if (key === 'custom') return;
    const preset = THEME_PRESETS[key];
    if (preset) {
      setWaterColor(preset.waterColor);
      setLandColor(preset.landColor);
      setBgColor(preset.bgColor);
      setPanelBgColor(preset.panelBgColor);
      setPanelBorderColor(preset.panelBorderColor);
      setTextMainColor(preset.textMainColor);
      setTextMutedColor(preset.textMutedColor);
      setShadowColor(preset.shadowColor);
      setGlobeTextColor(preset.globeTextColor);
    }
  };

  // Handle Custom color picker updates
  const handleCustomColorChange = (type: 'water' | 'land' | 'bg', value: string) => {
    setSelectedPresetKey('custom');
    if (type === 'water') {
      setWaterColor(value);
    } else if (type === 'land') {
      setLandColor(value);
      // Auto-detect land brightness for legible country labels
      const hex = value.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      setGlobeTextColor(brightness < 128 ? '#f8fafc' : '#0f172a');
    } else if (type === 'bg') {
      setBgColor(value);
      // Auto-detect light/dark contrast to keep side panels readable
      const hex = value.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      if (brightness < 128) {
        // Dark custom panels
        setPanelBgColor('#111827');
        setPanelBorderColor('#334155');
        setTextMainColor('#f8fafc');
        setTextMutedColor('#d1d5db');
        setShadowColor('#030712');
      } else {
        // Light custom panels
        setPanelBgColor('#ffffff');
        setPanelBorderColor('#0f172a');
        setTextMainColor('#0f172a');
        setTextMutedColor('#475569');
        setShadowColor('#0f172a');
      }
    }
  };

  // Poll live AIS ships
  useEffect(() => {
    let active = true;
    const fetchAis = () => {
      fetch('/api/ais')
        .then(res => res.json())
        .then(data => {
          if (active) {
            setLiveShips(data);
          }
        })
        .catch(err => console.error('Error fetching live AIS ships:', err));
    };

    fetchAis();
    const interval = setInterval(fetchAis, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Overlay Layer States (Weather enabled by default for high visual impact)
  const [showWeather, setShowWeather] = useState(true);
  const [showPiracy, setShowPiracy] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);

  // Voyage Simulation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 5x speed
  const [shipPosition, setShipPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [activeAlertIndex, setActiveAlertIndex] = useState(-1);

  // Real-time Telemetry Loading States
  const [routeLoading, setRouteLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);



  // Dataset Status State
  const [datasetMetrics, setDatasetMetrics] = useState<DatasetMetrics>({
    totalPorts: 0,
    totalPiracy: 0,
    totalLanes: 0,
    totalLaneFeatures: 0,
    totalGraphNodes: 0,
    totalGraphEdges: 0,
    status: 'loading',
    errors: []
  });

  // Load datasets on mount
  useEffect(() => {
    let active = true;
    loadAllDatasets().then(metrics => {
      if (active) {
        setDatasetMetrics(metrics);
      }
    });
    return () => {
      active = false;
    };
  }, []);


  // Compute routes when ports are selected
  useEffect(() => {
    let active = true;
    if (selectedFromPort && selectedToPort) {
      setDatasetMetrics(prev => ({ ...prev, status: 'loading' }));
      setRouteLoading(true);
      setLoadingProgress(0);
      setLoadingLogs([
        'INITIALIZING TELEMETRY TRANSLATION CORRIDORS...',
        'CONNECTING GRAPH DATABASES...'
      ]);

      // Simulate a premium telemetry scanner loading bar (3.5s minimum)
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 98) {
            clearInterval(progressInterval);
            return 98;
          }
          const increment = Math.floor(Math.random() * 12) + 6;
          const next = Math.min(98, prev + increment);

          const logTemplates = [
            'RETRIEVING LIVE NOAA MARINE WEATHER TELEMETRY...',
            'PARSING HISTORICAL PIRACY ATTACK MATRIX FOR COORDS...',
            'EVALUATING SEA LANE CONGESTION DENSITY RATIOS...',
            'GENERATING DIJKSTRA / A-STAR OPTIMAL TRANSIT PATHWAYS...',
            'VALIDATING WATER CORRIDOR SEGMENTS AGAINST LAND BOUNDARIES...',
            'CALCULATING FUEL BURN PROFILE FOR FAST/SLOW STEAMING...',
            'ESTIMATING CO2 COMPLIANCE INDEX FOR IMO REGULATIONS...'
          ];

          if (next > prev && Math.random() > 0.4) {
            const randomLog = logTemplates[Math.floor(Math.random() * logTemplates.length)];
            setLoadingLogs(l => [...l, randomLog]);
          }
          return next;
        });
      }, 250);

      let fetchDone = false;
      let fetchedRoutes: any[] = [];
      let fetchError: any = null;

      fetch(`/api/routes?from=${selectedFromPort.id}&to=${selectedToPort.id}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
          return res.json();
        })
        .then(routes => {
          fetchDone = true;
          fetchedRoutes = routes;
          checkIfFinished();
        })
        .catch(err => {
          fetchDone = true;
          fetchError = err;
          checkIfFinished();
        });

      const startTime = Date.now();
      const minimumDelay = 3500; // minimum 3.5 seconds loading experience

      const checkIfFinished = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minimumDelay - elapsed);

        setTimeout(() => {
          if (!active) return;
          clearInterval(progressInterval);
          setLoadingProgress(100);
          setLoadingLogs(l => [...l, 'VOYAGE TELEMETRY SYNC COMPLETE. RENDERING DATA...']);

          setTimeout(() => {
            if (!active) return;
            setRouteLoading(false);
            if (fetchError) {
              console.error("Error computing routes:", fetchError);
              setDatasetMetrics(prev => ({
                ...prev,
                status: 'error',
                errors: [...prev.errors, `Routing: ${fetchError.message}`]
              }));
            } else {
              setGeneratedRoutes(fetchedRoutes);
              const balanced = fetchedRoutes.find((r: any) => r.name === 'Balanced Route');
              if (fetchedRoutes.length > 0) {
                setActiveRouteId(balanced ? balanced.id : fetchedRoutes[0].id);
              } else {
                setActiveRouteId(null);
              }
              setDatasetMetrics(prev => ({ ...prev, status: 'success' }));
            }
          }, 450);
        }, remaining);
      };

      abortSimulation();

      return () => {
        clearInterval(progressInterval);
      };
    } else {
      setGeneratedRoutes([]);
      setActiveRouteId(null);
      abortSimulation();
    }
    return () => {
      active = false;
    };
  }, [selectedFromPort, selectedToPort]);

  const activeRoute = generatedRoutes.find(r => r.id === activeRouteId) || null;

  // Set initial ship position when route changes or simulation index updates
  useEffect(() => {
    if (isSimulating) return; // Let WebGL spline interpolation update shipPosition smoothly during playback
    if (activeRoute && activeRoute.waypoints.length > 0) {
      setShipPosition(activeRoute.waypoints[simulationIndex]);
    } else {
      setShipPosition(null);
    }
  }, [activeRoute, simulationIndex, isSimulating]);

  // Handle map label/port clicks
  const handleMapSelectPort = (port: Port) => {
    // If not simulating, user can select ports (only cargo hubs)
    if (isSimulating || port.type !== 'hub') return;

    if (!selectedFromPort) {
      setSelectedFromPort(port);
    } else if (!selectedToPort && port.id !== selectedFromPort.id) {
      setSelectedToPort(port);
    } else {
      // Toggle / Reset selection
      setSelectedFromPort(port);
      setSelectedToPort(null);
    }
  };

  // Start Simulation
  const startSimulation = () => {
    if (!activeRoute) return;
    if (simulationIndex >= activeRoute.waypoints.length - 1) {
      setSimulationIndex(0);
    }
    setIsSimulating(true);
  };

  // Pause Simulation
  const pauseSimulation = () => {
    setIsSimulating(false);
  };

  // Stop / Abort Simulation
  function abortSimulation() {
    setIsSimulating(false);
    setSimulationIndex(0);
    setShipPosition(null);
    setActiveAlertIndex(-1);
  }

  return (
    <div 
      style={{ backgroundColor: bgColor }}
      className="h-screen w-screen flex flex-col overflow-hidden text-brand-text select-none"
    >
      
      {/* 1. Header Navigation */}
      <TopNav selectedFromPort={selectedFromPort} selectedToPort={selectedToPort} />

      {/* 2. Operations Command Hub */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side Control Panel */}
        <LeftPanel
          ports={ports}
          selectedFromPort={selectedFromPort}
          selectedToPort={selectedToPort}
          generatedRoutes={generatedRoutes}
          activeRouteId={activeRouteId}
          showWeather={showWeather}
          showPiracy={showPiracy}
          showTraffic={showTraffic}
          onFromPortChange={setSelectedFromPort}
          onToPortChange={setSelectedToPort}
          onActiveRouteSelect={setActiveRouteId}
          onToggleWeather={setShowWeather}
          onTogglePiracy={setShowPiracy}
          onToggleTraffic={setShowTraffic}
          datasetMetrics={datasetMetrics}
          
          // Theme Props
          selectedPresetKey={selectedPresetKey}
          onSelectPreset={handleSelectPreset}
          waterColor={waterColor}
          landColor={landColor}
          bgColor={bgColor}
          onCustomColorChange={handleCustomColorChange}
        />

        {/* Central 3D Globe Visualizer */}
        <main 
          style={{ backgroundColor: bgColor }}
          className="flex-1 h-full relative flex items-center justify-center"
        >
          <MaritimeGlobe
            ports={ports}
            selectedFromPort={selectedFromPort}
            selectedToPort={selectedToPort}
            generatedRoutes={generatedRoutes}
            activeRouteId={activeRouteId}
            showWeather={showWeather}
            showPiracy={showPiracy}
            showTraffic={showTraffic}
            isSimulating={isSimulating}
            shipPosition={shipPosition}
            onPortSelect={handleMapSelectPort}
            simulationIndex={simulationIndex}
            setSimulationIndex={setSimulationIndex}
            setShipPosition={setShipPosition}
            setIsSimulating={setIsSimulating}
            simSpeed={simSpeed}
            liveShips={liveShips}

            // Theme Props
            waterColor={waterColor}
            landColor={landColor}
            textColor={globeTextColor}
            bgColor={bgColor}
            selectedPresetKey={selectedPresetKey}
          />
        </main>

        {/* Right Side Intelligence Panel */}
        <RightPanel
          generatedRoutes={generatedRoutes}
          activeRouteId={activeRouteId}
          isSimulating={isSimulating}
          simulationIndex={simulationIndex}
          activeAlertIndex={activeAlertIndex}
          shipPosition={shipPosition}
        />
        
      </div>

      {/* 3. Bottom Operations Telemetry Status Bar */}
      <StatusBar
        activeRoute={activeRoute}
        isSimulating={isSimulating}
        simulationIndex={simulationIndex}
        simSpeed={simSpeed}
        onStartSimulation={startSimulation}
        onPauseSimulation={pauseSimulation}
        onStopSimulation={abortSimulation}
        onChangeSimSpeed={setSimSpeed}
      />

      {/* Real-time Telemetry Loading Screen Overlay */}
      {routeLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center font-mono" style={{ zIndex: 99999 }}>
          <div className="w-[900px] border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_var(--shadow-color)] flex flex-col gap-4 text-slate-900 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Radar sweep background grid effect */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

            <div className="flex gap-6 relative z-10">
              {/* Left Column: Sci-Fi Radar Visualizer (Enlarged) */}
              <div className="w-72 flex flex-col items-center justify-between border-r-3 border-slate-900 pr-6 gap-4 shrink-0">
                {/* Radar Title */}
                <div className="w-full text-center border-b-2 border-slate-900 pb-1.5">
                  <span className="font-extrabold text-[10px] uppercase tracking-widest text-slate-900">RADAR VISUALIZER</span>
                </div>

                {/* Radar Circular Display (Enlarged) */}
                <div className="relative w-60 h-60 rounded-full border-3 border-slate-900 overflow-hidden bg-slate-950 flex items-center justify-center shadow-[4px_4px_0px_rgba(15,23,42,0.15)]">
                  {/* Concentric rings */}
                  <div className="absolute w-[80%] h-[80%] rounded-full border border-emerald-500/20"></div>
                  <div className="absolute w-[60%] h-[60%] rounded-full border border-emerald-500/15"></div>
                  <div className="absolute w-[40%] h-[40%] rounded-full border border-emerald-500/10"></div>
                  <div className="absolute w-[20%] h-[20%] rounded-full border border-emerald-500/5"></div>
                  
                  {/* Crosshairs */}
                  <div className="absolute top-0 bottom-0 w-[1px] bg-emerald-500/15"></div>
                  <div className="absolute left-0 right-0 h-[1px] bg-emerald-500/15"></div>
                  
                  {/* Rotating sweep line */}
                  <div className="absolute w-full h-full animate-spin origin-center bg-[conic-gradient(from_0deg,transparent_50%,rgba(16,185,129,0.35)_100%)] pointer-events-none rounded-full" style={{ animationDuration: '3s' }}></div>
                  
                  {/* Scanning blips */}
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-brand-sky animate-ping" style={{ top: '25%', left: '40%', animationDelay: '0.4s' }}></div>
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-brand-success animate-pulse" style={{ top: '65%', left: '70%', animationDelay: '1.2s' }}></div>
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-brand-danger animate-pulse" style={{ top: '45%', left: '20%', animationDelay: '2.1s' }}></div>

                  {/* Center core */}
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 z-10 shadow-[0_0_6px_rgba(16,185,129,1)]"></div>
                </div>

                {/* Telemetry data info */}
                <div className="w-full bg-slate-50 border-2 border-slate-900 p-2.5 font-mono text-[9px] text-slate-600 space-y-1 shadow-[2px_2px_0px_rgba(15,23,42,0.15)]">
                  <div className="flex justify-between">
                    <span className="font-bold">GRID_STATUS:</span>
                    <span className="text-brand-success font-extrabold">ONLINE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">SAT_DOWNLINK:</span>
                    <span className="text-slate-950 font-bold">15.4 GB/S</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">SCAN_COORD:</span>
                    <span className="text-brand-sky font-bold">L{Math.round(loadingProgress * 1.8)}._N{(loadingProgress * 2.3).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Loading Logs & Progress Bar */}
              <div className="flex-1 flex flex-col gap-4 justify-between">
                {/* Header */}
                <div className="flex items-center justify-between border-b-3 border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-brand-sky border border-slate-900 animate-ping"></div>
                    <h3 className="font-extrabold uppercase tracking-widest text-sm text-slate-900">
                      REAL-TIME TELEMETRY SCANNER
                    </h3>
                  </div>
                  <span className="text-[10px] bg-slate-900 text-white font-bold px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
                    V{loadingProgress}%
                  </span>
                </div>

                {/* Status logs */}
                <div className="h-52 border-2 border-slate-900 bg-slate-50 p-3 overflow-y-auto space-y-1.5 text-[9.5px] text-slate-800 leading-normal flex flex-col-reverse justify-end shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]">
                  {[...loadingLogs].reverse().map((log, index) => (
                    <div key={`load-log-${index}`} className="flex items-start gap-1.5">
                      <span className="text-brand-sky font-extrabold">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-6 border-3 border-slate-900 rounded-none overflow-hidden relative shadow-[2px_2px_0px_rgba(15,23,42,0.15)]">
                  <div 
                    className="h-full bg-brand-sky border-r-3 border-slate-900 transition-all duration-200"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center font-extrabold text-[9px] uppercase tracking-wide text-white mix-blend-difference">
                    PROCESSING NAVIGATIONAL GRAPH COORDS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
