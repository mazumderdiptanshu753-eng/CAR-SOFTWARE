import React, { useRef, useEffect, useState } from 'react';
import { PerceptionData, Language, Theme } from '../types';
import { translations } from '../data/translations';
import { Eye, Camera, Activity, AlertTriangle, Layers, Video } from 'lucide-react';

interface CameraPerceptionViewProps {
  perception: PerceptionData;
  language: Language;
  steeringState: string;
  theme?: Theme;
}

export const CameraPerceptionView: React.FC<CameraPerceptionViewProps> = ({
  perception,
  language,
  steeringState,
  theme = 'light'
}) => {
  const t = translations[language];
  const isLight = theme === 'light';
  const [viewMode, setViewMode] = useState<'ai' | 'depth' | 'features' | 'raw'>('ai');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Toggle user's actual laptop webcam if desired
  const toggleWebcam = async () => {
    if (isWebcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsWebcamActive(true);
      } catch (err) {
        console.warn('Webcam access was denied or not available:', err);
      }
    }
  };

  // Render Synthetic or Augmented Camera HUD on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // If webcam active, draw webcam frame first
    if (isWebcamActive && videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, w, h);
    } else {
      // Draw Procedural Outdoor Camera View
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      if (perception.lightingCondition === 'dusk') {
        skyGrad.addColorStop(0, '#2e1065');
        skyGrad.addColorStop(1, '#ea580c');
      } else if (perception.lightingCondition === 'shadow') {
        skyGrad.addColorStop(0, '#334155');
        skyGrad.addColorStop(1, '#64748b');
      } else {
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.45);

      // Distant mountains / horizon
      ctx.fillStyle = perception.lightingCondition === 'dusk' ? '#3b0764' : '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.45);
      ctx.lineTo(w * 0.25, h * 0.36);
      ctx.lineTo(w * 0.5, h * 0.42);
      ctx.lineTo(w * 0.75, h * 0.34);
      ctx.lineTo(w, h * 0.45);
      ctx.lineTo(w, h * 0.45);
      ctx.lineTo(0, h * 0.45);
      ctx.fill();

      // Ground / Rough terrain
      const groundGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
      groundGrad.addColorStop(0, '#453223');
      groundGrad.addColorStop(1, '#2c1e13');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      // Perspective Drivable Trail / Corridor (Perspective trapezoid)
      const pathGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
      pathGrad.addColorStop(0, '#785b40');
      pathGrad.addColorStop(1, '#573d26');
      ctx.fillStyle = pathGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.45);
      ctx.lineTo(w * 0.58, h * 0.45);
      ctx.lineTo(w * 0.88, h);
      ctx.lineTo(w * 0.12, h);
      ctx.closePath();
      ctx.fill();

      // Gravel & Texture dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let i = 0; i < 30; i++) {
        const gx = ((Math.sin(i * 99) + 1) / 2) * w;
        const gy = h * 0.48 + ((Math.cos(i * 47) + 1) / 2) * (h * 0.5);
        ctx.fillRect(gx, gy, 3, 2);
      }
    }

    // Depth Map Mode filter
    if (viewMode === 'depth') {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const yPos = Math.floor((i / 4) / w);
        // depth gradient: near = bright orange/red, far = dark violet
        const depthFactor = Math.max(0, Math.min(1, (yPos - h * 0.45) / (h * 0.55)));
        data[i] = Math.round(depthFactor * 255); // R
        data[i + 1] = Math.round((1 - Math.abs(depthFactor - 0.5) * 2) * 200); // G
        data[i + 2] = Math.round((1 - depthFactor) * 220); // B
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Drivable Corridor AI Segmentation Mask (Green polygon overlay)
    if (viewMode === 'ai' || viewMode === 'raw') {
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.43, h * 0.46);
      ctx.lineTo(w * 0.57, h * 0.46);
      ctx.lineTo(w * 0.84, h * 0.96);
      ctx.lineTo(w * 0.16, h * 0.96);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Central Path Guidance vector line
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.46);
      ctx.lineTo(w * 0.5, h * 0.96);
      ctx.stroke();
      ctx.restore();
    }

    // AI Object Detection Bounding Boxes
    if (viewMode === 'ai') {
      perception.detectedEntities.forEach(entity => {
        const bx = entity.box.x * w;
        const by = entity.box.y * h;
        const bw = entity.box.w * w;
        const bh = entity.box.h * h;

        ctx.save();
        let boxColor = '#22c55e'; // Safe
        if (entity.dangerLevel === 'CRITICAL') boxColor = '#ef4444';
        else if (entity.dangerLevel === 'CAUTION') boxColor = '#f59e0b';

        // Bounding Box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner accents
        const cornerLen = Math.min(10, bw * 0.25);
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        // Bottom-right
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Label Tag
        const labelText = `${entity.type.toUpperCase()}: ${entity.distance}m [${Math.round(entity.confidence * 100)}%]`;
        ctx.font = 'bold 11px sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = boxColor;
        ctx.fillRect(bx, by - 18, textWidth + 8, 18);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(labelText, bx + 4, by - 5);

        ctx.restore();
      });
    }

    // Optical Flow & FAST / ORB Keypoint tracking features
    if (viewMode === 'features' || viewMode === 'ai') {
      ctx.save();
      perception.featurePoints.forEach(fp => {
        const fx = fp.x * w;
        const fy = fp.y * h;

        // Keypoint dot
        ctx.fillStyle = fp.isCorner ? '#38bdf8' : '#facc15';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Flow motion vector line
        if (viewMode === 'features') {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + fp.u, fy + fp.v);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // Artificial Horizon Pitch/Roll Bar
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.45 + perception.horizonTilt);
    ctx.lineTo(w * 0.55, h * 0.45 - perception.horizonTilt);
    ctx.stroke();
    ctx.restore();

  }, [perception, viewMode, isWebcamActive]);

  return (
    <div className={`rounded-xl border p-3 shadow-xs flex flex-col gap-2.5 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100 shadow-md'
    }`}>
      {/* Header with Camera HUD status */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-2">
          <Camera className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
          <h3 className={`font-semibold text-sm font-bengali ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            {t.cameraHudTitle}
          </h3>
          <span className={`text-2xs font-mono px-2 py-0.5 rounded border ${
            isLight
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : 'bg-sky-950/80 border-sky-800 text-sky-300'
          }`}>
            {perception.fps} FPS | {perception.inferenceLatencyMs}ms
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className={`flex items-center gap-1 p-1 rounded-lg border text-2xs font-mono ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            id="viewmode-ai"
            onClick={() => setViewMode('ai')}
            className={`px-2 py-0.5 rounded transition-colors ${
              viewMode === 'ai'
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Mask
          </button>
          <button
            id="viewmode-depth"
            onClick={() => setViewMode('depth')}
            className={`px-2 py-0.5 rounded transition-colors ${
              viewMode === 'depth'
                ? 'bg-purple-600 text-white font-semibold shadow-xs'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Depth
          </button>
          <button
            id="viewmode-features"
            onClick={() => setViewMode('features')}
            className={`px-2 py-0.5 rounded transition-colors ${
              viewMode === 'features'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FAST/Flow
          </button>
          <button
            id="viewmode-raw"
            onClick={() => setViewMode('raw')}
            className={`px-2 py-0.5 rounded transition-colors ${
              viewMode === 'raw'
                ? 'bg-slate-700 text-white font-semibold shadow-xs'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw
          </button>
        </div>
      </div>

      {/* Camera Canvas Display */}
      <div className={`relative w-full aspect-16/9 rounded-lg overflow-hidden border shadow-inner ${
        isLight ? 'bg-slate-900 border-slate-300' : 'bg-slate-950 border-slate-800'
      }`}>
        <canvas
          id="camera-perception-canvas"
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />

        {/* Hidden video element for live webcam feed */}
        <video ref={videoRef} className="hidden" playsInline muted />

        {/* HUD Crosshairs */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-sky-400/80 rounded-full" />
          </div>
        </div>

        {/* Top-left Telemetry Overlay */}
        <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-xs border border-slate-700 rounded px-2 py-1 text-2xs font-mono text-slate-300 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI: FastSCNN + YOLO-Nano</span>
          </div>
          <div className="text-emerald-400">
            Drivable Path: {perception.drivableConfidence}%
          </div>
        </div>

        {/* Top-right Steering State */}
        <div className="absolute top-2 right-2 bg-slate-900/85 backdrop-blur-xs border border-slate-700 rounded px-2 py-1 text-2xs font-mono text-slate-300">
          <span className="text-slate-400">State: </span>
          <span className="text-amber-400 font-bold">{steeringState}</span>
        </div>

        {/* Bottom Depth Sector Bars (5 radar-like sectors) */}
        <div className="absolute bottom-2 inset-x-2 bg-slate-900/90 backdrop-blur-xs border border-slate-800 rounded px-2 py-1.5 flex items-center justify-between gap-1 text-2xs font-mono">
          <span className="text-slate-400 hidden sm:inline">Depth Sectors:</span>
          <div className="flex-1 flex items-center gap-1">
            {perception.depthEstimate.map((val, idx) => {
              const labels = ['Far-L', 'Mid-L', 'Center', 'Mid-R', 'Far-R'];
              let barColor = 'bg-emerald-500';
              if (val < 3.5) barColor = 'bg-rose-500';
              else if (val < 7.0) barColor = 'bg-amber-500';

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor}`}
                      style={{ width: `${Math.min(100, (val / 15) * 100)}%` }}
                    />
                  </div>
                  <span className="text-3xs text-slate-400">{labels[idx]}: {val}m</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer bar with Webcam toggle */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className={`flex items-center gap-1.5 font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <Eye className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          <span>{'Eye Module: Visual Perception Feed'}</span>
        </div>

        <button
          id="btn-toggle-webcam"
          onClick={toggleWebcam}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-medium transition-colors border ${
            isWebcamActive
              ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
              : isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
        >
          <Video className="w-3 h-3" />
          <span>{isWebcamActive ? t.webcamActive : t.useWebcam}</span>
        </button>
      </div>
    </div>
  );
};
