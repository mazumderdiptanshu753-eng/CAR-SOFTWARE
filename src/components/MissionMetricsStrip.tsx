import React from 'react';
import { UgvPose, SlamPose, Waypoint, Language, Theme } from '../types';
import { translations } from '../data/translations';
import { CheckCircle2, ShieldAlert, Zap, Route, Target, Compass, Award } from 'lucide-react';

interface MissionMetricsStripProps {
  pose: UgvPose;
  slamPose: SlamPose;
  goal: Waypoint;
  distanceToGoal: number;
  progressPercent: number;
  hazardsAvoidedCount: number;
  language: Language;
  timeElapsed: number;
  theme?: Theme;
}

export const MissionMetricsStrip: React.FC<MissionMetricsStripProps> = ({
  pose,
  slamPose,
  goal,
  distanceToGoal,
  progressPercent,
  hazardsAvoidedCount,
  language,
  timeElapsed,
  theme = 'light'
}) => {
  const t = translations[language];
  const isLight = theme === 'light';

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`rounded-xl border p-3 shadow-xs flex flex-col gap-3 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100 shadow-md'
    }`}>
      {/* Top Strip: Mission Progress Bar from Point A to Point B */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className={`flex items-center gap-1.5 font-semibold font-bengali ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.pointAToB}</span>
          </div>
          <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>
            Progress: <span className="text-emerald-600 font-bold">{progressPercent}%</span> ({distanceToGoal.toFixed(1)}m remaining)
          </div>
        </div>

        {/* Progress bar track */}
        <div className={`w-full h-2.5 rounded-full overflow-hidden border p-0.5 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div
            className="h-full bg-linear-to-r from-sky-500 via-emerald-500 to-emerald-400 rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Stats Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        {/* Speed */}
        <div className={`border rounded-lg p-2 flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
        }`}>
          <div>
            <div className={`text-3xs font-bengali ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.speed}</div>
            <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{pose.v.toFixed(2)} m/s</div>
          </div>
          <Zap className="w-4 h-4 text-amber-500" />
        </div>

        {/* Time Elapsed */}
        <div className={`border rounded-lg p-2 flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
        }`}>
          <div>
            <div className={`text-3xs font-bengali ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.timeElapsed}</div>
            <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{formatTime(timeElapsed)}</div>
          </div>
          <Route className="w-4 h-4 text-sky-500" />
        </div>

        {/* Hazards Avoided */}
        <div className={`border rounded-lg p-2 flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
        }`}>
          <div>
            <div className={`text-3xs font-bengali ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.avoidedCollisions}</div>
            <div className="text-sm font-bold text-emerald-600">{hazardsAvoidedCount}</div>
          </div>
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
        </div>

        {/* VO Drift */}
        <div className={`border rounded-lg p-2 flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
        }`}>
          <div>
            <div className={`text-3xs font-bengali ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.driftError}</div>
            <div className={`text-sm font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>±{slamPose.driftError} m</div>
          </div>
          <Compass className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
        </div>
      </div>

      {/* Challenge Acceptance Badges */}
      <div className={`flex flex-wrap items-center justify-between gap-2 pt-1 border-t text-2xs ${
        isLight ? 'border-slate-200' : 'border-slate-800/60'
      }`}>
        <div className={`font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {'Autonomy Validation:'}
        </div>
        <div className="flex items-center flex-wrap gap-2 font-mono">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
          }`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>CH1: Path Detection</span>
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
          }`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>CH2: Visual SLAM</span>
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
          }`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>CH3: Collision Avoidance</span>
          </span>
        </div>
      </div>
    </div>
  );
};
