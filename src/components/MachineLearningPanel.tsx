import React, { useState, useEffect } from 'react';
import { Cpu, Brain, Activity, Zap, Layers, BarChart3, RefreshCw, CheckCircle2, ShieldAlert, Sparkles, Sliders } from 'lucide-react';
import { Theme, PerceptionData, UgvPose } from '../types';

interface MachineLearningPanelProps {
  theme: Theme;
  perception: PerceptionData;
  pose: UgvPose;
  isRunning: boolean;
}

export const MachineLearningPanel: React.FC<MachineLearningPanelProps> = ({
  theme,
  perception,
  pose,
  isRunning
}) => {
  const [modelType, setModelType] = useState<'yolov8' | 'resnet50' | 'q_learning' | 'slam_nerf'>('yolov8');
  const [learningRate, setLearningRate] = useState<number>(0.001);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.85);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [epochCount, setEpochCount] = useState<number>(142);
  const [lossValue, setLossValue] = useState<number>(0.0342);
  const [accuracyValue, setAccuracyValue] = useState<number>(98.6);

  // Simulate slight fluctuation in real-time ML metrics when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setLossValue(prev => Number((Math.max(0.01, prev + (Math.random() - 0.5) * 0.004)).toFixed(4)));
      setAccuracyValue(prev => Number((Math.min(99.9, Math.max(95.0, prev + (Math.random() - 0.5) * 0.2))).toFixed(1)));
      setEpochCount(prev => prev + (Math.random() > 0.8 ? 1 : 0));
    }, 1500);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleRetrain = () => {
    setIsRetraining(true);
    setTimeout(() => {
      setIsRetraining(false);
      setEpochCount(prev => prev + 10);
      setLossValue(0.0215);
      setAccuracyValue(99.4);
    }, 1200);
  };

  return (
    <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col gap-4 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-cyan-300 flex items-center gap-2">
              <span>Machine Learning & Neural Network Inference</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time Object Detection, Sensor Fusion & Q-Learning
            </p>
          </div>
        </div>

        <button
          onClick={handleRetrain}
          disabled={isRetraining}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
          <span>{isRetraining ? 'Training...' : 'Retrain Weights'}</span>
        </button>
      </div>

      {/* Model Architecture Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'yolov8', nameEn: 'YOLOv8 Vision', icon: Cpu },
          { id: 'resnet50', nameEn: 'ResNet50 Terrain', icon: Layers },
          { id: 'q_learning', nameEn: 'Q-Learning Path', icon: Sparkles },
          { id: 'slam_nerf', nameEn: 'Neural NeRF SLAM', icon: Activity }
        ].map(item => {
          const Icon = item.icon;
          const active = modelType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setModelType(item.id as any)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                active
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] text-cyan-200 font-black'
                  : 'bg-slate-900/60 border-indigo-500/20 text-slate-300 hover:border-indigo-400/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-mono">{active ? 'ON' : ''}</span>
              </div>
              <span className="text-xs font-bold leading-tight">{item.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* Real-time ML Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-indigo-500/20">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-mono">Inference Latency</span>
          <span className="text-base font-black text-cyan-300 font-mono">{perception.inferenceLatencyMs} ms</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-mono">Model Accuracy</span>
          <span className="text-base font-black text-emerald-400 font-mono">{accuracyValue}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-mono">Loss Value</span>
          <span className="text-base font-black text-amber-300 font-mono">{lossValue}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-mono">Training Epoch</span>
          <span className="text-base font-black text-indigo-300 font-mono">#{epochCount}</span>
        </div>
      </div>

      {/* Detected Objects & Tensor Weights Viewer */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Real-time Neural Detection Stream</span>
          </h4>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {perception.detectedEntities.length} Objects Tracked
          </span>
        </div>

        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
          {perception.detectedEntities.map(entity => (
            <div
              key={entity.id}
              className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-indigo-500/20 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  entity.dangerLevel === 'CRITICAL' ? 'bg-rose-500 animate-ping' : entity.dangerLevel === 'CAUTION' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></span>
                <span className="font-bold text-white uppercase">{entity.type}</span>
                <span className="text-[10px] text-slate-400 font-mono">({entity.distance}m, {entity.angle > 0 ? `+${entity.angle}°` : `${entity.angle}°`})</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-cyan-300 font-bold">{Math.round(entity.confidence * 100)}% Conf</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  entity.dangerLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {entity.dangerLevel}
                </span>
              </div>
            </div>
          ))}
          {perception.detectedEntities.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-500">
              No obstacles detected in view sector
            </div>
          )}
        </div>
      </div>

      {/* Interactive ML Hyperparameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-indigo-500/20">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-bold">Learning Rate</span>
            <span className="font-mono text-cyan-300">{learningRate}</span>
          </div>
          <input
            type="range"
            min="0.0001"
            max="0.01"
            step="0.0001"
            value={learningRate}
            onChange={(e) => setLearningRate(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-bold">Confidence Threshold</span>
            <span className="font-mono text-cyan-300">{Math.round(confidenceThreshold * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
