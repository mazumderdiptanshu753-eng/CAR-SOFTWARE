import { UgvPose, SlamPose, MotorTelemetry, PerceptionData, Obstacle, DetectedEntity, Waypoint } from '../types';

export const TRACK_WIDTH = 0.45; // meters between wheels
export const MAX_SPEED = 1.6; // m/s max linear velocity
export const MAX_OMEGA = 2.4; // rad/s max turning speed
export const MAX_RPM = 240; // max wheel RPM

// Compute distance between two 2D points
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Normalize angle to [-PI, PI]
export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

// Calculate DWA / Vector Field Collision-Free Velocity Commands
export function computeAutonomousDriveCommand(
  pose: UgvPose,
  goal: Waypoint,
  obstacles: Obstacle[],
  _slamPose: SlamPose
): { v: number; omega: number; steeringState: MotorTelemetry['steeringState']; rerouting: boolean } {
  const distToGoal = distance(pose.x, pose.y, goal.x, goal.y);
  
  if (distToGoal < 2.0) {
    return { v: 0, omega: 0, steeringState: 'BRAKE', rerouting: false };
  }

  // Desired angle towards goal
  const angleToGoal = Math.atan2(goal.y - pose.y, goal.x - pose.x);
  const headingError = normalizeAngle(angleToGoal - pose.theta);

  // Check forward camera FOV for obstacles (FOV: ±45 deg, range 16m)
  let closestDist = 999;
  let repulsiveOmega = 0;
  let collisionDanger = false;

  for (const obs of obstacles) {
    const d = distance(pose.x, pose.y, obs.x, obs.y) - obs.radius;
    const obsAngle = Math.atan2(obs.y - pose.y, obs.x - pose.x);
    const relAngle = normalizeAngle(obsAngle - pose.theta);

    // If within forward sensor cone
    if (Math.abs(relAngle) < Math.PI / 2.8 && d < 14) {
      if (d < closestDist) closestDist = d;

      // Calculate avoidance push
      const severity = Math.max(0, 1 - d / 14);
      // If obstacle is on the right, steer left; if on left, steer right
      const pushDirection = relAngle >= 0 ? -1 : 1;
      repulsiveOmega += pushDirection * severity * 2.5;

      if (d < 5.0) {
        collisionDanger = true;
      }
    }
  }

  // Desired angular speed combines goal attraction + obstacle avoidance
  let targetOmega = headingError * 1.8 + repulsiveOmega;
  targetOmega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, targetOmega));

  // Determine speed: slow down if turning hard or obstacles nearby
  let targetV = MAX_SPEED;
  if (collisionDanger) {
    targetV = MAX_SPEED * 0.4;
  } else if (Math.abs(targetOmega) > 0.8) {
    targetV = MAX_SPEED * 0.6;
  } else if (distToGoal < 6) {
    targetV = Math.max(0.3, MAX_SPEED * (distToGoal / 6));
  }

  let steeringState: MotorTelemetry['steeringState'] = 'STRAIGHT';
  if (targetOmega < -0.3) steeringState = 'VEER_RIGHT';
  else if (targetOmega > 0.3) steeringState = 'VEER_LEFT';
  if (collisionDanger && Math.abs(targetOmega) > 1.0) steeringState = 'PIVOT_AVOID';

  return {
    v: targetV,
    omega: targetOmega,
    steeringState,
    rerouting: Math.abs(repulsiveOmega) > 0.3
  };
}

