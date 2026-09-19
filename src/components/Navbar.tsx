import React from 'react';
import { ShieldCheck, Cpu, Globe, Play, Pause, RotateCcw, Zap, Sun, Moon, Navigation, AlertTriangle, Smartphone, Monitor } from 'lucide-react';
import { Language, Theme } from '../types';

interface NavbarProps {
  language: Language;
  onToggleLanguage: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  isMobileView?: boolean;
  onToggleMobileView?: () => void;
  missionStatus: string;
  onTogglePlay: () => void;
  onReset: () => void;
  isRunning: boolean;
  autoStopTriggered?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  isMobileView,
  onToggleMobileView,
  missionStatus,
  onTogglePlay,
  onReset,
  isRunning,
  autoStopTriggered
}) => {
  const isLight = theme === 'light';

  return (
    <header className={`${
      isLight
        ? 'bg-gradient-to-r from-white via-indigo-50/90 to-cyan-50/90 border-indigo-200/80 text-slate-800 shadow-[0_4px_20px_rgba(99,102,241,0.12)]'
        : 'bg-gradient-to-r from-[#0b1329] via-[#14123b] to-[#0c1a30] border-indigo-500/40 text-slate-100 shadow-[0_4px_30px_rgba(79,70,229,0.25)]'
    } border-b sticky top-0 z-40 backdrop-blur-md transition-colors`}>
      {/* Ultra-Compact 3D Command Deck Header */}
      <div className="max-w-[1700px] mx-auto px-3 py-2 flex items-center justify-between gap-2.5">
        {/* Brand and System Identity with Iridescent 3D Bevel Badge */}
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
            autoStopTriggered
              ? 'bg-gradient-to-b from-rose-500 via-red-600 to-rose-700 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse'
              : 'bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-500 border-teal-300 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.6)]'
          }`}>
            {autoStopTriggered ? <AlertTriangle className="w-4.5 h-4.5" /> : <Navigation className="w-4.5 h-4.5 fill-slate-950" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-black text-sm sm:text-base tracking-normal font-bengali flex items-center gap-1.5 ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                <span className={isLight ? 'text-slate-950 font-black' : 'text-cyan-300 font-black'}>
                  {language === 'bn' ? 'ইউজিভি ৩ডি অটোনোমাস ককপিট' : 'UGV 3D Autonomous Cockpit'}
                </span>
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 border border-amber-500 shadow-sm">
                  3D HUD
                </span>
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm flex items-center gap-1.5 ${
                autoStopTriggered
                  ? isLight
                    ? 'bg-rose-100 text-rose-900 border-rose-400 animate-pulse font-black'
                    : 'bg-rose-500/30 text-rose-200 border-rose-400 animate-pulse font-black'
                  : isLight
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black'
                    : 'bg-emerald-500/25 text-emerald-200 border-emerald-400 font-black'
              }`}>
                <span className={`w-2 h-2 rounded-full ${autoStopTriggered ? 'bg-rose-600 animate-ping' : 'bg-emerald-500 animate-ping'}`}></span>
                <span className="font-bengali">
                  {autoStopTriggered
                    ? (language === 'bn' ? 'জরুরি স্টপ!' : 'AUTO STOP')
                    : (language === 'bn' ? 'জিপিএস লাইভ' : 'GPS Live')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Compact Right Controls with Vibrant Colorful Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Phone Frame View Toggle */}
          {onToggleMobileView && (
            <button
              onClick={onToggleMobileView}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                isMobileView
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_2px_0_#0e7490]'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isMobileView ? 'Switch to Fullscreen' : 'Switch to Mobile Frame'}
            >
              {isMobileView ? <Smartphone className="w-4 h-4 text-cyan-200" /> : <Monitor className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">{isMobileView ? 'Mobile' : 'Full'}</span>
            </button>
          )}

          {/* Theme Toggle Button with High Contrast 3D Button */}
          <button
            id="btn-theme-toggle"
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
              isLight
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500 shadow-[0_2px_0_#b45309] active:translate-y-0.5 active:shadow-none'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-[0_2px_0_#9a3412] active:translate-y-0.5 active:shadow-none'
            }`}
            title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {isLight ? <Sun className="w-4 h-4 text-slate-950" /> : <Moon className="w-4 h-4 text-slate-950" />}
            <span className="hidden sm:inline text-xs font-black">{isLight ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Language Switcher with High Contrast */}
          <button
            id="btn-language-toggle"
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black bg-purple-700 hover:bg-purple-600 text-white border-purple-400 shadow-[0_2px_0_#3b0764] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-white" />
            <span className="text-xs font-mono font-black">{language === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
