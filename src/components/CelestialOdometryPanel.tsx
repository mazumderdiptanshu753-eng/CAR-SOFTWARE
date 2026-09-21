import React from 'react';
import {
  Satellite,
  Radio,
  Compass,
  Disc,
  Eye,
  Sparkles,
  Zap,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Lock
} from 'lucide-react';
import { Language, Theme } from '../types';

export interface CelestialStar {
  name: string;
  altitudeDeg: number;
  azimuthDeg: number;
  magnitude: number;
  lockStatus: 'LOCKED' | 'TRACKING' | 'SEARCHING';
}

export interface OdometryMetrics {
  wheelTicksLeft: number;
  wheelTicksRight: number;
  wheelSlipPercent: number;
  opticalFlowVx: number; // mm/s
  opticalFlowVy: number; // mm/s
  opticalGroundConfidence: number; // 0-100%
  celestialHeadingErrorDeg: number;
  kalmanPositionDriftMm: number; // Cumulative drift in millimeters
  activeFixType: 'GPS_RTK' | 'DEAD_RECKONING_FUSION' | 'CELESTIAL_VIO_LOCK';
}

interface CelestialOdometryPanelProps {
  theme: Theme;
  isGpsDenied: boolean;
  onToggleGpsDenied: () => void;
  odometry: OdometryMetrics;
  carHeading: number;
  stars: CelestialStar[];
  isTunnelActive: boolean;
  onSimulateTunnelMode: () => void;
}

