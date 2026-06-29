'use client';

import React, { useState } from 'react';
import { Ship, Bell, Settings, Radio, Activity } from 'lucide-react';
import { Port } from '../data/ports';

interface TopNavProps {
  selectedFromPort: Port | null;
  selectedToPort: Port | null;
}

export default function TopNav({ selectedFromPort, selectedToPort }: TopNavProps) {
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const notifications = [
    { id: 1, type: 'severe', message: 'Typhoon Gaemi: South China Sea lane diversions active.' },
    { id: 2, type: 'danger', message: 'Gulf of Aden: Houthi drone warning. Armed escorts suggested.' },
    { id: 3, type: 'warning', message: 'Panama Canal: Booking slot delay extended to 48 hours.' },
    { id: 4, type: 'normal', message: 'Satellite link: Inmarsat-C primary channel restored.' }
  ];

  return (
    <header className="h-14 bg-white border-b-3 border-slate-900 flex items-center justify-between px-6 relative z-30">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-100 border-2 border-slate-900 rounded-none shadow-[2px_2px_0px_#0f172a] w-9 h-9 overflow-hidden flex items-center justify-center shrink-0">
          <img src="/logo.jpg" alt="BlueRoute Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-mono text-base font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
            Blue<span className="text-brand-sky font-extrabold">Route</span>
          </h1>
          <span className="block font-mono text-[9px] text-slate-500 tracking-wider uppercase font-semibold">
            AI Maritime Intelligence & Route Optimization
          </span>
        </div>
      </div>

      {/* Active Navigation Summary display */}
      <div className="hidden md:flex items-center bg-white border-2 border-slate-900 rounded-none px-4 py-1.5 font-mono text-xs shadow-[2px_2px_0px_#0f172a]">
        {selectedFromPort ? (
          <div className="flex items-center gap-2">
            <span className="text-brand-sky font-extrabold">{selectedFromPort.city.toUpperCase()}</span>
            <span className="text-slate-400">➔</span>
            {selectedToPort ? (
              <span className="text-brand-sky font-extrabold">{selectedToPort.city.toUpperCase()}</span>
            ) : (
              <span className="text-brand-warning font-bold animate-pulse">[SELECT TO]</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold">
            <Radio className="h-3.5 w-3.5 text-brand-sky" />
            Awaiting Command input... select departure and destination
          </div>
        )}
      </div>

      {/* Navigation Tools */}
      <div className="flex items-center gap-4">
        {/* Connection status indicator */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] text-brand-success">
          <Activity className="h-3.5 w-3.5 text-brand-success" />
          <span className="uppercase tracking-wider font-bold">ENC_UP_LINK</span>
        </div>

        {/* Alerts Bell notification */}
        <div className="relative">
          <button
            id="alerts-bell-btn"
            onClick={() => setShowAlerts(!showAlerts)}
            className="p-1.5 bg-white text-slate-700 hover:text-brand-sky rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-brand-danger border border-slate-900 rounded-none"></span>
          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_#0f172a] p-3.5 z-40">
              <h3 className="font-mono text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-900 pb-1.5 mb-2">Tactical Intelligence Alerts</h3>
              <div className="space-y-2">
                {notifications.map(notif => (
                  <div key={notif.id} className="flex gap-2 p-1.5 rounded-none bg-slate-50 border-2 border-slate-900 shadow-[1px_1px_0px_#000]">
                    <span className={`w-2 h-2 border border-slate-900 rounded-none mt-1 shrink-0 ${
                      notif.type === 'severe' || notif.type === 'danger' ? 'bg-brand-danger' : 'bg-brand-warning'
                    }`}></span>
                    <p className="font-mono text-[10px] text-slate-800 leading-snug">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <div className="relative">
          <button
            id="settings-cog-btn"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 bg-white text-slate-700 hover:text-brand-sky rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
          >
            <Settings className="h-4 w-4" />
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_#0f172a] p-4 z-40">
              <h3 className="font-mono text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-900 pb-1.5 mb-3">System Settings</h3>
              
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Engine Fuel Profile:</span>
                  <select className="bg-white border-2 border-slate-900 rounded-none px-1.5 py-0.5 text-slate-900 text-[10px] outline-none">
                    <option>HFO (Heavy Fuel Oil)</option>
                    <option>MGO (Marine Gas Oil)</option>
                    <option>LNG (Dual Fuel)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Satellite Refresh Rate:</span>
                  <select className="bg-white border-2 border-slate-900 rounded-none px-1.5 py-0.5 text-slate-900 text-[10px] outline-none">
                    <option>Realtime (1s)</option>
                    <option>Standard (5s)</option>
                    <option>Buffered (15s)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">HUD Overlay:</span>
                  <input type="checkbox" defaultChecked className="rounded-none border-2 border-slate-900 accent-brand-glow w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
