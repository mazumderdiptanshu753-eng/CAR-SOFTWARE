import React, { useState } from 'react';
import { Power, AlertTriangle, Activity } from 'lucide-react';
import { Theme } from '../types';

interface NavbarProps {
  theme: Theme;
  onToggleTheme: () => void;
  isMobileView?: boolean;
  onToggleMobileView?: () => void;
  isCarDisplayMode?: boolean;
  onToggleCarDisplay?: () => void;
  missionStatus: string;
  onTogglePlay: () => void;
  onReset: () => void;
  isRunning: boolean;
  autoStopTriggered?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
}) => {
  const [isPoweredOn, setIsPoweredOn] = useState<boolean>(true);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);

  return (
    <header className="bg-[#0b1329] border-b border-indigo-500/40 text-slate-100 sticky top-0 z-40 backdrop-blur-md transition-colors">
      <div className="max-w-[1700px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: System Power Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPoweredOn(prev => !prev)}
            className={`px-5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
              isPoweredOn
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.7)] border border-emerald-400'
                : 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.7)] border border-rose-400'
            }`}
          >
            <Power className={`w-5 h-5 ${isPoweredOn ? 'text-emerald-200 animate-pulse' : 'text-rose-200'}`} />
            <span>{isPoweredOn ? 'SYSTEM POWER: ON' : 'SYSTEM POWER: OFF'}</span>
          </button>
        </div>

        {/* Right: Emergency Alert & Diagnostics */}
        <div className="flex items-center gap-2">
          {/* Emergency Alert Button */}
          <button
            onClick={() => setEmergencyActive(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer border ${
              emergencyActive
                ? 'bg-rose-600 text-white border-rose-300 animate-bounce shadow-[0_0_25px_rgba(244,63,94,0.9)]'
                : 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/60 shadow-md'
            }`}
            title="Toggle Emergency SOS Beacon"
          >
            <AlertTriangle className={`w-4 h-4 ${emergencyActive ? 'animate-ping text-white' : 'text-rose-400'}`} />
            <span>{emergencyActive ? '🚨 SOS EMERGENCY ACTIVE' : 'Emergency Alert'}</span>
          </button>

          {/* Diagnostics / CPU */}
          <button
            onClick={() => alert('UGV Diagnostics: All systems nominal. Battery 94%, Core temp 42°C, LiDAR 60Hz.')}
            className="px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60 shadow-md"
          >
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>
    </header>
  );
};
