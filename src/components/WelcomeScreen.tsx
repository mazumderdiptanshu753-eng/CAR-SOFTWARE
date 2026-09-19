import React, { useState } from 'react';
import { Cpu, ShieldCheck, Sparkles, Navigation, ArrowRight, Zap, Radio } from 'lucide-react';
import { Language, Theme } from '../types';

interface WelcomeScreenProps {
  language: Language;
  theme: Theme;
  onEnterApp: () => void;
  onToggleLanguage: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  language,
  theme,
  onEnterApp,
  onToggleLanguage
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const isBn = language === 'bn';

  const handleStart = () => {
    setIsExiting(true);
    setTimeout(() => {
      onEnterApp();
    }, 600);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-700 bg-[#040812] text-slate-100 overflow-hidden ${
      isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
    }`}>
      {/* Ambient Cyberpunk Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 left-10 w-[300px] h-[300px] bg-emerald-500/15 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Glassmorphic Welcome Card */}
      <div className="relative z-10 max-w-2xl w-full bg-[#081026]/90 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-[32px] p-8 sm:p-12 shadow-[0_0_80px_rgba(6,182,212,0.25)] flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in duration-500">
        
        {/* Language Switcher Badge at Top Right */}
        <div className="absolute top-6 right-6">
          <button
            onClick={onToggleLanguage}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>🌐</span>
            <span>{isBn ? 'English' : 'বাংলা'}</span>
          </button>
        </div>

        {/* Pulsing Cyber UGV Logo Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-xl animate-ping"></div>
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-600 to-indigo-700 p-1 shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center">
            <div className="w-full h-full bg-[#060b18] rounded-[22px] flex items-center justify-center">
              <Cpu className="w-12 h-12 sm:w-14 sm:h-14 text-cyan-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title & Group Credits */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>{isBn ? 'জিপিএস-বিহীন স্বয়ংক্রিয় নেভিগেশন' : 'GPS-Denied Autonomous Navigation'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-bengali mt-2">
            UGV CAR
          </h1>

          <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono tracking-wider font-extrabold text-sm sm:text-base">
            <span className="w-8 h-[2px] bg-cyan-500/50"></span>
            <span>BY TECH TITANS GROUP</span>
            <span className="w-8 h-[2px] bg-cyan-500/50"></span>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-300 text-xs sm:text-sm max-w-lg font-bengali leading-relaxed">
          {isBn
            ? 'রিয়েল-টাইম লাইভ ম্যাপ, এআই অবজেক্ট ডিটেকশন, মোটর পিআইডি কন্ট্রোল এবং জিপিএস-বিহীন স্বয়ংক্রিয় রোভার নেভিগেশন সিস্টেম।'
            : 'Advanced GPS-denied autonomous rover control suite featuring live maps, YOLOv8 object detection, motor PID telemetry, and proactive obstacle avoidance.'}
        </p>

        {/* Key Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-md pt-2">
          {[
            { labelBn: 'ম্যাপ নেভিগেশন', labelEn: 'Map Navigation' },
            { labelBn: 'এআই অবজেক্ট এআই', labelEn: 'YOLOv8 AI' },
            { labelBn: 'মোটর টেলিমেট্রি', labelEn: 'Motor Telemetry' }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-indigo-500/20 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-300 font-bengali flex items-center justify-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>{isBn ? item.labelBn : item.labelEn}</span>
            </div>
          ))}
        </div>

        {/* Enter App Button */}
        <button
          onClick={handleStart}
          className="mt-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-base sm:text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 transition-all cursor-pointer flex items-center gap-3 font-bengali"
        >
          <span>{isBn ? 'মিশন শুরু করুন (Enter UGV Cockpit)' : 'Start Mission Cockpit'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Footer info */}
        <p className="text-[10px] text-slate-500 font-mono">
          SECURE AUTONOMOUS SYSTEM v3.4 • ALL SYSTEMS NOMINAL
        </p>
      </div>
    </div>
  );
};
