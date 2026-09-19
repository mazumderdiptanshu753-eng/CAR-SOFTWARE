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
            <h2 className="text-lg font-bold">অ্যাপ লোড হতে সমস্যা হয়েছে</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে। রিফ্রেশ করে আবার চেষ্টা করুন।'}
            </p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>পুনরায় লোড করুন (Reload)</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [autoStopActive, setAutoStopActive] = useState<boolean>(false);
  const [gmpQuotaReached, setGmpQuotaReached] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

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
      <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden bg-[#040812] text-slate-100">
        {/* Dynamic Welcome Screen */}
        {showWelcome && (
          <WelcomeScreen
            language={language}
            theme={theme}
            onEnterApp={() => setShowWelcome(false)}
            onToggleLanguage={() => setLanguage(prev => (prev === 'bn' ? 'en' : 'bn'))}
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

        {/* Primary Top Header / Navbar */}
        <Navbar
          language={language}
          onToggleLanguage={() => setLanguage(prev => (prev === 'bn' ? 'en' : 'bn'))}
          theme={theme}
          onToggleTheme={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
          missionStatus={isRunning ? 'ACTIVE' : 'HALTED'}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
          isRunning={isRunning}
          autoStopTriggered={autoStopActive}
        />

        {/* Main GPS Autonomous Navigation Suite */}
        <main className="relative z-10 flex-1 max-w-[1700px] w-full mx-auto p-2 sm:p-2.5 flex flex-col gap-2">
          <GoogleMapsNavigator
            language={language}
            theme={theme}
            onEmergencyStop={handleEmergencyStop}
            onAutoStopStateChange={setAutoStopActive}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
}
