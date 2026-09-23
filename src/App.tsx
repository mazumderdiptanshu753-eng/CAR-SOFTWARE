import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Navbar } from './components/Navbar';
import { GoogleMapsNavigator } from './components/GoogleMapsNavigator';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SpecialFeaturesTestModal } from './components/SpecialFeaturesTestModal';
import { Language, Theme } from './types';
import { RefreshCw, AlertTriangle, Sparkles, X, Play } from 'lucide-react';

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
  const [showRdModal, setShowRdModal] = useState<boolean>(false);
  const [showTestBenchModal, setShowTestBenchModal] = useState<boolean>(false);

  // Listen to Google Maps Demo Key quota notification and open-special-features event
  useEffect(() => {
    const handleQuota = () => setGmpQuotaReached(true);
    const handleOpenSpecial = () => setShowRdModal(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    window.addEventListener('open-special-features', handleOpenSpecial);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuota);
      window.removeEventListener('open-special-features', handleOpenSpecial);
    };
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

  const isLight = theme === 'light';

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden ${isLight ? 'bg-slate-100 text-slate-900' : isCarDisplayMode ? 'bg-[#02040a] p-2 sm:p-4 text-slate-100' : 'bg-[#040812] text-slate-100'}`}>
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
            ? isLight
              ? 'max-w-[1620px] rounded-[2rem] sm:rounded-[2.5rem] border-[4px] sm:border-[6px] border-slate-300 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden my-auto'
              : 'max-w-[1620px] rounded-[2rem] sm:rounded-[2.5rem] border-[4px] sm:border-[6px] border-slate-700/80 bg-[#070d1d] shadow-[0_0_60px_rgba(0,0,0,0.95),inset_0_2px_15px_rgba(255,255,255,0.08)] overflow-hidden my-auto'
            : 'max-w-[1700px]'
        }`}>
          {/* Car Dashboard Status Bar (Gear P-R-N-D, Speed, Climate, Battery) */}
          <div className={`${isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-950/90 border-slate-800/80 text-slate-100'} border-b px-4 py-2 flex items-center justify-between text-xs font-mono`}>
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
            onOpenRdModal={() => setShowRdModal(true)}
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

        {/* World-First Non-Humanoid UGV R&D Breakthrough Features Modal (Root Level z-[9999]) */}
        {showRdModal && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[#080f25] border-2 border-purple-500/60 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.4)] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-950 via-[#131b3b] to-indigo-950 border-b border-purple-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/40 shadow-inner">
                    <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      {'World-First Non-Humanoid UGV R&D Innovations'}
                    </h3>
                    <p className="text-xs text-purple-300 font-mono">
                      {'Breakthrough features never before seen in commercial autonomous vehicles'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRdModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-slate-200">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center shrink-0 border border-purple-400/30">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Quantum Neural Obstacle Prediction Engine (Q-NPE)</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Unlike standard vehicles that react to obstacles upon impact or proximity, Q-NPE uses predictive spatio-temporal neural tensors to calculate the exact future trajectory of stray animals and pedestrians 3.5 seconds before they cross the path.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-600/30 text-cyan-300 font-bold flex items-center justify-center shrink-0 border border-cyan-400/30">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Sub-Surface Thermal Sinkhole & Cavity Radar (SST-SCR)</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Equipped with real-time ground-penetrating thermal radar that scans underground pipe bursts, hollow soil pockets, and sinkholes beneath the asphalt before the vehicle's wheels roll over them, executing instant dynamic routing.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Bio-Acoustic Siren Directional Array (BAS-DA)</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Ultra-sensitive directional acoustic microphone array that hears incoming emergency vehicle sirens (ambulances, fire engines) from 500 meters away through surrounding buildings and automatically pulls over to yield.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-orange-950/60 border border-amber-500/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-600/30 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-400/30">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Swarm Mesh Telepathic Fleet Sync (SM-TFS)</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Ad-hoc peer-to-peer UGV mesh networking that instantly shares real-time road obstacles, traffic jams, and hazard telemetry across all nearby autonomous units with zero cellular or cloud latency.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/60 to-pink-950/60 border border-rose-500/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-600/30 text-rose-300 font-bold flex items-center justify-center shrink-0 border border-rose-400/30">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Autonomous Edge-Neural Self-Healing Memory Core (ENS-HMC)</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Powered by an offline, non-cloud intelligent car brain. If the UGV encounters an unexpected anomaly or makes a sub-optimal driving maneuver, ENS-HMC instantly computes a corrective protocol and permanently patches its local neural weights to prevent identical errors from ever recurring.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[#050a18] border-t border-purple-500/30 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowRdModal(false);
                    setShowTestBenchModal(true);
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>🚀 Launch Live Test Bench</span>
                </button>

                <button
                  onClick={() => setShowRdModal(false)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {'Close R&D Console'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Special Features Live Test Bench Modal */}
        {showTestBenchModal && (
          <SpecialFeaturesTestModal
            theme={theme}
            onClose={() => setShowTestBenchModal(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
