const enDict = {
  appTitle: "Outdoor Autonomous UGV Navigation System",
  appSubtitle: "GPS-Denied Camera-Only Navigation & Visual SLAM Mission Cockpit",
  gpsDeniedBadge: "GPS: Denied / Offline",
  visionOnlineBadge: "VO / Visual SLAM: Active",
  statusIdle: "System Ready / Idle",
  statusRunning: "Autonomous Navigation Active",
  statusPaused: "Mission Paused",
  statusGoalReached: "Point 'B' Successfully Reached!",
  statusCollision: "Warning: Boundary or Obstacle Hit!",
  statusRerouting: "Dynamic Obstacle Detected: Rerouting",
  
  // The 3 Biological Modules
  modulesTitle: "Three Core Autonomous Modules",
  eyeModuleTitle: "1. Eye: Perception AI",
  eyeModuleSub: "Camera live feed, path segmentation & obstacle classification",
  brainModuleTitle: "2. Brain: Visual SLAM & Planner",
  brainModuleSub: "GPS-denied visual pose estimation & dynamic trajectory planning",
  handModuleTitle: "3. Hand: Motor Control & Actuation",
  handModuleSub: "Differential wheel RPM, PWM pulses & hardware signals",

  // 3 Challenges
  challenge1Title: "Path Detection",
  challenge1Desc: "Real-time segmentation of drivable ground vs hazards (rocks, ditches, vegetation) using edge AI.",
  challenge2Title: "Visual Localization (SLAM)",
  challenge2Desc: "GPS-denied 2D/6-DoF pose tracking (X, Y, θ) purely via visual odometry and feature tracking.",
  challenge3Title: "Collision Avoidance",
  challenge3Desc: "Dynamic window approach turning visual risk sectors into smooth motor drive & steering commands.",

  // Controls
  startAutonomous: "Start Autonomous Mission",
  pauseMission: "Pause Mission",
  resetMission: "Reset Mission",
  dropObstacle: "Drop Sudden Obstacle",
  clearObstacles: "Reset Obstacles",
  teleopMode: "Manual WASD",
  autonomousMode: "Auto Pilot",
  terrainSelector: "Terrain Environment:",
  lightingCondition: "Lighting Condition:",
  sunny: "Bright Sunlight",
  shadow: "Canopy Shadows",
  dusk: "Dusk / Low Light",
  glare: "Direct Sun Glare",

  // Telemetry
  speed: "Linear Speed",
  heading: "Compass Heading",
  slamConfidence: "SLAM Tracking Confidence",
  trackedFeatures: "Tracked Keypoints",
  driftError: "Est. VO Drift Error",
  leftMotor: "Left Motor",
  rightMotor: "Right Motor",
  pwm: "PWM Signal",
  rpm: "Wheel RPM",
  pointAToB: "Point 'A' ➔ Point 'B'",
  distanceRemaining: "Distance to Goal",
  timeElapsed: "Elapsed Time",
  avoidedCollisions: "Avoided Hazards",

  // Tabs
  tabCockpit: "Live Cockpit & Simulator",
  tabHardwareControl: "Hardware Direct Control",
  tabArchitecture: "System Architecture & Blueprint",
  tabHardware: "Hardware Wiring & Schematics",
  tabCode: "ROS2 & Python Implementation",

  // Camera HUD
  cameraHudTitle: "Forward Bumper Vision Feed",
  cameraModeAI: "AI Vision Overlay",
  cameraModeDepth: "Visual Depth Map",
  cameraModeFeatures: "FAST/ORB Keypoints",
  cameraModeRaw: "Raw RGB Sensor",
  useWebcam: "Test Laptop Webcam",
  webcamActive: "Webcam Active",
  webcamNotice: "Testing real-time optical edge & safe path parsing from actual camera device",

  // Architecture Guide Text
  archOverview: "Comprehensive Guide: GPS-Denied Outdoor Autonomous Ground Vehicle",
  archOverviewBody: "Outdoor Unmanned Ground Vehicles (UGVs) operating in rough, unstructured terrains (agriculture, search-and-rescue, rural logistics) routinely face unmapped pathways, extreme lighting shifts, and complete GPS outages due to foliage, valleys, or jamming. This project creates a fully autonomous software stack that replaces GPS reliance with monocular/stereo visual intelligence directly driving vehicle actuators.",
  perceptionTitle: "Module 1: Perception AI (The Eyes)",
  perceptionBody: "Captures forward video stream from bumper cameras and executes real-time semantic segmentation (FastSCNN / BiSeNet) to classify drivable terrain vs positive obstacles (rocks, trees) and negative obstacles (ditches, ruts, cliff edges).",
  slamTitle: "Module 2: Visual SLAM & Path Planning (The Brain)",
  slamBody: "Calculates metric ego-motion through FAST/ORB feature tracking across successive frames (Visual Odometry), maintains a sparse topological map, and computes collision-free trajectories using A* global planning and Dynamic Window Approach (DWA).",
  motorTitle: "Module 3: Motor Control & Actuation (The Hands)",
  motorBody: "Translates high-level velocity commands (v, ω) into low-level differential wheel PWM and RPM commands, managing motor driver duty cycles, soft acceleration curves, and emergency dynamic braking."
};

export const translations: Record<'bn' | 'en', typeof enDict> = {
  bn: enDict,
  en: enDict
};
