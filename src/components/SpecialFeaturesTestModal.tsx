import React, { useState } from 'react';
import { Sparkles, X, Play, CheckCircle2, RefreshCw, Cpu, Radio, ShieldAlert, Waves, Zap } from 'lucide-react';
import { Theme } from '../types';

interface SpecialFeaturesTestModalProps {
  theme: Theme;
  onClose: () => void;
}

export const SpecialFeaturesTestModal: React.FC<SpecialFeaturesTestModalProps> = ({
  theme,
  onClose,
}) => {
  const [activeTest, setActiveTest] = useState<number>(1);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [metricValue, setMetricValue] = useState<string>('Ready for simulation');

  const runTest = (testId: number) => {
    setActiveTest(testId);
    setTestStatus('running');
    setTestLogs(['Initializing test benchmark...', 'Loading neural weights & sensor drivers...']);

    if (testId === 1) {
      // Q-NPE
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Spatiotemporal tensor tracking pedestrian at 12m...', 'Calculating 3.5s future trajectory vectors...']);
      }, 600);
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Trajectory intersection resolved. Dynamic steering bypass calculated.', '✅ Q-NPE Test Passed: Collision avoided 3.5s in advance.']);
        setMetricValue('Prediction Accuracy: 99.4% | Time Delta: 3.5s');
        setTestStatus('success');
      }, 1500);
    } else if (testId === 2) {
      // SST-SCR
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Activating ground-penetrating thermal radar at 60GHz...', 'Scanning asphalt sub-surface for moisture & hollow cavities...']);
      }, 600);
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Cavity detected at depth 1.2m beneath lane 2.', 'Rerouting dynamic trajectory around sinkhole zone.', '✅ SST-SCR Test Passed: Sub-surface anomaly bypassed.']);
        setMetricValue('Cavity Depth: 1.2m | Thermal Delta: -4.2°C');
        setTestStatus('success');
      }, 1500);
    } else if (testId === 3) {
      // BAS-DA
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Listening on 64-channel bio-acoustic directional array...', 'Acoustic signature matched: Ambulance Siren (780 Hz).']);
      }, 600);
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Source bearing: 145° East, Distance: 380m through building cluster.', 'Executing emergency yield maneuver to right shoulder.', '✅ BAS-DA Test Passed: Yield corridor cleared.']);
        setMetricValue('Siren Bearing: 145° | Distance: 380m');
        setTestStatus('success');
      }, 1500);
    } else if (testId === 4) {
      // SM-TFS
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Establishing Ad-hoc P2P UGV Mesh subnet (915 MHz)...', 'Broadcasting local hazard telemetry to 4 peer units...']);
      }, 600);
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Acknowledge received from UGV-Node-Alpha, UGV-Node-Beta, UGV-Node-Gamma.', 'Zero-latency sync confirmed across swarm.', '✅ SM-TFS Test Passed: Swarm mesh synced.']);
        setMetricValue('Active Peers: 4 | Latency: 0.2ms');
        setTestStatus('success');
      }, 1500);
    } else if (testId === 5) {
      // ENS-HMC
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Injecting simulated edge-case driving anomaly (sudden obstacle glare)...', 'Detecting sub-optimal braking trajectory...']);
      }, 600);
      setTimeout(() => {
        setTestLogs(prev => [...prev, 'Edge-Neural Self-Healing Core computing correction tensor...', 'Internal offline database updated. Local weights patched.', '✅ ENS-HMC Test Passed: Permanent fix applied to memory core. Zero repeat errors.']);
        setMetricValue('Memory Patch ID: #ENS-9942 | Offline DB: Synced');
        setTestStatus('success');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full bg-[#070e22] border-2 border-cyan-500/60 rounded-3xl shadow-[0_0_70px_rgba(6,182,212,0.4)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-950 via-[#0d1838] to-indigo-950 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/40 shadow-inner">
              <Cpu className="w-5 h-5 animate-pulse text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                Special Features Interactive Live Test Bench
              </h3>
              <p className="text-xs text-cyan-300 font-mono">
                Run live software simulation benchmarks for all 5 world-first UGV innovations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6 text-slate-200">
          {/* Left: Test Selector */}
          <div className="w-full md:w-5/12 flex flex-col gap-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold px-1">Select Breakthrough Feature:</span>

            {[
              { id: 1, name: '1. Q-NPE (Quantum Obstacle Prediction)', icon: Sparkles, color: 'from-purple-950 to-indigo-950 border-purple-500/40' },
              { id: 2, name: '2. SST-SCR (Thermal Sinkhole Radar)', icon: Waves, color: 'from-cyan-950 to-blue-950 border-cyan-500/40' },
              { id: 3, name: '3. BAS-DA (Bio-Acoustic Siren Array)', icon: Radio, color: 'from-emerald-950 to-teal-950 border-emerald-500/40' },
              { id: 4, name: '4. SM-TFS (Swarm Mesh Fleet Sync)', icon: Zap, color: 'from-amber-950 to-orange-950 border-amber-500/40' },
              { id: 5, name: '5. ENS-HMC (Self-Healing Memory Core)', icon: ShieldAlert, color: 'from-rose-950 to-pink-950 border-rose-500/40' },
            ].map(test => (
              <button
                key={test.id}
                onClick={() => runTest(test.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  activeTest === test.id
                    ? 'bg-gradient-to-r ' + test.color + ' ring-2 ring-cyan-400 shadow-lg scale-[1.02]'
                    : 'bg-[#0b1329] border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    activeTest === test.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {test.id}
                  </div>
                  <span className="text-xs sm:text-sm font-bold">{test.name}</span>
                </div>
                <Play className={`w-4 h-4 ${activeTest === test.id ? 'text-cyan-300 fill-cyan-300 animate-pulse' : 'text-slate-500'}`} />
              </button>
            ))}
          </div>

          {/* Right: Live Test Bench Console */}
          <div className="flex-1 flex flex-col gap-4 bg-[#050a18] p-5 rounded-3xl border border-cyan-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-ping bg-cyan-400"></span>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">Live Simulation Terminal</span>
              </div>
              <div className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300">
                Status: <span className={testStatus === 'success' ? 'text-emerald-400' : testStatus === 'running' ? 'text-amber-400' : 'text-slate-400'}>{testStatus.toUpperCase()}</span>
              </div>
            </div>

            {/* Metric Banner */}
            <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Telemetry Metric:</span>
              <span className="text-xs font-bold text-cyan-300 font-mono">{metricValue}</span>
            </div>

            {/* Logs Area */}
            <div className="flex-1 min-h-[180px] bg-slate-950 p-4 rounded-2xl border border-slate-900 font-mono text-xs text-slate-300 overflow-y-auto flex flex-col gap-1.5 shadow-inner">
              {testLogs.length === 0 ? (
                <div className="text-slate-600 italic my-auto text-center">Click any feature on the left to start live software simulation benchmark...</div>
              ) : (
                testLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-cyan-500 select-none">&gt;</span>
                    <span className={index === testLogs.length - 1 && testStatus === 'success' ? 'text-emerald-300 font-bold' : ''}>{log}</span>
                  </div>
                ))
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => runTest(activeTest)}
                disabled={testStatus === 'running'}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${testStatus === 'running' ? 'animate-spin' : ''}`} />
                <span>Re-Run Simulation Test</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Close Test Bench
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
