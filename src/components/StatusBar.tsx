'use client';

import React from 'react';
import { Play, Pause, Square, AlertCircle, Fuel, Compass, ShieldAlert, CloudRain, Clock, Navigation } from 'lucide-react';
import { RouteOption } from '../data/routes';

interface StatusBarProps {
  activeRoute: RouteOption | null;
  isSimulating: boolean;
  simulationIndex: number;
  simSpeed: number;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onStopSimulation: () => void;
  onChangeSimSpeed: (speed: number) => void;
}

export default function StatusBar({
  activeRoute,
  isSimulating,
  simulationIndex,
  simSpeed,
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  onChangeSimSpeed
}: StatusBarProps) {
  if (!activeRoute) {
    return (
      <div className="bg-slate-50 border-t-3 border-slate-900 p-4 text-center font-mono text-xs text-slate-500">
        // VOYAGE TELEMETRY STATUS: DEACTIVATED. DEFINE ROUTE PARAMETERS TO INITIALIZE TELEMETRY CHANNEL.
      </div>
    );
  }

  // Calculate telemetry values based on simulationIndex
  const totalWaypoints = activeRoute.waypoints.length;
  const progressPercent = Math.min(100, Math.round((simulationIndex / (totalWaypoints - 1)) * 100));
  
  // Dynamic metrics scaling based on progress
  const distanceTravelled = Math.round(activeRoute.distanceNm * (simulationIndex / (totalWaypoints - 1)));
  const distanceRemaining = activeRoute.distanceNm - distanceTravelled;
  
  const fuelConsumed = Math.round(activeRoute.fuelTons * (simulationIndex / (totalWaypoints - 1)));
  const co2Emitted = Math.round(activeRoute.co2Tons * (simulationIndex / (totalWaypoints - 1)));
  
  const timeRemainingDays = Math.round((activeRoute.durationDays * (1 - simulationIndex / (totalWaypoints - 1))) * 10) / 10;

  // Active Alert at current index (searched from last to first to get the most recent alert)
  const activeAlert = [...activeRoute.simulationAlerts].reverse().find(
    alert => alert.checkpointIndex <= simulationIndex
  ) || activeRoute.simulationAlerts[0];

  const currentZoneName = activeAlert ? activeAlert.title : 'Open Ocean';
  const riskStatus = activeAlert ? activeAlert.riskStatus : 'normal';
  const weatherStatus = activeAlert ? activeAlert.weatherStatus : 'stable';

  return (
    <div className="bg-white border-t-3 border-slate-900 relative" id="telemetry-status-bar">
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls Section */}
        <div className="lg:col-span-3 flex flex-col justify-center border-r-2 border-slate-900 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="h-4 w-4 text-brand-sky" />
            <span className="font-mono text-xs font-extrabold uppercase text-slate-900">Voyage Simulation Controller</span>
          </div>

          <div className="flex items-center gap-2">
            {!isSimulating || (isSimulating && simulationIndex === 0) ? (
              <button
                id="start-voyage-btn"
                onClick={onStartSimulation}
                className="flex items-center gap-1.5 bg-brand-success text-white border-2 border-slate-900 px-3.5 py-1.5 rounded-none font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer uppercase"
              >
                <Play className="h-3 w-3 fill-current" />
                Start Voyage
              </button>
            ) : (
              <button
                id="pause-voyage-btn"
                onClick={onPauseSimulation}
                className="flex items-center gap-1.5 bg-brand-warning text-white border-2 border-slate-900 px-3.5 py-1.5 rounded-none font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer uppercase"
              >
                <Pause className="h-3 w-3 fill-current" />
                Pause
              </button>
            )}

            {simulationIndex > 0 && (
              <button
                id="stop-voyage-btn"
                onClick={onStopSimulation}
                className="flex items-center gap-1.5 bg-brand-danger text-white border-2 border-slate-900 px-3 py-1.5 rounded-none font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer uppercase"
              >
                <Square className="h-3 w-3 fill-current" />
                Abort
              </button>
            )}

            {/* Speed Multiplier selectors */}
            <div className="flex items-center bg-white border-2 border-slate-900 rounded-none ml-2">
              <span className="font-mono text-[9px] text-slate-500 px-1.5 py-0.5 border-r-2 border-slate-900 uppercase font-bold">Speed:</span>
              {[1].map(speed => (
                <button
                  key={`speed-mult-${speed}`}
                  onClick={() => onChangeSimSpeed(speed)}
                  className={`px-2 py-0.5 font-mono text-[10px] cursor-pointer ${
                    simSpeed === speed 
                      ? 'text-white font-bold bg-brand-sky border-l border-slate-900' 
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Tracker Slider/Timeline */}
        <div className="lg:col-span-5 flex flex-col justify-center px-2">
          <div className="flex justify-between items-center mb-1.5 font-mono text-[10px]">
            <span className="text-slate-500 font-bold uppercase">Transit Timeline</span>
            <span className="text-brand-success font-extrabold">{progressPercent}% Transit</span>
          </div>

          <div className="w-full bg-slate-100 h-4 border-2 border-slate-900 relative overflow-hidden rounded-none">
            <div
              className="h-full bg-brand-success transition-all duration-300 border-r-2 border-slate-900"
              style={{ width: `${progressPercent}%` }}
            ></div>
            
            {/* Render minor tick marks for checkpoints */}
            {activeRoute.simulationAlerts.map((alert, idx) => {
              const tickLeft = (alert.checkpointIndex / (totalWaypoints - 1)) * 100;
              const hasPassed = simulationIndex >= alert.checkpointIndex;
              return (
                <div
                  key={`tick-${idx}`}
                  className={`absolute top-0 bottom-0 w-[3px] z-10 ${
                    hasPassed ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                  style={{ left: `${tickLeft}%` }}
                  title={alert.title}
                />
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-1 font-mono text-[9px] text-slate-400">
            <span>DEP_PORT: {activeRoute.waypoints[0].lat.toFixed(2)}, {activeRoute.waypoints[0].lng.toFixed(2)}</span>
            <span>ARR_PORT: {activeRoute.waypoints[totalWaypoints-1].lat.toFixed(2)}, {activeRoute.waypoints[totalWaypoints-1].lng.toFixed(2)}</span>
          </div>
        </div>

        {/* Telemetry Metrics display */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3 border-l-2 border-slate-900 pl-4 font-mono">
          {/* Column 1: Telemetry */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px]">
              <Navigation className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500 font-bold uppercase">Dist:</span>
              <span className="font-extrabold text-slate-900">{distanceTravelled.toLocaleString()} NM</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px]">
              <Clock className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500 font-bold uppercase">ETA:</span>
              <span className="font-extrabold text-slate-900">{timeRemainingDays > 0 ? `${timeRemainingDays} Days` : 'ARRIVED'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px]">
              <Fuel className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500 font-bold uppercase">Fuel:</span>
              <span className="font-extrabold text-slate-900">{fuelConsumed} / {activeRoute.fuelTons} T</span>
            </div>
          </div>

          {/* Column 2: Threat details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] truncate" title={currentZoneName}>
              <AlertCircle className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-bold uppercase shrink-0">Zone:</span>
              <span className="font-extrabold text-slate-900 truncate">{currentZoneName}</span>
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <ShieldAlert className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-bold uppercase shrink-0">Threat:</span>
              <span className={`font-extrabold px-1.5 py-0.25 border-2 border-slate-900 shadow-[1px_1px_0px_#000] text-[8px] ${
                riskStatus === 'danger'
                  ? 'bg-brand-danger text-white'
                  : riskStatus === 'warning'
                    ? 'bg-brand-warning text-white'
                    : 'bg-brand-success text-white'
              }`}>
                {riskStatus.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <CloudRain className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-bold uppercase shrink-0">Meteo:</span>
              <span className={`font-extrabold px-1.5 py-0.25 border-2 border-slate-900 shadow-[1px_1px_0px_#000] text-[8px] ${
                weatherStatus === 'severe'
                  ? 'bg-brand-danger text-white'
                  : weatherStatus === 'rough'
                    ? 'bg-brand-warning text-white'
                    : 'bg-brand-success text-white'
              }`}>
                {weatherStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating System Danger Alert Popover when ship passes dangerous points */}
      {isSimulating && activeAlert && activeAlert.riskStatus === 'danger' && (
        <div className="absolute top-[-52px] left-1/2 transform -translate-x-1/2 bg-brand-danger border-2 border-slate-900 text-white font-mono text-[10px] px-4 py-2.5 rounded-none shadow-[4px_4px_0px_#000] flex items-center gap-2 animate-bounce z-30">
          <ShieldAlert className="h-4 w-4 animate-ping" />
          <span className="font-extrabold uppercase">Critical Alert: entering active piracy corridor - security protocols active</span>
        </div>
      )}
    </div>
  );
}