export const CelestialOdometryPanel: React.FC<CelestialOdometryPanelProps> = ({
  theme,
  isGpsDenied,
  onToggleGpsDenied,
  odometry,
  carHeading,
  stars,
  isTunnelActive,
  onSimulateTunnelMode
}) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`p-3 rounded-2xl border-2 transition-all w-full flex flex-col gap-2.5 ${
        isGpsDenied
          ? 'bg-gradient-to-br from-[#071329] via-[#091e42] to-[#040e21] border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.35)]'
          : isLight
            ? 'bg-gradient-to-br from-white via-indigo-50/40 to-cyan-50/40 border-indigo-200 text-slate-800 shadow-[0_4px_20px_rgba(99,102,241,0.1)]'
            : 'bg-gradient-to-br from-[#080d1a] via-[#0f172a] to-[#050914] border-indigo-500/40 text-slate-100 shadow-[0_4px_25px_rgba(99,102,241,0.2)]'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between text-[11px] font-bold pb-2 border-b border-indigo-500/30">
        <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>Satellite-Denied Odometry & Celestial Tracker</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleGpsDenied}
            className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer border ${
              isGpsDenied
                ? 'bg-rose-500/25 text-rose-300 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
            }`}
          >
            {isGpsDenied ? '📡 GPS Jammed / Blackout' : '🛰️ GPS Receiver Locked'}
          </button>
        </div>
      </div>

      {/* GPS Status & Active Fusion Engine Indicator */}
      <div
        className={`p-2 rounded-xl border flex items-center justify-between text-[10px] font-mono ${
          isGpsDenied
            ? 'bg-cyan-950/80 border-cyan-400/80 text-cyan-200 shadow-[inset_0_0_15px_rgba(6,182,212,0.3)]'
            : 'bg-[#091122] border-indigo-500/30 text-indigo-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {isGpsDenied ? (
            <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
          ) : (
            <Satellite className="w-4 h-4 text-emerald-400" />
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-200">
              {isGpsDenied ? 'Sub-Centimeter Dead-Reckoning Active' : 'Standard GPS Guidance Mode'}
            </span>
            <span className="text-[9px] text-cyan-300 font-mono">
              {odometry.activeFixType} • Kalman Filter Fusion
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-400">Position Drift:</span>
          <div className="font-black text-emerald-300 text-xs">
            ±{(odometry.kalmanPositionDriftMm / 10).toFixed(1)} cm
          </div>
        </div>
      </div>

      {/* 3 Triple-Sensor Pillars: Encoders, Optical Flow, Celestial Stars */}
      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
        {/* Sensor 1: Dual Wheel Encoders */}
        <div className="p-2 rounded-xl bg-[#050b18] border border-cyan-500/30 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-cyan-400 font-bold border-b border-cyan-500/20 pb-1">
            <Disc className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
            <span>Wheel Encoders</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-300 mt-0.5">
            <span>Left Ticks:</span>
            <span className="font-bold text-cyan-200">{odometry.wheelTicksLeft}</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-300">
            <span>Right Ticks:</span>
            <span className="font-bold text-cyan-200">{odometry.wheelTicksRight}</span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">Wheel Slip:</span>
            <span className="text-emerald-400 font-bold">{odometry.wheelSlipPercent.toFixed(1)}%</span>
          </div>
        </div>

        {/* Sensor 2: Ground Optical Flow Camera */}
        <div className="p-2 rounded-xl bg-[#050b18] border border-indigo-500/30 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-indigo-400 font-bold border-b border-indigo-500/20 pb-1">
            <Eye className="w-3.5 h-3.5 text-indigo-300" />
            <span>Optical Flow</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-300 mt-0.5">
            <span>Vx Velocity:</span>
            <span className="font-bold text-indigo-200">{odometry.opticalFlowVx} mm/s</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-300">
            <span>Vy Velocity:</span>
            <span className="font-bold text-indigo-200">{odometry.opticalFlowVy} mm/s</span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">Confidence:</span>
            <span className="text-emerald-400 font-bold">{odometry.opticalGroundConfidence}%</span>
          </div>
        </div>

        {/* Sensor 3: Celestial Star Tracker Heading */}
        <div className="p-2 rounded-xl bg-[#050b18] border border-amber-500/30 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-amber-400 font-bold border-b border-amber-500/20 pb-1">
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>Star Tracker</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-300 mt-0.5">
            <span>Heading Lock:</span>
            <span className="font-bold text-amber-200">{Math.round(carHeading)}°</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-300">
            <span>Locked Stars:</span>
            <span className="font-bold text-amber-200">{stars.filter(s => s.lockStatus === 'LOCKED').length} Stars</span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">Error Tolerance:</span>
            <span className="text-emerald-400 font-bold">&lt; 0.04°</span>
          </div>
        </div>
      </div>

      {/* Celestial Sky Dome Visualizer & Star Tracker Array */}
      <div className="p-2 rounded-xl bg-[#040814] border border-cyan-500/30 flex items-center gap-3">
        {/* Mini 2D Polar Dome SVG showing locked stars */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="w-18 h-18" viewBox="0 0 100 100">
            {/* Celestial Concentric Grid */}
            <circle cx="50" cy="50" r="46" fill="#020611" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="16" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="50" y1="4" x2="50" y2="96" stroke="#1e3a5f" strokeWidth="1" />
            <line x1="4" y1="50" x2="96" y2="50" stroke="#1e3a5f" strokeWidth="1" />

            {/* Heading Vector */}
            <line
              x1="50"
              y1="50"
              x2={50 + 42 * Math.sin((carHeading * Math.PI) / 180)}
              y2={50 - 42 * Math.cos((carHeading * Math.PI) / 180)}
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="2 2"
            />

            {/* Stars mapped onto sky dome */}
            {stars.map((star, idx) => {
              // Convert Alt/Az to polar projection
              const r = ((90 - star.altitudeDeg) / 90) * 40;
              const angleRad = ((star.azimuthDeg - 90) * Math.PI) / 180;
              const sx = 50 + r * Math.cos(angleRad);
              const sy = 50 + r * Math.sin(angleRad);

              return (
                <g key={idx}>
                  <circle
                    cx={sx}
                    cy={sy}
                    r={star.lockStatus === 'LOCKED' ? 3.5 : 2}
                    fill={star.lockStatus === 'LOCKED' ? '#38bdf8' : '#e2e8f0'}
                    className={star.lockStatus === 'LOCKED' ? 'animate-ping' : ''}
                  />
                  <circle
                    cx={sx}
                    cy={sy}
                    r={star.lockStatus === 'LOCKED' ? 2 : 1.2}
                    fill={star.lockStatus === 'LOCKED' ? '#0284c7' : '#94a3b8'}
                  />
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[7px] font-mono text-cyan-400 font-bold bg-black/60 px-1 rounded">
              CELESTIAL
            </span>
          </div>
        </div>

        {/* Star Lock List */}
        <div className="flex-1 flex flex-col gap-1 text-[9px] font-mono">
          <div className="flex justify-between items-center text-slate-300 font-bold pb-0.5 border-b border-cyan-500/20">
            <span>Celestial Satellite Locks:</span>
            <span className="text-cyan-300 font-mono">0.01cm Accuracy</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {stars.map((star, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1 rounded bg-[#091326] border border-cyan-500/20"
              >
                <span className="text-slate-200 font-bold truncate">{star.name}</span>
                <span
                  className={`text-[8px] px-1 rounded ${
                    star.lockStatus === 'LOCKED'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {star.lockStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Testing Controls */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onToggleGpsDenied}
          className={`py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer border-t transition-all flex items-center justify-center gap-1.5 ${
            isGpsDenied
              ? 'bg-gradient-to-b from-rose-500 to-red-700 text-white border-rose-300 shadow-[0_2px_0_#881337,0_0_12px_rgba(244,63,94,0.5)]'
              : 'bg-gradient-to-b from-indigo-500 to-blue-700 text-white border-indigo-300 shadow-[0_2px_0_#1e3a8a,0_0_12px_rgba(99,102,241,0.5)]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{isGpsDenied ? 'Restore GPS Signal' : 'Simulate GPS Jamming'}</span>
        </button>

        <button
          onClick={onSimulateTunnelMode}
          className={`py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer border-t transition-all flex items-center justify-center gap-1.5 ${
            isTunnelActive
              ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-200 shadow-[0_2px_0_#78350f,0_0_12px_rgba(245,158,11,0.5)]'
              : 'bg-gradient-to-b from-cyan-500 to-teal-700 text-slate-950 border-cyan-200 shadow-[0_2px_0_#0f766e,0_0_12px_rgba(6,182,212,0.5)]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isTunnelActive ? 'Exit Tunnel Mode' : 'Underground Tunnel Mode'}</span>
        </button>
      </div>
    </div>
  );
};