// Convert target linear velocity (v) and angular velocity (omega) to Left/Right wheel signals
export function computeMotorTelemetry(
  v: number,
  omega: number,
  steeringState: MotorTelemetry['steeringState']
): MotorTelemetry {
  // Differential drive kinematics:
  // v_L = v - omega * (L / 2)
  // v_R = v + omega * (L / 2)
  const v_L = v - (omega * TRACK_WIDTH) / 2;
  const v_R = v + (omega * TRACK_WIDTH) / 2;

  // Convert m/s to RPM assuming wheel radius r = 0.08m (Circumference = 2 * PI * r = ~0.5m)
  const WHEEL_CIRCUMFERENCE = 2 * Math.PI * 0.08;
  const rawRpmL = (v_L / WHEEL_CIRCUMFERENCE) * 60;
  const rawRpmR = (v_R / WHEEL_CIRCUMFERENCE) * 60;

  // Clamp PWM to 0-255
  const leftPwm = Math.min(255, Math.max(0, Math.round((Math.abs(v_L) / MAX_SPEED) * 255)));
  const rightPwm = Math.min(255, Math.max(0, Math.round((Math.abs(v_R) / MAX_SPEED) * 255)));

  // Simulated current based on load and PWM
  const currentAmp = Number((1.2 + (leftPwm + rightPwm) * 0.012 + Math.abs(omega) * 0.8).toFixed(1));
  const voltage = Number((12.6 - currentAmp * 0.08).toFixed(2));

  return {
    leftPwm,
    rightPwm,
    leftRpm: Math.round(Math.min(MAX_RPM, Math.max(0, rawRpmL))),
    rightRpm: Math.round(Math.min(MAX_RPM, Math.max(0, rawRpmR))),
    linearVelocityCmd: Number(v.toFixed(2)),
    angularVelocityCmd: Number(omega.toFixed(2)),
    voltage,
    currentAmp,
    steeringState
  };
}

// Update Ground Truth UGV Pose based on kinematics
export function updateUgvKinematics(
  currentPose: UgvPose,
  v: number,
  omega: number,
  dt: number
): UgvPose {
  const newTheta = normalizeAngle(currentPose.theta + omega * dt);
  const newX = currentPose.x + v * Math.cos(newTheta) * dt;
  const newY = currentPose.y + v * Math.sin(newTheta) * dt;

  return {
    x: newX,
    y: newY,
    theta: newTheta,
    v,
    omega
  };
}

// Emulate Visual Odometry (VO) & SLAM tracking with realistic drift and landmark updates
export function updateVisualSlam(
  currentSlam: SlamPose,
  actualPose: UgvPose,
  dt: number,
  obstacles: Obstacle[],
  lighting: 'sunny' | 'shadow' | 'dusk' | 'glare'
): SlamPose {
  // Visual Odometry typically drifts ~1-2% of distance travelled without loop closure
  const noiseMagnitude = lighting === 'glare' || lighting === 'shadow' ? 0.03 : 0.015;
  const noiseX = (Math.sin(Date.now() / 1200) * noiseMagnitude) * actualPose.v * dt;
  const noiseY = (Math.cos(Date.now() / 1400) * noiseMagnitude) * actualPose.v * dt;
  const noiseTheta = (Math.sin(Date.now() / 900) * 0.01) * dt;

  // Approximate SLAM update with subtle drift
  const updatedX = currentSlam.x + (actualPose.v * Math.cos(currentSlam.theta) * dt) + noiseX;
  const updatedY = currentSlam.y + (actualPose.v * Math.sin(currentSlam.theta) * dt) + noiseY;
  const updatedTheta = normalizeAngle(currentSlam.theta + actualPose.omega * dt + noiseTheta);

  const drift = distance(updatedX, updatedY, actualPose.x, actualPose.y);

  // Calculate visible landmarks from obstacles
  const visibleLandmarks = obstacles
    .filter(obs => distance(actualPose.x, actualPose.y, obs.x, obs.y) < 18)
    .map((obs, idx) => ({
      id: idx + 1,
      x: obs.x,
      y: obs.y,
      descriptorWeight: 0.95
    }));

  // Tracked keypoint count based on lighting and texture
  let baseKeypoints = 240;
  if (lighting === 'shadow') baseKeypoints = 180;
  if (lighting === 'dusk') baseKeypoints = 135;
  if (lighting === 'glare') baseKeypoints = 110;

  const keypointJitter = Math.floor(Math.sin(Date.now() / 200) * 15);
  const trackedCount = Math.max(45, baseKeypoints + keypointJitter);

  let status: SlamPose['status'] = 'TRACKING_EXCELLENT';
  if (trackedCount < 120) status = 'TRACKING_DEGRADED';
  if (visibleLandmarks.length >= 3 && drift > 0.8) status = 'LOOP_CLOSURE';

  // If loop closure triggered, pull SLAM closer to ground truth
  let finalX = updatedX;
  let finalY = updatedY;
  if (status === 'LOOP_CLOSURE') {
    finalX = updatedX + (actualPose.x - updatedX) * 0.08;
    finalY = updatedY + (actualPose.y - updatedY) * 0.08;
  }

  return {
    x: finalX,
    y: finalY,
    theta: updatedTheta,
    driftError: Number(drift.toFixed(2)),
    trackedKeypoints: trackedCount,
    landmarks: visibleLandmarks,
    status,
    covarianceRadius: Math.min(1.2, 0.2 + drift * 0.3)
  };
}

