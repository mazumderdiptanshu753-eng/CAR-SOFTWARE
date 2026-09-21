import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Navbar } from './components/Navbar';
import { GoogleMapsNavigator } from './components/GoogleMapsNavigator';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Language, Theme } from './types';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 font-sans">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Failed to load application</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred. Please refresh and try again.'}
            </p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [autoStopActive, setAutoStopActive] = useState<boolean>(false);
  const [gmpQuotaReached, setGmpQuotaReached] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [isCarDisplayMode, setIsCarDisplayMode] = useState<boolean>(true);

  // Listen to Google Maps Demo Key quota notification
  useEffect(() => {
    const handleQuota = () => setGmpQuotaReached(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const handleTogglePlay = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(true);
    setAutoStopActive(false);
  };

  const handleEmergencyStop = () => {
    setIsRunning(false);
    setAutoStopActive(true);
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden ${isCarDisplayMode ? 'bg-[#02040a] p-2 sm:p-4' : 'bg-[#040812]'} text-slate-100`}>
        {/* Dynamic Welcome Screen */}
        {showWelcome && (
          <WelcomeScreen
            theme={theme}
            onEnterApp={() => setShowWelcome(false)}
          />
        )}

        {/* Ambient Color Glow Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/12 rounded-full blur-3xl"></div>
        </div>

        {/* Google Maps Quota Warning Banner */}
        {gmpQuotaReached && (
          <div className="relative z-50 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow-lg">
            <span>⚠️ Maps Quota exceeded. Please check config.</span>
            <button
              onClick={() => setGmpQuotaReached(false)}
              className="px-2 py-0.5 rounded bg-black/20 hover:bg-black/30 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Car Infotainment Console Bezel Wrapper when enabled */}
        <div className={`w-full mx-auto flex flex-col relative z-10 transition-all duration-300 ${
          isCarDisplayMode
            ? 'max-w-[1620px] rounded-[2rem] sm:rounded-[2.5rem] border-[4px] sm:border-[6px] border-slate-700/80 bg-[#070d1d] shadow-[0_0_60px_rgba(0,0,0,0.95),inset_0_2px_15px_rgba(255,255,255,0.08)] overflow-hidden my-auto'
            : 'max-w-[1700px]'
        }`}>
          {/* Car Dashboard Status Bar (Gear P-R-N-D, Speed, Climate, Battery) */}
          <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs font-mono">
            {/* Gear Shifter & Drive Mode */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] hidden sm:inline">Gear:</span>
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500">P</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500">R</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500">N</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.6)]">D</span>
              </div>
              <span className="hidden md:inline px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                ⚡ FSD Autopilot Active
              </span>
            </div>

            {/* Vehicle Telemetry Summary */}
            <div className="flex items-center gap-3 sm:gap-6 text-slate-300 font-bold text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">SPEED:</span>
                <span className="text-cyan-300 font-black">{isRunning ? '48.5' : '0.0'} km/h</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">BATT:</span>
                <span className="text-emerald-400 font-bold">94% (48V)</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">CABIN:</span>
                <span className="text-amber-300 font-bold">22.5°C ❄️</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">TIME:</span>
                <span className="text-slate-200">12:45 PM</span>
              </div>
            </div>
          </div>

          {/* Primary Top Header / Navbar */}
          <Navbar
            theme={theme}
            onToggleTheme={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
            isCarDisplayMode={isCarDisplayMode}
            onToggleCarDisplay={() => setIsCarDisplayMode(prev => !prev)}
            missionStatus={isRunning ? 'ACTIVE' : 'HALTED'}
            onTogglePlay={handleTogglePlay}
            onReset={handleReset}
            isRunning={isRunning}
            autoStopTriggered={autoStopActive}
          />

          {/* Main GPS Autonomous Navigation Suite */}
          <main className="relative z-10 flex-1 w-full mx-auto p-2 sm:p-3 flex flex-col gap-2">
            <GoogleMapsNavigator
              theme={theme}
              onEmergencyStop={handleEmergencyStop}
              onAutoStopStateChange={setAutoStopActive}
            />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
