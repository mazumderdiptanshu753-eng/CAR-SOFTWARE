export const translations = {
  bn: {
    appTitle: "আউটডোর অটোনমাস ইউজিভি (UGV) নেভিগেশন সিস্টেম",
    appSubtitle: "জিপিএস-বিহীন (GPS-Denied) ক্যামেরা-ভিত্তিক স্বয়ংক্রিয় নেভিগেশন ও ভিজ্যুয়াল এসএলএএম (Visual SLAM) ককপিট",
    gpsDeniedBadge: "জিপিএস সিগন্যাল: বিচ্ছিন্ন (GPS Denied)",
    visionOnlineBadge: "ক্যামেরা ওডোমেট্রি: সচল (VO Active)",
    statusIdle: "অপেক্ষমাণ (Idle)",
    statusRunning: "স্বয়ংক্রিয় নেভিগেশন চলছে (Autonomous Run)",
    statusPaused: "স্থগিত (Paused)",
    statusGoalReached: "গন্তব্য 'বি' সফলভাবে অর্জিত! (Goal Reached)",
    statusCollision: "সতর্কতা: সীমানা বা বাধা স্পর্শ করেছে!",
    statusRerouting: "বাধা এড়াতে নতুন রুট তৈরি হচ্ছে (Dynamic Rerouting)",
    
    // The 3 Biological Modules
    modulesTitle: "প্রধান ৩টি কোর মডিউল (Core Autonomous Modules)",
    eyeModuleTitle: "১. চোখের কাজ (Perception AI)",
    eyeModuleSub: "ক্যামেরা লাইভ ফিড, পাথ সেগমেন্টেশন ও অবস্ট্যাকল ডিটেকশন",
    brainModuleTitle: "২. ব্রেনের কাজ (Visual SLAM & Planner)",
    brainModuleSub: "জিপিএস-বিহীন অবস্থান নির্ণয় ও গতিপথ পরিকল্পনা",
    handModuleTitle: "৩. হাতের কাজ (Motor Control & Actuation)",
    handModuleSub: "হুইল আরপিএম, পিডব্লিউএম সিগন্যাল ও হার্ডওয়্যার কন্ট্রোল",

    // 3 Challenges
    challenge1Title: "পাথ ডিটেকশন (Path Detection)",
    challenge1Desc: "লাইটওয়েট এআই মডেল দ্বারা রিয়েল-টাইমে নিরাপদ চলার পথ এবং পাথর, খাদ ও গাছপালা আলাদা করা।",
    challenge2Title: "ভিজ্যুয়াল লোকালাইজেশন (Visual SLAM)",
    challenge2Desc: "জিপিএস ছাড়া শুধু ক্যামেরা ফিড ও অপটিক্যাল ফ্লো থেকে গাড়িটির নিজস্ব স্থানাঙ্ক (X, Y, θ) ট্র্যাক করা।",
    challenge3Title: "কলিশন অ্যাভয়েডেন্স (Collision Avoidance)",
    challenge3Desc: "আউটডোর পথে হঠাৎ আসা বাধা পাশ কাটিয়ে মোটর ড্রাইভারের জন্য রিয়েল-টাইম স্টিয়ারিং কমান্ড প্রদান।",

    // Controls
    startAutonomous: "স্বয়ংক্রিয় মিশন শুরু করুন (Start Mission)",
    pauseMission: "স্থগিত করুন (Pause)",
    resetMission: "রিসেট করুন (Reset)",
    dropObstacle: "হঠাৎ পাথর/বাধা ফেলুন (Drop Sudden Obstacle)",
    clearObstacles: "বাধা রিসেট করুন",
    teleopMode: "ম্যানুয়াল কন্ট্রোল (WASD)",
    autonomousMode: "স্বয়ংক্রিয় পাইলট (Auto)",
    terrainSelector: "পরিবেশ / ভূপ্রকৃতি নির্বাচন:",
    lightingCondition: "আবহাওয়া ও আলোর অবস্থা:",
    sunny: "তীব্র রোদ (High Sun)",
    shadow: "গাছের ছায়া (Shadows)",
    dusk: "সন্ধ্যা / কম আলো (Dusk)",
    glare: "লেন্স গ্লেয়ার (Lens Glare)",

    // Telemetry
    speed: "গতি (Speed)",
    heading: "দিক (Heading)",
    slamConfidence: "এসএলএএম নির্ভরযোগ্যতা",
    trackedFeatures: "ট্র্যাকড ফিচার পয়েন্ট",
    driftError: "আনুমানিক ড্রিফট ত্রুটি",
    leftMotor: "বাম মোটর (Left Motor)",
    rightMotor: "ডান মোটর (Right Motor)",
    pwm: "পি.ডব্লিউ.এম (PWM)",
    rpm: "আর.পি.এম (RPM)",
    pointAToB: "পয়েন্ট 'এ' ➔ পয়েন্ট 'বি'",
    distanceRemaining: "বাকি দূরত্ব",
    timeElapsed: "অতিক্রান্ত সময়",
    avoidedCollisions: "সাফল্যের সাথে এড়ানো বাধা",

    // Tabs
    tabCockpit: "লাইভ ককপিট ও সিমুলেশন (Live Cockpit)",
    tabHardwareControl: "গাড়ির হার্ডওয়্যার কন্ট্রোল (Hardware Direct Control)",
    tabArchitecture: "প্রজেক্ট আর্কিটেকচার ও গাইড (System Blueprint)",
    tabHardware: "হার্ডওয়্যার কানেকশন ও ওয়্যারিং (Hardware Wiring)",
    tabCode: "পাইথন ও রস২ কোড (ROS2 / Python Code)",

    // Camera HUD
    cameraHudTitle: "সামনের ক্যামেরা ফিড (Forward Bumper Camera)",
    cameraModeAI: "এআই ওভারলে (AI Vision)",
    cameraModeDepth: "ডেপথ ম্যাপ (Visual Depth)",
    cameraModeFeatures: "ফিচার পয়েন্ট (FAST/ORB)",
    cameraModeRaw: "র (Raw RGB)",
    useWebcam: "ল্যাপটপ ওয়েবক্যাম টেস্ট",
    webcamActive: "ওয়েবক্যাম অন",
    webcamNotice: "বাস্তব ক্যামেরা ফিডে এআই এজ ও ফ্রেম সেগমেন্টেশন টেস্ট করা হচ্ছে",

    // Architecture Guide Text
    archOverview: "জিপিএস-বিহীন আউটডোর স্বয়ংক্রিয় গাড়ি (UGV) নেভিগেশন প্রজেক্টের পূর্ণাঙ্গ রূপরেখা",
    archOverviewBody: "বাইরের খোলামেলা বা রুক্ষ পরিবেশে (যেমন: কৃষি জমি, সার্চ-অ্যান্ড-রেসকিউ অভিযান বা ডেলিভারির কাজে) চলাচলকারী আনম্যান্ড গ্রাউন্ড ভেহিকল বা ইউজিভি (UGV)-গুলোকে প্রায়ই অপ্রত্যাশিত রাস্তাঘাট, আলোর তারতম্য এবং জিপিএস (GPS) সিগন্যাল না পাওয়ার সমস্যায় পড়তে হয়। এই প্রজেক্টের মূল উদ্দেশ্য হলো, জিপিএস ব্যবহার না করে শুধুমাত্র ক্যামেরার লাইভ ফিডের ওপর নির্ভর করে একটি গাড়ির হার্ডওয়্যার চালানোর জন্য সম্পূর্ণ স্বয়ংক্রিয় (Autonomous) সফটওয়্যার সিস্টেম তৈরি করা।",
    perceptionTitle: "মডিউল ১: পারসেপশন এআই (Perception AI / চোখের কাজ)",
    perceptionBody: "ইউজিভির সামনের বাম্পারে স্থাপিত ক্যামেরা থেকে ফ্রেম গ্রহণ করে রিয়েল-টাইমে রোডের সেগমেন্টেশন মাস্ক (Drivable Corridor) ও অবজেক্ট ডিটেকশন (YOLOv8-Nano / MobileNetV3-SSD) চালানো হয়। এর মাধ্যমে পাথর, গাছপালা বা খাদ শনাক্ত হয় এবং দূরত্ব পরিমাপ করা হয়।",
    slamTitle: "মডিউল ২: ভিজ্যুয়াল লোকালাইজেশন ও এসএলএএম (Visual SLAM / ব্রেনের কাজ)",
    slamBody: "জিপিএস ছাড়া নিজের অবস্থান ও ডিরেকশন নির্ভুল রাখার জন্য ভিজ্যুয়াল ওডোমেট্রি (ORB-SLAM3 বা Fast Optical Flow) অ্যালগরিদম প্রতিটি ফ্রেমের বিশিষ্ট পয়েন্টগুলোর স্থানচ্যুতি গণনা করে গাড়ির (X, Y, Heading) স্থানাঙ্ক তৈরি করে। সাথে এ-স্টার (A*) ও ডিডব্লিউএ (Dynamic Window Approach) অ্যালগরিদম নিরাপদ রুট নির্ধারণ করে।",
    motorTitle: "মডিউল ৩: মোটর কন্ট্রোল ও ড্রাইভার ইন্টারফেস (Motor Actuation / হাতের কাজ)",
    motorBody: "পাথ প্ল্যানার থেকে পাওয়া লিনিয়ার বেগ (v) এবং কৌণিক বেগ (ω)-কে ডিফারেনশিয়াল ড্রাইভ কাইনেমেটিক্স সমীকরণের মাধ্যমে বাম ও ডান চাকার নির্দিষ্ট PWM (০-২৫৫) এবং RPM-এ রূপান্তর করে সিরিয়াল বা ROS2 মাইক্রোকন্ট্রোলারে (Arduino/STM32/ESP32) পাঠানো হয়।"
  },
  en: {
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
  }
};