// Generate Camera Vision Perception Data (Bounding boxes, depth scan, optical flow)
export function generatePerceptionOutput(
  pose: UgvPose,
  obstacles: Obstacle[],
  lighting: 'sunny' | 'shadow' | 'dusk' | 'glare'
): PerceptionData {
  const detectedEntities: DetectedEntity[] = [];
  const depthSectors = [15, 15, 15, 15, 15]; // far-left, mid-left, center, mid-right, far-right (meters)

  obstacles.forEach(obs => {
    const d = distance(pose.x, pose.y, obs.x, obs.y) - obs.radius;
    const angleToObs = Math.atan2(obs.y - pose.y, obs.x - pose.x);
    const relAngle = normalizeAngle(angleToObs - pose.theta); // radians relative to camera forward

    // Camera FOV is roughly ±38 degrees (0.66 rad)
    if (Math.abs(relAngle) < 0.70 && d > 0.5 && d < 22) {
      // Map relAngle to camera screen X [0 to 1]
      const screenX = 0.5 + (relAngle / 1.4);
      // Perspective scale based on distance
      const boxWidth = Math.max(0.08, Math.min(0.45, (obs.radius * 2.2) / Math.max(1.5, d)));
      const boxHeight = boxWidth * 0.85;
      const screenY = 0.52 + (1.2 / Math.max(1.5, d));

      const confidence = Number(
        (0.88 + Math.sin(obs.x + obs.y) * 0.08 - (lighting === 'glare' ? 0.12 : 0)).toFixed(2)
      );

      let dangerLevel: DetectedEntity['dangerLevel'] = 'SAFE';
      if (d < 5.0) dangerLevel = 'CRITICAL';
      else if (d < 9.0) dangerLevel = 'CAUTION';

      detectedEntities.push({
        id: obs.id,
        type: obs.type,
        distance: Number(d.toFixed(1)),
        angle: Number((relAngle * (180 / Math.PI)).toFixed(1)),
        confidence: Math.max(0.55, Math.min(0.99, confidence)),
        box: {
          x: Math.max(0.02, Math.min(0.98 - boxWidth, screenX - boxWidth / 2)),
          y: Math.max(0.15, Math.min(0.9 - boxHeight, screenY - boxHeight / 2)),
          w: boxWidth,
          h: boxHeight
        },
        dangerLevel
      });

      // Update depth sectors (5 bins)
      const sectorIdx = Math.min(4, Math.max(0, Math.floor((relAngle + 0.66) / 0.264)));
      if (d < depthSectors[sectorIdx]) {
        depthSectors[sectorIdx] = Number(d.toFixed(1));
      }
    }
  });

  // Feature points simulating FAST corner detector & optical flow
  const featurePoints = [];
  const basePoints = 28;
  for (let i = 0; i < basePoints; i++) {
    const px = 0.08 + (i % 7) * 0.14 + (Math.sin(i * 13 + Date.now() / 300) * 0.03);
    const py = 0.45 + Math.floor(i / 7) * 0.12 + (Math.cos(i * 17) * 0.03);
    // Optical flow displacement proportional to forward speed and angular turn
    const flowU = -pose.omega * 12 + (Math.random() - 0.5) * 2;
    const flowV = (pose.v * 8) * (py - 0.4) + (Math.random() - 0.5) * 1.5;
    featurePoints.push({
      x: px,
      y: py,
      u: flowU,
      v: flowV,
      isCorner: i % 3 === 0
    });
  }

  // Drivable path confidence
  const minObstacleDist = detectedEntities.length > 0
    ? Math.min(...detectedEntities.map(e => e.distance))
    : 20;
  const drivableConfidence = Math.max(35, Math.min(99, Math.round((minObstacleDist / 12) * 100)));

  return {
    fps: 32,
    inferenceLatencyMs: 16.4,
    detectedEntities,
    drivableConfidence,
    horizonTilt: Number((-pose.omega * 5).toFixed(1)),
    lightingCondition: lighting,
    featurePoints,
    depthEstimate: depthSectors
  };
}
