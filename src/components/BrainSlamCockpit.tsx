import React from 'react';
import { SlamPose, UgvPose, Language, Waypoint, Theme } from '../types';
import { translations } from '../data/translations';
import { Brain, Compass, Target, Route, ShieldCheck, Cpu } from 'lucide-react';

interface BrainSlamCockpitProps {
  slamPose: SlamPose;
  actualPose: UgvPose;
  goal: Waypoint;
  language: Language;
  distanceToGoal: number;
  theme?: Theme;
}

export const BrainSlamCockpit: React.FC<BrainSlamCockpitProps> = ({
  slamPose,
  actualPose,
  goal,
  language,
  distanceToGoal,
  theme = 'light'
}) => {
  const t = translations[language];
  const isLight = theme === 'light';

  // Heading in degrees
  const headingDeg = Math.round(slamPose.theta * (180 / Math.PI));
  const normalizedHeading = ((headingDeg % 360) + 360) % 360;

  return (
    <div className={`rounded-xl border p-3 shadow-xs flex flex-col gap-3 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100 shadow-md'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-2 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${
            isLight ? 'bg-purple-100 border border-purple-300 text-purple-700' : 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
          }`}>
            <Brain className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`font-semibold text-sm font-bengali ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {t.brainModuleTitle}
            </h3>
            <p className={`text-2xs font-bengali ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.brainModuleSub}
            </p>
          </div>
        </div>

        {/* SLAM Tracking Status Pill */}
        <span
          className={`px-2 py-0.5 rounded text-2xs font-mono font-semibold border ${
            slamPose.status === 'TRACKING_EXCELLENT'
              ? isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
              : slamPose.status === 'LOOP_CLOSURE'
              ? isLight
                ? 'bg-purple-50 text-purple-800 border-purple-300'
                : 'bg-purple-950/80 text-purple-300 border-purple-700/50'
              : isLight
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-amber-950/80 text-amber-300 border-amber-700/50'
          }`}
        >
          {slamPose.status}
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Estimated VO Pose (X, Y) */}
        <div className={`border rounded-lg p-2.5 flex flex-col justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
        }`}>
          <div className={`text-2xs font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {language === 'bn' ? 'ভিজ্যুয়াল এসএলএএম পজিশন' : 'Estimated Pose (VO)'}
          </div>
          <div className={`text-base font-bold font-mono mt-1 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
            X:{slamPose.x.toFixed(1)} Y:{slamPose.y.toFixed(1)}
          </div>
          <div className={`text-3xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Drift: <span className={isLight ? 'text-amber-700 font-semibold' : 'text-amber-400'}>±{slamPose.driftError}m</span>
          </div>
        </div>

        {/* Tracked Keypoints */}
        <div className={`border rounded-lg p-2.5 flex flex-col justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
        }`}>
          <div className={`text-2xs font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.trackedFeatures}
          </div>
          <div className={`text-base font-bold font-mono mt-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            {slamPose.trackedKeypoints} <span className={`text-2xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>pts</span>
          </div>
          <div className={`text-3xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Landmarks: {slamPose.landmarks.length} active
          </div>
        </div>

        {/* Distance to Point B */}
        <div className={`border rounded-lg p-2.5 flex flex-col justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
        }`}>
          <div className={`text-2xs font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.distanceRemaining}
          </div>
          <div className={`text-base font-bold font-mono mt-1 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
            {distanceToGoal.toFixed(1)} <span className={`text-2xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>m</span>
          </div>
          <div className={`text-3xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Goal Target: (90, 50)
          </div>
        </div>

        {/* Compass & Heading */}
        <div className={`border rounded-lg p-2 flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
        }`}>
          <div>
            <div className={`text-2xs font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {t.heading}
            </div>
            <div className={`text-base font-bold font-mono mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {normalizedHeading}°
            </div>
            <div className={`text-3xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {(slamPose.theta).toFixed(2)} rad
            </div>
          </div>
          {/* Visual Compass Graphic */}
          <div className={`w-10 h-10 rounded-full border relative flex items-center justify-center shadow-xs ${
            isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900'
          }`}>
            <div
              className="absolute w-1 h-7 flex flex-col items-center justify-between transition-transform duration-100"
              style={{ transform: `rotate(${normalizedHeading}deg)` }}
            >
              <span className="w-0 h-0 border-x-3 border-x-transparent border-b-6 border-b-rose-500" />
              <span className={`w-0 h-0 border-x-3 border-x-transparent border-t-6 ${isLight ? 'border-t-slate-400' : 'border-t-slate-500'}`} />
            </div>
            <div className={`w-1.5 h-1.5 rounded-full z-10 ${isLight ? 'bg-slate-800' : 'bg-white'}`} />
          </div>
        </div>
      </div>

      {/* Path Planner & Collision Avoidance Logic Display */}
      <div className={`border rounded-lg p-2.5 flex flex-col gap-2 ${
        isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
      }`}>
        <div className="flex items-center justify-between text-xs">
          <div className={`flex items-center gap-1.5 font-bengali ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
            <Route className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            <span className="font-semibold">{language === 'bn' ? 'পাথ প্ল্যানার (A* + DWA)' : 'Path Planner (A* + DWA)'}</span>
          </div>
          <div className={`text-2xs font-mono flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <span>Target v: {actualPose.v.toFixed(2)} m/s</span>
            <span>Target ω: {actualPose.omega.toFixed(2)} rad/s</span>
          </div>
        </div>

        {/* Mathematical formulation banner */}
        <div className={`p-2 rounded border text-3xs font-mono flex flex-wrap items-center justify-between gap-2 ${
          isLight ? 'bg-white border-slate-200 text-slate-700 shadow-xs' : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <span>Global: A*(Costmap) ➔ Local: DWA(v, ω, clearance)</span>
          <span className={`font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>GPS Denied: 100% Visual Odometry</span>
        </div>
      </div>
    </div>
  );
};
