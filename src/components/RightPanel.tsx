/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Cpu, Terminal, Compass, BarChart3 } from 'lucide-react';
import { RouteOption } from '../data/routes';

interface RightPanelProps {
  generatedRoutes: RouteOption[];
  activeRouteId: string | null;
  isSimulating: boolean;
  simulationIndex: number;
  activeAlertIndex: number;
  shipPosition: { lat: number; lng: number } | null;
}

export default function RightPanel({
  generatedRoutes,
  activeRouteId,
  isSimulating,
  simulationIndex,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activeAlertIndex,
  shipPosition
}: RightPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const lastLoggedIndexRef = useRef<number>(-1);
  const [logs, setLogs] = useState<string[]>([
    'SYSTEM INIT: BLUEROUTE COMMAND v1.0.4',
    'SATELLITE SYNC: INMARSAT-C CONNECTED',
    'THREAT_DB: PIRACY HEATMAPS SYNCHRONIZED',
    'WEATHER_DB: NOAA WAVE WAVEWATCH III REFRESHED',
    'GRID: GLOBAL SHIPPING LANES DETECTED',
    'AWAITING COORDINATE PARAMETERS FROM PLANNER...'
  ]);

  const activeRoute = generatedRoutes.find(r => r.id === activeRouteId);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh AI brief when active route changes
  useEffect(() => {
    if (!activeRoute) {
      setAiReport(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const fromPortName = activeRoute.simulationAlerts[0]?.title.replace('Departure: ', '') || 'Departure Port';
        const toPortName = activeRoute.simulationAlerts[activeRoute.simulationAlerts.length - 1]?.title.replace('Arrival: ', '') || 'Destination Port';
        
        const res = await fetch('/api/brief', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fromName: fromPortName,
            toName: toPortName,
            distance: activeRoute.distanceNm,
            eta: `${activeRoute.durationDays} days`,
            routeType: activeRoute.name,
            fuel: `${activeRoute.fuelTons} tons`,
            carbon: `${activeRoute.co2Tons} tons`,
            weatherRisk: `${activeRoute.metrics.weatherRisk}%`,
            piracyRisk: activeRoute.metrics.piracyRisk,
            trafficDensity: activeRoute.metrics.trafficDensity,
            segments: activeRoute.segmentsCount,
            landCrossings: 0,
            waypoints: activeRoute.waypoints
          }),
          signal: controller.signal
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `HTTP error: ${res.status}`);
        }

        const data = await res.json();
        setAiReport(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("AI Briefing fetch error:", err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
    return () => {
      controller.abort();
    };
  }, [activeRouteId, generatedRoutes, activeRoute]);

  // Determine best route based on scores
  const recommendedRoute = generatedRoutes.reduce<RouteOption | null>((best, current) => {
    if (!best) return current;
    return current.overallScore > best.overallScore ? current : best;
  }, null);

  // Reset last logged index when route changes or simulation starts/stops
  useEffect(() => {
    lastLoggedIndexRef.current = -1;
  }, [activeRouteId, isSimulating]);

  // Auto-scroll command log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Push new log logs dynamically during simulation
  useEffect(() => {
    if (!activeRoute) return;

    if (isSimulating) {
      if (simulationIndex === lastLoggedIndexRef.current) return;
      lastLoggedIndexRef.current = simulationIndex;

      const currentAlert = activeRoute.simulationAlerts.find(
        alert => alert.checkpointIndex === simulationIndex
      );

      const timestamp = new Date().toLocaleTimeString();
      const positionStr = shipPosition 
        ? `[LAT:${shipPosition.lat.toFixed(4)} LNG:${shipPosition.lng.toFixed(4)}]` 
        : '';

      const logPrefix = `[${timestamp}] TELEMETRY ${positionStr}:`;

      if (currentAlert) {
        setLogs(prev => [
          ...prev,
          `${logPrefix} Vessel entered checkpoint: "${currentAlert.title}"`,
          `${logPrefix} STATUS: Risk Level ${currentAlert.riskStatus.toUpperCase()} | Weather ${currentAlert.weatherStatus.toUpperCase()}`,
          `${logPrefix} LOG DETAIL: "${currentAlert.description}"`
        ]);
      } else if (simulationIndex > 0) {
        setLogs(prev => [
          ...prev,
          `${logPrefix} Vessel heading towards next waypoint. Engine draft normal. Speed 14.5 kts.`
        ]);
      }
    }
  }, [isSimulating, simulationIndex, activeRoute, shipPosition]);

  // Log initial route generation
  useEffect(() => {
    if (generatedRoutes.length > 0) {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [
        ...prev,
        `[${timestamp}] NAV_SYS: 3 alternative routes computed successfully.`,
        `[${timestamp}] AI_OFFICER: Recommended course established as "${recommendedRoute?.name}".`,
        `[${timestamp}] ANALYTICS: Comparative score analysis populated.`
      ]);
    }
  }, [generatedRoutes, recommendedRoute]);

  // Log detailed AI briefing reports when activeRoute changes
  useEffect(() => {
    if (activeRoute && activeRoute.aiBrief) {
      const timestamp = new Date().toLocaleTimeString();
      const brief = activeRoute.aiBrief;
      setLogs(prev => [
        ...prev,
        `[${timestamp}] AI_OFFICER: Initializing AI Maritime Briefing for ${activeRoute.name.toUpperCase()}...`,
        `[${timestamp}] AI_OFFICER: --- VOYAGE SUMMARY ---`,
        `[${timestamp}] AI_OFFICER: ${brief.summary}`,
        `[${timestamp}] AI_OFFICER: --- VOYAGE BRIEFING ---`,
        `[${timestamp}] AI_OFFICER: ${brief.briefing}`,
        `[${timestamp}] AI_OFFICER: --- METEO INTERPRETATION ---`,
        `[${timestamp}] AI_OFFICER: ${brief.weather}`,
        `[${timestamp}] AI_OFFICER: --- RISK EVALUATION ---`,
        `[${timestamp}] AI_OFFICER: ${brief.risks}`,
        `[${timestamp}] AI_OFFICER: --- FUEL OPTIMIZATION ---`,
        `[${timestamp}] AI_OFFICER: ${brief.fuel}`,
        `[${timestamp}] AI_OFFICER: --- CII Compliant ECO-AUDIT ---`,
        `[${timestamp}] AI_OFFICER: ${brief.carbon}`,
        `[${timestamp}] AI_OFFICER: --- ALTERNATE ROUTE EXPLANATION ---`,
        `[${timestamp}] AI_OFFICER: ${brief.alternate}`
      ]);
    }
  }, [activeRouteId, activeRoute]);

  // Helper metric renderers for progress bar fill colors
  const getProgressColor = (score: number, inverse = false) => {
    if (inverse) {
      if (score < 20) return 'bg-brand-success';
      if (score < 50) return 'bg-brand-warning';
      return 'bg-brand-danger';
    } else {
      if (score >= 90) return 'bg-brand-success';
      if (score >= 70) return 'bg-brand-sky';
      return 'bg-brand-danger';
    }
  };

  return (
    <aside className="w-96 flex flex-col h-full bg-brand-bg-dark border-l-3 border-slate-900 overflow-y-auto" id="right-sidebar-panel">
      {/* AI Recommendation Panel */}
      <div className="p-4 border-b-3 border-slate-900 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="h-4.5 w-4.5 text-brand-sky" />
          <h2 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-900">AI Route Intel Briefing</h2>
        </div>

        {loading ? (
          <div className="border-2 border-dashed border-slate-900 rounded-none p-4 text-center bg-slate-50">
            <div className="flex justify-center mb-2">
              <Compass className="h-8 w-8 text-brand-sky animate-spin" />
            </div>
            <p className="font-mono text-xs text-brand-sky animate-pulse uppercase tracking-wider">Generating ASI:One Intel Briefing...</p>
          </div>
        ) : error ? (
          <div className="border-2 border-red-500 rounded-none p-4 bg-red-50 text-red-700 font-mono text-xs space-y-2">
            <div className="font-bold uppercase">ASI:One API Error:</div>
            <div className="break-all">{error}</div>
          </div>
        ) : aiReport && activeRoute ? (
          <div className="cyber-panel p-3.5 rounded-none border-2 border-slate-900 bg-white shadow-[3px_3px_0px_#0f172a] space-y-3 max-h-[360px] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="block font-mono text-[9px] uppercase text-slate-500">Selected Route Option</span>
                <span className="block font-mono text-sm font-extrabold text-brand-sky tracking-tight">
                  {activeRoute.name}
                </span>
              </div>
              <div className="text-right">
                <span className="block font-mono text-[9px] uppercase text-slate-500">Success Index</span>
                <span className="block font-mono text-lg font-black text-brand-success">
                  {activeRoute.overallScore}%
                </span>
              </div>
            </div>

            <div className="border-t-2 border-slate-900 pt-3 space-y-2.5 font-mono text-[10px] text-slate-800 leading-relaxed">
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Executive Summary</span>
                <p className="mt-0.5 text-slate-700">{aiReport.executiveSummary}</p>
              </div>
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Route Recommendation</span>
                <p className="mt-0.5 text-slate-700">{aiReport.routeRecommendation}</p>
              </div>
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Weather Analysis</span>
                <p className="mt-0.5 text-slate-700">{aiReport.weatherAnalysis}</p>
              </div>
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Piracy Assessment</span>
                <p className="mt-0.5 text-slate-700">{aiReport.piracyAssessment}</p>
              </div>
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Traffic Assessment</span>
                <p className="mt-0.5 text-slate-700">{aiReport.trafficAssessment}</p>
              </div>
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Fuel Optimization Advice</span>
                <p className="mt-0.5 text-slate-700">{aiReport.fuelOptimizationAdvice}</p>
              </div>
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Carbon Reduction Advice</span>
                <p className="mt-0.5 text-slate-700">{aiReport.carbonReductionAdvice}</p>
              </div>
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Operational Risks</span>
                <p className="mt-0.5 text-slate-700">{aiReport.operationalRisks}</p>
              </div>
              <div>
                <span className="block font-extrabold text-brand-sky uppercase text-[9px]">▪ Final Recommendation</span>
                <p className="mt-0.5 text-slate-900 font-bold">{aiReport.finalRecommendation}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-900 rounded-none p-4 text-center bg-slate-50">
            <div className="flex justify-center mb-2">
              <Compass className="h-8 w-8 text-slate-300 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <p className="font-mono text-xs text-slate-400">Select route parameters to initiate maritime route intelligence evaluation.</p>
          </div>
        )}
      </div>

      {/* Detailed Score Analysis */}
      <div className="p-4 border-b-3 border-slate-900 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4.5 w-4.5 text-brand-sky" />
          <h2 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-900">Course Score Matrix</h2>
        </div>

        {activeRoute ? (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-900 font-extrabold uppercase">{activeRoute.name}</span>
              <span className="text-brand-sky font-bold text-[10px]">{activeRoute.distanceNm} NM</span>
            </div>

            {/* Weather Risk */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 font-bold">Weather Risk Factor:</span>
                <span className={`font-bold ${activeRoute.metrics.weatherRisk > 40 ? 'text-brand-danger' : activeRoute.metrics.weatherRisk > 20 ? 'text-brand-warning' : 'text-brand-success'}`}>
                  {activeRoute.metrics.weatherRisk}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 border-2 border-slate-900 rounded-none overflow-hidden">
                <div
                  className={`h-full rounded-none border-r border-slate-900 ${getProgressColor(activeRoute.metrics.weatherRisk, true)}`}
                  style={{ width: `${activeRoute.metrics.weatherRisk}%` }}
                ></div>
              </div>
            </div>

            {/* Piracy Risk */}
            <div className="flex justify-between items-center bg-white p-2.5 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-none">
              <span className="text-slate-500 font-bold">Piracy Threat Rating:</span>
              <span className={`font-bold px-1.5 py-0.5 border-2 border-slate-900 shadow-[1px_1px_0px_#000] text-[9px] ${
                activeRoute.metrics.piracyRisk === 'High' 
                  ? 'bg-brand-danger text-white' 
                  : activeRoute.metrics.piracyRisk === 'Medium'
                    ? 'bg-brand-warning text-white'
                    : 'bg-brand-success text-white'
              }`}>
                {activeRoute.metrics.piracyRisk.toUpperCase()} RISK
              </span>
            </div>

            {/* Traffic Density */}
            <div className="flex justify-between items-center bg-white p-2.5 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-none">
              <span className="text-slate-500 font-bold">Lane Congestion Index:</span>
              <span className={`font-bold px-1.5 py-0.5 border-2 border-slate-900 shadow-[1px_1px_0px_#000] text-[9px] ${
                activeRoute.metrics.trafficDensity === 'High' 
                  ? 'bg-brand-danger text-white' 
                  : activeRoute.metrics.trafficDensity === 'Medium'
                    ? 'bg-brand-warning text-white'
                    : 'bg-brand-success text-white'
              }`}>
                {activeRoute.metrics.trafficDensity.toUpperCase()} DENSITY
              </span>
            </div>

            {/* Fuel Efficiency */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 font-bold">Fuel Efficiency Rating:</span>
                <span className="font-bold text-brand-success">{activeRoute.metrics.fuelEfficiency}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 border-2 border-slate-900 rounded-none overflow-hidden">
                <div
                  className={`h-full rounded-none border-r border-slate-900 ${getProgressColor(activeRoute.metrics.fuelEfficiency)}`}
                  style={{ width: `${activeRoute.metrics.fuelEfficiency}%` }}
                ></div>
              </div>
            </div>

            {/* Environmental Carbon Score */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 font-bold">Carbon Rating Index:</span>
                <span className="font-bold text-brand-success">{activeRoute.metrics.carbonScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 border-2 border-slate-900 rounded-none overflow-hidden">
                <div
                  className={`h-full rounded-none border-r border-slate-900 ${getProgressColor(activeRoute.metrics.carbonScore)}`}
                  style={{ width: `${activeRoute.metrics.carbonScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-900 rounded-none p-4 text-center bg-slate-50">
            <p className="font-mono text-xs text-slate-400">Select route parameters to view risk metrics breakdown.</p>
          </div>
        )}
      </div>

      {/* Route Validation Log */}
      <div className="p-4 border-b-3 border-slate-900 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4.5 w-4.5 text-brand-sky" />
          <h2 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-900">Route Validation Log</h2>
        </div>

        {activeRoute ? (
          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a] rounded-none">
              <span className="text-slate-500 font-bold">Nodes Traversed:</span>
              <span className="font-extrabold text-slate-900">{activeRoute.waypoints.length}</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a] rounded-none">
              <span className="text-slate-500 font-bold">Edges Traversed:</span>
              <span className="font-extrabold text-slate-900">{activeRoute.segmentsCount}</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a] rounded-none">
              <span className="text-slate-500 font-bold">Land Crossings:</span>
              <span className="font-bold px-1.5 py-0.5 border-2 border-slate-900 shadow-[1px_1px_0px_#000] text-[9px] bg-brand-success text-white">
                0 (VERIFIED)
              </span>
            </div>
            <div className="flex justify-between items-center bg-white p-2 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a] rounded-none">
              <span className="text-slate-500 font-bold">Route Length:</span>
              <span className="font-extrabold text-brand-success">{activeRoute.distanceNm.toLocaleString()} NM</span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-900 rounded-none p-4 text-center bg-slate-50">
            <p className="font-mono text-xs text-slate-400">Select route parameters to view validation logs.</p>
          </div>
        )}
      </div>

      {/* Terminal Live Operations Feed */}
      <div className="flex-1 p-4 flex flex-col min-h-[220px] bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-slate-900" />
            <h2 className="font-mono text-sm font-extrabold uppercase tracking-wider text-slate-900">Ops Center Command Log</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-brand-success border border-slate-900"></span>
            <span className="font-mono text-[9px] text-brand-success uppercase font-bold">ONLINE</span>
          </div>
        </div>

        <div
          ref={logContainerRef}
          className="flex-1 w-full bg-white border-2 border-slate-900 rounded-none p-3 font-mono text-[10px] text-slate-900 overflow-y-auto space-y-2 select-text shadow-[2px_2px_0px_#0f172a]"
          style={{ maxHeight: 'calc(100vh - 580px)' }}
        >
          {logs.map((log, index) => (
            <div key={`log-${index}`} className="border-b border-slate-200 pb-1 leading-normal">
              <span className="text-brand-sky font-extrabold">&gt;</span> {log}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
