import React, { useRef, useEffect } from 'react';
import { UgvPose, SlamPose, Obstacle, Waypoint, Language, TerrainPreset } from '../types';
import { translations } from '../data/translations';
import { PlusCircle, Trash2, Crosshair, Sparkles, Navigation, Sun, CloudRain, Moon, Shield } from 'lucide-react';

interface SimulationViewportProps {
  pose: UgvPose;
  slamPose: SlamPose;
  goal: Waypoint;
  obstacles: Obstacle[];
  trajectory: { x: number; y: number }[];
  slamTrajectory: { x: number; y: number }[];
  language: Language;
  terrain: TerrainPreset;
  onAddObstacleAt: (x: number, y: number) => void;
  onDropSuddenObstacle: () => void;
  onClearObstacles: () => void;
  lighting: 'sunny' | 'shadow' | 'dusk' | 'glare';
  onSelectLighting: (mode: 'sunny' | 'shadow' | 'dusk' | 'glare') => void;
  reroutingActive: boolean;
  theme?: 'light' | 'dark';
}

export const SimulationViewport: React.FC<SimulationViewportProps> = ({
  pose,
  slamPose,
  goal,
  obstacles,
  trajectory,
  slamTrajectory,
  language,
  terrain,
  onAddObstacleAt,
  onDropSuddenObstacle,
  onClearObstacles,
  lighting,
  onSelectLighting,
  reroutingActive,
  theme = 'light'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const t = translations[language];
  const isLight = theme === 'light';

  // Draw 2D canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background with terrain ground color
    ctx.fillStyle = terrain.groundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw natural terrain dirt trail (Point A to Point B)
    ctx.save();
    ctx.strokeStyle = terrain.pathColor;
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo((10 / 100) * width, (50 / 100) * height);
    ctx.bezierCurveTo(
      (35 / 100) * width,
      (40 / 100) * height,
      (65 / 100) * width,
      (62 / 100) * height,
      (90 / 100) * width,
      (50 / 100) * height
    );
    ctx.stroke();

    // Subtle tire track lines on trail
    ctx.strokeStyle = '#22283133';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Draw Grid Coordinates (representing real metric meters 0 - 100m)
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += height / 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Draw Lighting Atmosphere tint
    if (lighting === 'shadow') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.fillRect(0, 0, width, height);
    } else if (lighting === 'dusk') {
      ctx.fillStyle = 'rgba(67, 24, 75, 0.25)';
      ctx.fillRect(0, 0, width, height);
    } else if (lighting === 'glare') {
      const grad = ctx.createRadialGradient(width * 0.8, height * 0.2, 10, width * 0.8, height * 0.2, width);
      grad.addColorStop(0, 'rgba(255, 255, 240, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // Helper: world coords (0-100) to canvas pixels
    const toPx = (wx: number, wy: number) => ({
      x: (wx / 100) * width,
      y: (wy / 100) * height
    });

    // Draw Start Point A
    const startPx = toPx(10, 50);
    ctx.save();
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(startPx.x, startPx.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText("Point 'A'", startPx.x - 22, startPx.y - 12);
    ctx.restore();

    // Draw Goal Point B
    const goalPx = toPx(goal.x, goal.y);
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(goalPx.x, goalPx.y, 10, 0, Math.PI * 2);
    ctx.fill();
    // Pulse ring around goal
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(goalPx.x, goalPx.y, 16 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText("Point 'B' (Goal)", goalPx.x - 30, goalPx.y - 16);
    ctx.restore();

    // Draw Obstacles
    obstacles.forEach(obs => {
      const pos = toPx(obs.x, obs.y);
      const r = (obs.radius / 100) * width;

      ctx.save();
      if (obs.type === 'rock') {
        // Boulder
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Texture shading
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(pos.x + r * 0.3, pos.y + r * 0.3, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'ditch') {
        // Hazardous Ditch / Pit (Negative obstacle)
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Warning inner ring
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (obs.type === 'tree') {
        // Tree trunk with canopy
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'bush') {
        // Foliage / Bush
        ctx.fillStyle = '#166534';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (obs.type === 'mud') {
        // Mud patch
        ctx.fillStyle = 'rgba(84, 52, 29, 0.85)';
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, r * 1.2, r * 0.8, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Label
      ctx.setLineDash([]);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px sans-serif';
      ctx.fillText(obs.label.split(' ')[0], pos.x - r, pos.y + r + 11);
      ctx.restore();
    });

    // Draw Ground Truth Trajectory (Solid Green Line)
    if (trajectory.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const p0 = toPx(trajectory[0].x, trajectory[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < trajectory.length; i++) {
        const p = toPx(trajectory[i].x, trajectory[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw Visual SLAM Estimated Trajectory (Dashed Cyan Line showing VO Odometry)
    if (slamTrajectory.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const s0 = toPx(slamTrajectory[0].x, slamTrajectory[0].y);
      ctx.moveTo(s0.x, s0.y);
      for (let i = 1; i < slamTrajectory.length; i++) {
        const sp = toPx(slamTrajectory[i].x, slamTrajectory[i].y);
        ctx.lineTo(sp.x, sp.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw Planned Global Route (Direct A* baseline to goal)
    ctx.save();
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    const currPx = toPx(pose.x, pose.y);
    ctx.moveTo(currPx.x, currPx.y);
    ctx.lineTo(goalPx.x, goalPx.y);
    ctx.stroke();
    ctx.restore();

    // Draw Dynamic Avoidance Vector when rerouting
    if (reroutingActive) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(currPx.x, currPx.y);
      const lookaheadX = currPx.x + Math.cos(pose.theta) * 35;
      const lookaheadY = currPx.y + Math.sin(pose.theta) * 35;
      ctx.lineTo(lookaheadX, lookaheadY);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Camera Visual Sensor Frustum Cone (Forward Vision Field of View)
    ctx.save();
    const coneRadius = (16 / 100) * width; // 16m vision range
    const halfFov = 0.65; // ~37 degrees each side
    ctx.beginPath();
    ctx.moveTo(currPx.x, currPx.y);
    ctx.arc(currPx.x, currPx.y, coneRadius, pose.theta - halfFov, pose.theta + halfFov);
    ctx.closePath();
    const coneGrad = ctx.createRadialGradient(currPx.x, currPx.y, 5, currPx.x, currPx.y, coneRadius);
    coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    coneGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.08)');
    coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = coneGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw SLAM Ghost Pose with Uncertainty Covariance Ellipse
    const slamPx = toPx(slamPose.x, slamPose.y);
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    const covR = (slamPose.covarianceRadius / 100) * width * 4;
    ctx.arc(slamPx.x, slamPx.y, Math.max(10, covR), 0, Math.PI * 2);
    ctx.stroke();

    // SLAM ghost center point
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(slamPx.x, slamPx.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Actual Ground Truth UGV Vehicle Body
    ctx.save();
    ctx.translate(currPx.x, currPx.y);
    ctx.rotate(pose.theta);

    // Chassis dimensions in pixels
    const uWidth = 24;
    const uLength = 34;

    // 4 Wheels
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    // Front-Left
    ctx.fillRect(uLength * 0.15, -uWidth * 0.75, 10, 5);
    ctx.strokeRect(uLength * 0.15, -uWidth * 0.75, 10, 5);
    // Front-Right
    ctx.fillRect(uLength * 0.15, uWidth * 0.55, 10, 5);
    ctx.strokeRect(uLength * 0.15, uWidth * 0.55, 10, 5);
    // Rear-Left
    ctx.fillRect(-uLength * 0.45, -uWidth * 0.75, 10, 5);
    ctx.strokeRect(-uLength * 0.45, -uWidth * 0.75, 10, 5);
    // Rear-Right
    ctx.fillRect(-uLength * 0.45, uWidth * 0.55, 10, 5);
    ctx.strokeRect(-uLength * 0.45, uWidth * 0.55, 10, 5);

    // Main Chassis
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-uLength / 2, -uWidth / 2, uLength, uWidth, 4);
    ctx.fill();
    ctx.stroke();

    // Electronics & Heat Sink plate
    ctx.fillStyle = '#334155';
    ctx.fillRect(-uLength * 0.3, -uWidth * 0.35, uLength * 0.4, uWidth * 0.7);

    // Camera Sensor Mount (Forward nose)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(uLength * 0.4, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Lens aperture
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(uLength * 0.45, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Heading arrow on chassis
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(uLength * 0.35, 0);
    ctx.stroke();

    ctx.restore();

  }, [pose, slamPose, goal, obstacles, trajectory, slamTrajectory, terrain, lighting, reroutingActive, isLight]);

  // Click to drop obstacle
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    onAddObstacleAt(clickX, clickY);
  };

  return (
    <div className={`rounded-xl border p-3 shadow-xs flex flex-col gap-3 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100 shadow-md'
    }`}>
      {/* Viewport Header with Legend & Quick Tools */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-2">
          <Navigation className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          <h2 className={`font-semibold text-sm font-bengali ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            {language === 'bn' ? 'আউটডোর ট্রেইল ম্যাপ ও এসএলএএম ভিউ' : 'Outdoor Trail Map & SLAM Trajectory'}
          </h2>
          <span className={`text-xs font-mono hidden sm:inline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            (100m × 100m Sector)
          </span>
        </div>

        {/* Legend */}
        <div className={`flex items-center flex-wrap gap-3 text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Ground Truth</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-cyan-300 inline-block" />
            <span>Visual SLAM (VO)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Obstacle</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className={`relative w-full aspect-16/9 rounded-lg overflow-hidden border shadow-inner group ${
        isLight ? 'bg-stone-100 border-slate-300' : 'bg-slate-950 border-slate-800'
      }`}>
        <canvas
          id="simulation-canvas"
          ref={canvasRef}
          width={880}
          height={495}
          onClick={handleCanvasClick}
          className="w-full h-full object-cover cursor-crosshair"
          title="Click to place a boulder / obstacle anywhere on the trail"
        />

        {/* Overlaid Hint Badge */}
        <div className={`absolute top-2 left-2 pointer-events-none backdrop-blur-xs border rounded px-2 py-1 text-2xs font-mono flex items-center gap-1 ${
          isLight
            ? 'bg-white/85 border-slate-300 text-slate-700 shadow-xs'
            : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
        }`}>
          <Crosshair className={`w-3 h-3 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
          <span>Click anywhere to place rock / obstacle</span>
        </div>

        {/* Rerouting active alert */}
        {reroutingActive && (
          <div className="absolute top-2 right-2 bg-amber-600 border border-amber-400 rounded px-2.5 py-1 text-xs text-white font-bengali font-semibold flex items-center gap-1.5 animate-pulse shadow-md">
            <Shield className="w-3.5 h-3.5 text-white" />
            <span>{t.statusRerouting}</span>
          </div>
        )}

        {/* Metric Overlay Bottom Right */}
        <div className={`absolute bottom-2 right-2 border rounded px-2.5 py-1 text-2xs font-mono space-y-0.5 ${
          isLight
            ? 'bg-white/90 border-slate-300 text-slate-700 shadow-xs'
            : 'bg-slate-900/90 border-slate-700 text-slate-300'
        }`}>
          <div>UGV Pose: X:{pose.x.toFixed(1)}m | Y:{pose.y.toFixed(1)}m | θ:{(pose.theta * 57.3).toFixed(0)}°</div>
          <div className={isLight ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}>SLAM Est: X:{slamPose.x.toFixed(1)}m | Y:{slamPose.y.toFixed(1)}m | Drift: {slamPose.driftError}m</div>
        </div>
      </div>

      {/* Interactive Toolbar for Testing & Weather Conditions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        {/* Quick Obstacle Actions */}
        <div className="flex items-center gap-2">
          <button
            id="btn-drop-sudden-obs"
            onClick={onDropSuddenObstacle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors shadow-xs font-bengali"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>{t.dropObstacle}</span>
          </button>

          <button
            id="btn-clear-obs"
            onClick={onClearObstacles}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.clearObstacles}</span>
          </button>
        </div>

        {/* Lighting & Weather Condition Switches (Challenge 1 & 2 Testing) */}
        <div className={`flex items-center gap-1 p-1 rounded-lg border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <span className={`px-1 font-mono text-2xs hidden sm:inline ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Lighting:</span>
          
          <button
            id="lighting-sunny"
            onClick={() => onSelectLighting('sunny')}
            className={`px-2 py-1 rounded text-2xs font-medium flex items-center gap-1 transition-colors ${
              lighting === 'sunny'
                ? isLight
                  ? 'bg-amber-200/70 text-amber-900 border border-amber-300 font-semibold'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.sunny}
          >
            <Sun className="w-3 h-3" />
            <span>{t.sunny}</span>
          </button>

          <button
            id="lighting-shadow"
            onClick={() => onSelectLighting('shadow')}
            className={`px-2 py-1 rounded text-2xs font-medium flex items-center gap-1 transition-colors ${
              lighting === 'shadow'
                ? isLight
                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.shadow}
          >
            <CloudRain className="w-3 h-3" />
            <span>{t.shadow}</span>
          </button>

          <button
            id="lighting-dusk"
            onClick={() => onSelectLighting('dusk')}
            className={`px-2 py-1 rounded text-2xs font-medium flex items-center gap-1 transition-colors ${
              lighting === 'dusk'
                ? isLight
                  ? 'bg-purple-100 text-purple-900 border border-purple-300 font-semibold'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.dusk}
          >
            <Moon className="w-3 h-3" />
            <span>{t.dusk}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
