import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  AlertOctagon,
  RefreshCw,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { Language, Theme } from '../types';

interface UGVDefensiveSafetyModuleProps {
  language: Language;
  theme: Theme;
  // Perimeter Defense State
  isPerimeterArmed: boolean;
  onTogglePerimeterArm: () => void;
  isBreached: boolean;
  breachDistanceMeters: number | null;
  onSimulateIntruderBreach: () => void;
  onClearBreach: () => void;
  isEngineLocked: boolean;
  isSirenAudible: boolean;
  onToggleSirenAudible: () => void;

  // Self-Righting & Rollover State
  rollAngleDeg: number;
  pitchAngleDeg: number;
  isTumbled: boolean;
  isSelfRightingActive: boolean;
  selfRightingPhase: string;
  onSimulateRollover: () => void;
  onExecuteSelfRighting: () => void;
  autoSelfRightEnabled: boolean;
  onToggleAutoSelfRight: () => void;
}

export const UGVDefensiveSafetyModule: React.FC<UGVDefensiveSafetyModuleProps> = ({
  language,
  theme,
  isPerimeterArmed,
  onTogglePerimeterArm,
  isBreached,
  breachDistanceMeters,
  onSimulateIntruderBreach,
  onClearBreach,
  isEngineLocked,
  isSirenAudible,
  onToggleSirenAudible,
  rollAngleDeg,
  pitchAngleDeg,
  isTumbled,
  isSelfRightingActive,
  selfRightingPhase,
  onSimulateRollover,
  onExecuteSelfRighting,
  autoSelfRightEnabled,
  onToggleAutoSelfRight
}) => {
  const isLight = theme === 'light';

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* MODULE 1: 360° GEOFENCE BREACH ALARM & PERIMETER DEFENSE */}
      <div
        className={`p-2.5 rounded-2xl border-2 transition-all ${
          isBreached
            ? 'bg-gradient-to-br from-[#2a0812] via-[#3d0a1b] to-[#1a050c] border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.45)]'
            : isLight
              ? 'bg-gradient-to-br from-white via-rose-50/50 to-amber-50/50 border-rose-300/80 text-slate-800 shadow-[0_4px_20px_rgba(244,63,94,0.12)]'
              : 'bg-gradient-to-br from-[#180d1e] via-[#24102c] to-[#120817] border-rose-500/40 text-slate-100 shadow-[0_4px_25px_rgba(244,63,94,0.2)]'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-bold pb-1.5 mb-2 font-bengali border-b border-rose-500/30">
          <span className="flex items-center gap-1.5 text-rose-400 font-extrabold">
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>৩৬০° পেরিমিটার ডিফেন্স ও অ্যান্টি-ট্যাম্পার</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePerimeterArm}
              className={`px-2 py-0.5 rounded-full text-[10px] font-black font-bengali transition-all cursor-pointer border ${
                isPerimeterArmed
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isPerimeterArmed ? 'ডিফেন্স অন' : 'ডিফেন্স অফ'}
            </button>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                isBreached
                  ? 'bg-rose-500 text-white border-rose-300 animate-ping shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
              }`}
            >
              {isBreached ? 'BREACH!' : 'SECURE'}
            </span>
          </div>
        </div>

        {/* Live Breach Banner & Sensor Readout */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            {/* Engine Lockout State */}
            <div
              className={`p-2 rounded-xl border flex items-center justify-between ${
                isEngineLocked
                  ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 shadow-[inset_0_0_12px_rgba(244,63,94,0.4)]'
                  : 'bg-[#0b1424] border-cyan-500/30 text-cyan-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bengali">
                {isEngineLocked ? (
                  <Lock className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span className="font-bold">ইঞ্জিন:</span>
              </div>
              <span className="font-black">
                {isEngineLocked ? '🛑 হার্ডওয়্যার লক' : 'সক্রিয় (Drive)'}
              </span>
            </div>

            {/* Ultrasonic Proximity Zone */}
            <div className="p-2 rounded-xl bg-[#0b1424] border border-cyan-500/30 text-cyan-300 flex items-center justify-between">
              <span className="font-bengali font-bold">সিকিউরিটি জোন:</span>
              <span className="font-mono font-black text-amber-300">২.০ মিটার (360°)</span>
            </div>
          </div>

          {/* Critical Breach Notification */}
          {isBreached && (
            <div className="p-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-[0_0_20px_rgba(244,63,94,0.7)] flex flex-col gap-1 animate-pulse">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs font-bengali flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>অনুপ্রবেশকারী শনাক্ত! দূরত্ব: {breachDistanceMeters?.toFixed(1)}m</span>
                </span>
                <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded-full">
                  SIREN ACTIVE
                </span>
              </div>
              <p className="text-[10px] font-bengali text-rose-100">
                ইঞ্জিন তৎক্ষণাৎ নিষ্ক্রিয় করা হয়েছে এবং হাই-পিচ অ্যালার্ম ও ৩৬০° ফ্ল্যাশার চালু রয়েছে।
              </p>
            </div>
          )}

          {/* Interactive Defense Controls */}
          <div className="flex items-center gap-2 font-bengali">
            {!isBreached ? (
              <button
                onClick={onSimulateIntruderBreach}
                className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black text-slate-950 bg-gradient-to-b from-rose-400 via-rose-500 to-red-600 border-t border-rose-200 shadow-[0_2px_0_#881337,0_0_12px_rgba(244,63,94,0.5)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                title="রোভারের ২ মিটারের মধ্যে অনুপ্রবেশকারীর উপস্থিতি সিমুলেট করুন"
              >
                <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>অনুপ্রবেশকারী টেস্ট (&lt;২মি.)</span>
              </button>
            ) : (
              <button
                onClick={onClearBreach}
                className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black text-white bg-gradient-to-b from-emerald-500 to-teal-700 border-t border-emerald-200 shadow-[0_2px_0_#065f46,0_0_12px_rgba(16,185,129,0.5)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Unlock className="w-3.5 h-3.5 text-white" />
                <span>রিসেট ও ইঞ্জিন আনলক</span>
              </button>
            )}

            {/* Audio Siren Mute Toggle */}
            <button
              onClick={onToggleSirenAudible}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isSirenAudible
                  ? 'bg-rose-500 text-white border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={isSirenAudible ? 'সাইরেন শব্দ চালু' : 'সাইরেন শব্দ মিউট'}
            >
              {isSirenAudible ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* MODULE 2: SELF-RIGHTING ROLL-OVER RECOVERY */}
      <div
        className={`p-2.5 rounded-2xl border-2 transition-all ${
          isTumbled
            ? 'bg-gradient-to-br from-[#2b1006] via-[#3a1809] to-[#1c0a04] border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.45)]'
            : isLight
              ? 'bg-gradient-to-br from-white via-amber-50/50 to-orange-50/50 border-amber-300/80 text-slate-800 shadow-[0_4px_20px_rgba(245,158,11,0.12)]'
              : 'bg-gradient-to-br from-[#191108] via-[#261a0d] to-[#120c06] border-amber-500/40 text-slate-100 shadow-[0_4px_25px_rgba(245,158,11,0.2)]'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-bold pb-1.5 mb-2 font-bengali border-b border-amber-500/30">
          <span className="flex items-center gap-1.5 text-amber-400 font-extrabold">
            <RotateCw className="w-4 h-4 text-amber-400" />
            <span>জাইরো রোল-ওভার ও সেলফ-রাইটিং রিকভারি</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${
              isTumbled
                ? 'bg-amber-500 text-slate-950 border-amber-200 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
            }`}
          >
            {isTumbled ? 'TUMBLE ALERT!' : 'UPRIGHT'}
          </span>
        </div>

        {/* 3D Attitude Horizon & Inclinometer */}
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Mini Gyro Horizon SVG */}
          <div className="col-span-5 relative flex flex-col items-center justify-center p-1 rounded-xl bg-[#060a14] border border-amber-500/40 shadow-inner">
            <svg className="w-20 h-20" viewBox="0 0 100 100">
              {/* Outer Circular Rim */}
              <circle cx="50" cy="50" r="44" fill="#040812" stroke="#f59e0b" strokeWidth="2" />
              {/* Horizon Line & Vehicle Chassis */}
              <g
                style={{
                  transform: `rotate(${rollAngleDeg}deg)`,
                  transformOrigin: '50px 50px',
                  transition: isSelfRightingActive ? 'transform 0.3s ease-out' : 'transform 0.15s ease-out'
                }}
              >
                {/* Ground half */}
                <path d="M 6 50 A 44 44 0 0 0 94 50 Z" fill="#78350f" fillOpacity="0.4" />
                {/* Sky half */}
                <path d="M 6 50 A 44 44 0 0 1 94 50 Z" fill="#0369a1" fillOpacity="0.3" />
                {/* Horizon Line */}
                <line x1="6" y1="50" x2="94" y2="50" stroke="#f59e0b" strokeWidth="2" />

                {/* Rover Silhouette Representation */}
                <rect x="36" y="42" width="28" height="16" rx="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                {/* Wheels */}
                <rect x="32" y="40" width="4" height="7" rx="1.5" fill="#f59e0b" />
                <rect x="64" y="40" width="4" height="7" rx="1.5" fill="#f59e0b" />
                <rect x="32" y="53" width="4" height="7" rx="1.5" fill="#f59e0b" />
                <rect x="64" y="53" width="4" height="7" rx="1.5" fill="#f59e0b" />
              </g>
              {/* Center Fixed Reticle */}
              <circle cx="50" cy="50" r="2.5" fill="#f43f5e" />
              <line x1="40" y1="50" x2="46" y2="50" stroke="#f43f5e" strokeWidth="2" />
              <line x1="54" y1="50" x2="60" y2="50" stroke="#f43f5e" strokeWidth="2" />
            </svg>

            {/* Readout under dial */}
            <div className="text-[10px] font-mono font-black text-amber-300 mt-1">
              Roll: {Math.round(rollAngleDeg)}°
            </div>
          </div>

          {/* Orientation Stats & Tumble Warnings */}
          <div className="col-span-7 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono p-1.5 rounded-lg bg-[#060a14] border border-amber-500/30">
              <span className="font-bengali text-slate-300">চ্যাসিস অবস্থা:</span>
              <span className={`font-black ${isTumbled ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {isTumbled ? 'উল্টে গেছে (Inverted)' : 'সোজা (Normal)'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono p-1.5 rounded-lg bg-[#060a14] border border-amber-500/30">
              <span className="font-bengali text-slate-300">অটো রাইটিং:</span>
              <button
                onClick={onToggleAutoSelfRight}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bengali font-bold cursor-pointer ${
                  autoSelfRightEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {autoSelfRightEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </button>
            </div>

            {/* Active Sequence Banner */}
            {isSelfRightingActive && (
              <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-200 text-[10px] font-mono font-bold animate-pulse flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                <span className="truncate">{selfRightingPhase}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Simulate Rollover & Execute Kinetic Recovery */}
        <div className="grid grid-cols-2 gap-2 mt-2 font-bengali">
          <button
            onClick={onSimulateRollover}
            disabled={isSelfRightingActive}
            className="py-1.5 px-2 rounded-xl text-[11px] font-black text-slate-950 bg-gradient-to-b from-amber-400 to-orange-500 border-t border-amber-200 shadow-[0_2px_0_#9a3412,0_0_10px_rgba(245,158,11,0.4)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="গাড়ির ১৮০ ডিগ্রি উল্টে যাওয়া সিমুলেট করুন"
          >
            <Flame className="w-3.5 h-3.5 text-slate-950" />
            <span>গাড়ি উল্টে দিন (১৮০°)</span>
          </button>

          <button
            onClick={onExecuteSelfRighting}
            disabled={!isTumbled || isSelfRightingActive}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-black border-t transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isTumbled
                ? 'bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-700 text-slate-950 border-emerald-200 shadow-[0_2px_0_#065f46,0_0_15px_rgba(16,185,129,0.7)] animate-bounce'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSelfRightingActive ? 'animate-spin' : ''}`} />
            <span>রিভার্স পালস (সোজা করুন)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
