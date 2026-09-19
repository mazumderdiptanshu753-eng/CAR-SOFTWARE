/**
 * UGV GPS-Denied Autonomous Navigation System Types
 */

export type Language = 'bn' | 'en';
export type Theme = 'light' | 'dark';

export type ObstacleType = 'rock' | 'ditch' | 'bush' | 'tree' | 'mud';

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: ObstacleType;
  label: string;
  height?: number;
  color?: string;
  isDynamic?: boolean;
}

export interface Waypoint {
  x: number;
  y: number;
  id: string;
  label: string;
  reached?: boolean;
}

export interface UgvPose {
  x: number; // meters
  y: number; // meters
  theta: number; // radians (heading, 0 is east/right, PI/2 is south/down)
  v: number; // linear speed in m/s
  omega: number; // angular velocity in rad/s
}

export interface SlamPose {
  x: number;
  y: number;
  theta: number;
  driftError: number; // Euclidean difference from ground truth in meters
  trackedKeypoints: number;
  landmarks: { id: number; x: number; y: number; descriptorWeight: number }[];
  status: 'TRACKING_EXCELLENT' | 'TRACKING_DEGRADED' | 'RELOCALIZING' | 'LOOP_CLOSURE';
  covarianceRadius: number;
}

export interface MotorTelemetry {
  leftPwm: number; // 0 - 255
  rightPwm: number; // 0 - 255
  leftRpm: number; // e.g. 0 - 220
  rightRpm: number;
  linearVelocityCmd: number; // m/s
  angularVelocityCmd: number; // rad/s
  voltage: number; // Volts (e.g. 12.4V)
  currentAmp: number; // Amperes
  steeringState: 'STRAIGHT' | 'VEER_LEFT' | 'VEER_RIGHT' | 'PIVOT_AVOID' | 'BRAKE' | 'REVERSE';
}

export interface DetectedEntity {
  id: string;
  type: ObstacleType;
  distance: number; // in meters relative to UGV camera
  angle: number; // angle relative to camera optical axis
  confidence: number; // 0 - 1.0
  box: { x: number; y: number; w: number; h: number }; // normalized 0-1 for camera frame
  dangerLevel: 'SAFE' | 'CAUTION' | 'CRITICAL';
}

export interface PerceptionData {
  fps: number;
  inferenceLatencyMs: number;
  detectedEntities: DetectedEntity[];
  drivableConfidence: number;
  horizonTilt: number;
  lightingCondition: 'sunny' | 'shadow' | 'dusk' | 'glare';
  featurePoints: { x: number; y: number; u: number; v: number; isCorner: boolean }[];
  depthEstimate: number[]; // 5-sector range scan: [far-left, mid-left, center, mid-right, far-right] in meters
}

export interface MissionStats {
  distanceTravelled: number; // m
  timeElapsedSeconds: number;
  collisionsAvoided: number;
  obstaclesDetected: number;
  averageSpeed: number;
  pointReached: boolean;
}

export type TerrainType = 'farmland' | 'rocky_trail' | 'rescue_rubble' | 'forest_canopy';

export interface TerrainPreset {
  id: TerrainType;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  friction: number;
  lighting: 'sunny' | 'shadow' | 'dusk' | 'glare';
  groundColor: string;
  pathColor: string;
  obstacles: Obstacle[];
}

export type HardwareConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface SerialLogMessage {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX';
  message: string;
  hex?: string;
}

export interface HardwareConfig {
  portType: 'webserial' | 'websocket_ros2';
  baudRate: number;
  protocol: 'binary_hex' | 'ascii_csv' | 'ros2_twist';
  ipAddress: string;
  autoStream: boolean;
  invertLeftMotor: boolean;
  invertRightMotor: boolean;
}
