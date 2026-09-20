import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap
} from '@vis.gl/react-google-maps';
import {
  Mic,
  MicOff,
  Search,
  Compass,
  Gauge,
  MapPin,
  Play,
  Square,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Camera,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Route,
  Octagon,
  Plus,
  Trash2,
  Crosshair,
  Layers,
  HelpCircle,
  X,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Clock,
  Navigation,
  ArrowRight,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  CornerUpRight,
  CornerUpLeft,
  ArrowUpRight,
  ArrowUpLeft,
  TrafficCone,
  Box,
  Brain,
  RotateCw
} from 'lucide-react';
import { PRESET_LOCATIONS, PresetLocation } from '../data/presetLocations';
import {
  GeoCoordinate,
  MapObstacle,
  RouteTurnManeuver,
  TrafficJamZone,
  calculateDistanceMeters,
  calculateBearing,
  generateRoadWaypoints,
  generateRoadWaypointsWithTurns,
  findObstacleOnPath,
  generateObstacleAvoidanceDetour,
  generateProactiveJamBypass,
  computeAutoAdjustedSpeed,
  calculatePathCumulativeDistances,
  interpolatePositionAlongPath,
  smoothAngleLerp,
  speakPrompt
} from '../utils/geoUtils';
import { Language, Theme, PerceptionData } from '../types';
import { MachineLearningPanel } from './MachineLearningPanel';
import { UGVDefensiveSafetyModule } from './UGVDefensiveSafetyModule';
import { ugvDefensiveAudio } from '../utils/sirenAudio';

interface GoogleMapsNavigatorProps {
  language: Language;
  theme: Theme;
  onEmergencyStop?: () => void;
  onAutoStopStateChange?: (active: boolean) => void;
}

// Sub-component to render polyline routes on Google Map
function MapPolyline({
  path,
  color = '#059669',
  weight = 6,
  opacity = 0.88,
  dashed = false
}: {
  path: GeoCoordinate[];
  color?: string;
  weight?: number;
  opacity?: number;
  dashed?: boolean;
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    const lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 3
    };

    const polylineOptions: google.maps.PolylineOptions = {
      path,
      strokeColor: color,
      strokeOpacity: dashed ? 0 : opacity,
      strokeWeight: weight,
      map,
      icons: dashed
        ? [
            {
              icon: lineSymbol,
              offset: '0',
              repeat: '16px'
            }
          ]
        : undefined
    };

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline(polylineOptions);
    } else {
      polylineRef.current.setOptions(polylineOptions);
      polylineRef.current.setPath(path);
      polylineRef.current.setMap(map);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, path, color, weight, opacity, dashed]);

  return null;
}

// Sub-component to smoothly follow the vehicle camera on Google Map in 3D perspective
function MapCameraFollower({
  carPosition,
  carHeading,
  isDriving,
  autoFollow,
  is3D = true,
  tilt = 55,
  zoom = 17.5
}: {
  carPosition: GeoCoordinate;
  carHeading: number;
  isDriving: boolean;
  autoFollow: boolean;
  is3D?: boolean;
  tilt?: number;
  zoom?: number;
}) {
  const map = useMap();
  const currentPosRef = useRef<{ lat: number; lng: number; heading: number }>({
    lat: carPosition.lat,
    lng: carPosition.lng,
    heading: carHeading
  });
  const lastMoveTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Smooth 60fps / requestAnimationFrame camera interpolation
  useEffect(() => {
    if (!map || !autoFollow) return;

    let isMounted = true;

    const smoothCameraTick = (now: number) => {
      if (!isMounted) return;

      // Smooth camera interpolation update (~30ms intervals) for zero-stutter tracking
      if (now - lastMoveTimeRef.current >= 33) {
        lastMoveTimeRef.current = now;

        const targetLat = carPosition.lat;
        const targetLng = carPosition.lng;
        const targetHeading = is3D ? carHeading : 0;
        const targetTilt = is3D ? tilt : 0;

        const current = currentPosRef.current;
        // Smooth exponential moving average lerp
        const lerpRate = isDriving ? 0.28 : 0.45;
        current.lat += (targetLat - current.lat) * lerpRate;
        current.lng += (targetLng - current.lng) * lerpRate;

        // Circular heading shortest-arc lerp
        const dHeading = (targetHeading - current.heading + 540) % 360 - 180;
        current.heading += dHeading * (isDriving ? 0.22 : 0.35);

        try {
          if (typeof (map as any).moveCamera === 'function') {
            (map as any).moveCamera({
              center: { lat: current.lat, lng: current.lng },
              heading: is3D ? current.heading : 0,
              tilt: targetTilt,
              zoom: isDriving ? zoom : undefined
            });
          } else {
            map.panTo({ lat: current.lat, lng: current.lng });
            if (typeof (map as any).setTilt === 'function') (map as any).setTilt(targetTilt);
            if (typeof (map as any).setHeading === 'function') (map as any).setHeading(is3D ? current.heading : 0);
          }
        } catch (_) {}
      }

      if (isDriving && autoFollow) {
        animFrameRef.current = requestAnimationFrame(smoothCameraTick);
      }
    };

    if (isDriving) {
      animFrameRef.current = requestAnimationFrame(smoothCameraTick);
    } else {
      // Single smooth orientation update when stationary or settings changed
      const targetHeading = is3D ? carHeading : 0;
      const targetTilt = is3D ? tilt : 0;
      currentPosRef.current = { lat: carPosition.lat, lng: carPosition.lng, heading: targetHeading };
      try {
        if (typeof (map as any).moveCamera === 'function') {
          (map as any).moveCamera({
            center: { lat: carPosition.lat, lng: carPosition.lng },
            heading: targetHeading,
            tilt: targetTilt,
            zoom: 17
          });
        } else {
          map.panTo({ lat: carPosition.lat, lng: carPosition.lng });
          if (typeof (map as any).setTilt === 'function') (map as any).setTilt(targetTilt);
          if (typeof (map as any).setHeading === 'function') (map as any).setHeading(targetHeading);
        }
      } catch (_) {}
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [map, carPosition.lat, carPosition.lng, carHeading, autoFollow, isDriving, is3D, tilt, zoom]);

  return null;
}

// Initial UGV Starting Location (Near Science Lab / Mirpur Road corridor)
const INITIAL_UGV_POSITION: GeoCoordinate = {
  lat: 23.7420,
  lng: 90.3820
};

// Start with clear road (obstacles are spawned dynamically along the direction only when vehicle begins driving)
const INITIAL_MAP_OBSTACLES: MapObstacle[] = [];

export const GoogleMapsNavigator: React.FC<GoogleMapsNavigatorProps> = ({
  language,
  theme,
  onEmergencyStop,
  onAutoStopStateChange
}) => {
  const isLight = theme === 'light';
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyBkzfHiPWowuKmHRx1wqG6Gq0WqjMrJBPM';

  // Vehicle Navigation State (Coordinates updated at 60 FPS)
  const [carPosition, setCarPosition] = useState<GeoCoordinate>(INITIAL_UGV_POSITION);
  const [carHeading, setCarHeading] = useState<number>(35); // Degrees (0 = North)
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [isDriving, setIsDriving] = useState<boolean>(false);
  const [hasArrived, setHasArrived] = useState<boolean>(false);

  // Smooth Camera Follow state
  const [autoFollowMap, setAutoFollowMap] = useState<boolean>(true);
  const [is3DView, setIs3DView] = useState<boolean>(true); // 3D perspective enabled by default
  const [cameraTilt, setCameraTilt] = useState<number>(55); // 55° realistic perspective tilt

  // Autonomous Capabilities Master Switches
  const [obstacleAvoidanceEnabled, setObstacleAvoidanceEnabled] = useState<boolean>(true);
  const [autoStopEnabled, setAutoStopEnabled] = useState<boolean>(true);
  const [autoPathFinderEnabled, setAutoPathFinderEnabled] = useState<boolean>(true);
  const [autoSpeedAdjustEnabled, setAutoSpeedAdjustEnabled] = useState<boolean>(true);
  const [baseCruiseSpeed, setBaseCruiseSpeed] = useState<number>(24.0); // km/h

  // Real-time Autonomous Sensor & Safety State
  const [obstacles, setObstacles] = useState<MapObstacle[]>(INITIAL_MAP_OBSTACLES);
  const [nearestObstacle, setNearestObstacle] = useState<MapObstacle | null>(null);
  const [nearestDistMeters, setNearestDistMeters] = useState<number | null>(null);
  const [autoStopTriggered, setAutoStopTriggered] = useState<boolean>(false);
  const [avoidanceDetourActive, setAvoidanceDetourActive] = useState<boolean>(false);
  const [speedGovernorState, setSpeedGovernorState] = useState<'CRUISE' | 'DECELERATE_CURVE' | 'DECELERATE_OBSTACLE' | 'AUTO_STOP'>('CRUISE');
  const [throttlePercent, setThrottlePercent] = useState<number>(100);
  const [placementMode, setPlacementMode] = useState<boolean>(false);

  // Target Destination
  const [destination, setDestination] = useState<PresetLocation | { nameBn: string; nameEn: string; lat: number; lng: number }>(
    PRESET_LOCATIONS[0] // Dhanmondi Lake by default
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Route & Smooth Interpolation State
  const [routeCoordinates, setRouteCoordinates] = useState<GeoCoordinate[]>([]);
  const [originalBlockedRoute, setOriginalBlockedRoute] = useState<GeoCoordinate[]>([]);
  const [distanceRemainingMeters, setDistanceRemainingMeters] = useState<number>(0);

  // Turn Maneuver State (১ বা ২টি ক্ষেত্রে নির্দিষ্ট দিকে মোড় নেওয়া)
  const [routeTurns, setRouteTurns] = useState<RouteTurnManeuver[]>([]);
  const [activeTurn, setActiveTurn] = useState<RouteTurnManeuver | null>(null);
  const [distToNextTurnMeters, setDistToNextTurnMeters] = useState<number | null>(null);
  const [blinkingTurnSignal, setBlinkingTurnSignal] = useState<'LEFT' | 'RIGHT' | null>(null);

  // Proactive Traffic Jam Bypass State (রাস্তায় জ্যাম থাকলে আগে থেকেই সেই রোড এড়িয়ে চলা)
  const [trafficJamZone, setTrafficJamZone] = useState<TrafficJamZone | null>(null);
  const [jammedRoadSegment, setJammedRoadSegment] = useState<GeoCoordinate[]>([]);
  const [jamAvoidanceDetourActive, setJamAvoidanceDetourActive] = useState<boolean>(false);

  // Motor Telemetry
  const [motorPwmLeft, setMotorPwmLeft] = useState<number>(0);
  const [motorPwmRight, setMotorPwmRight] = useState<number>(0);
  const [steeringMode, setSteeringMode] = useState<'STRAIGHT' | 'LEFT' | 'RIGHT' | 'STOP'>('STOP');

  // Voice Recognition & Feedback
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [voiceVoiceFeedback, setVoiceFeedback] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>(
    language === 'bn'
      ? 'গুগল ম্যাপে আপনার গন্তব্য বলুন বা সিলেক্ট করুন'
      : 'Speak or select destination on Google Maps'
  );

  // Hardware WebSerial & UI Layout States
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [showCameraHud, setShowCameraHud] = useState<boolean>(true);
  const [isCameraHudExpanded, setIsCameraHudExpanded] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showMLModal, setShowMLModal] = useState<boolean>(false);

  // 360° Geofence Perimeter Defense & Anti-Tamper States
  const [isPerimeterArmed, setIsPerimeterArmed] = useState<boolean>(true);
  const [isBreached, setIsBreached] = useState<boolean>(false);
  const [breachDistanceMeters, setBreachDistanceMeters] = useState<number | null>(null);
  const [isEngineLocked, setIsEngineLocked] = useState<boolean>(false);
  const [isSirenAudible, setIsSirenAudible] = useState<boolean>(true);

  // Self-Righting Roll-Over Recovery States
  const [rollAngleDeg, setRollAngleDeg] = useState<number>(0);
  const [pitchAngleDeg, setPitchAngleDeg] = useState<number>(0);
  const [isTumbled, setIsTumbled] = useState<boolean>(false);
  const [isSelfRightingActive, setIsSelfRightingActive] = useState<boolean>(false);
  const [selfRightingPhase, setSelfRightingPhase] = useState<string>('');
  const [autoSelfRightEnabled, setAutoSelfRightEnabled] = useState<boolean>(true);

  // Refs for Smooth 60 FPS Motion Loop & Autonomous Scheduler
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const autoResumeTimerRef = useRef<any>(null);
  const travelledMetersRef = useRef<number>(0);
  const cumulativeDistsRef = useRef<number[]>([]);
  const carPosRef = useRef<GeoCoordinate>(carPosition);
  const carHeadingRef = useRef<number>(carHeading);
  const obstaclesRef = useRef<MapObstacle[]>(obstacles);
  const isDrivingRef = useRef<boolean>(isDriving);
  const speedKmhRef = useRef<number>(speedKmh);
  const routeCoordsRef = useRef<GeoCoordinate[]>(routeCoordinates);
  const routeTurnsRef = useRef<RouteTurnManeuver[]>([]);
  const announcedTurnsRef = useRef<Set<string>>(new Set());
  const trafficJamRef = useRef<TrafficJamZone | null>(null);

  // Defensive & Safety Loop Refs
  const isPerimeterArmedRef = useRef<boolean>(true);
  const isBreachedRef = useRef<boolean>(false);
  const isEngineLockedRef = useRef<boolean>(false);
  const isTumbledRef = useRef<boolean>(false);
  const isSirenAudibleRef = useRef<boolean>(true);

  // Keep refs synchronized with state
  useEffect(() => {
    isPerimeterArmedRef.current = isPerimeterArmed;
  }, [isPerimeterArmed]);

  useEffect(() => {
    isBreachedRef.current = isBreached;
  }, [isBreached]);

  useEffect(() => {
    isEngineLockedRef.current = isEngineLocked;
  }, [isEngineLocked]);

  useEffect(() => {
    isTumbledRef.current = isTumbled;
  }, [isTumbled]);

  useEffect(() => {
    isSirenAudibleRef.current = isSirenAudible;
  }, [isSirenAudible]);

  // Keep refs synchronized with state
  useEffect(() => {
    carPosRef.current = carPosition;
  }, [carPosition]);

  useEffect(() => {
    carHeadingRef.current = carHeading;
  }, [carHeading]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    isDrivingRef.current = isDriving;
  }, [isDriving]);

  useEffect(() => {
    speedKmhRef.current = speedKmh;
  }, [speedKmh]);

  useEffect(() => {
    routeCoordsRef.current = routeCoordinates;
    cumulativeDistsRef.current = calculatePathCumulativeDistances(routeCoordinates);
  }, [routeCoordinates]);

  useEffect(() => {
    routeTurnsRef.current = routeTurns;
  }, [routeTurns]);

  useEffect(() => {
    trafficJamRef.current = trafficJamZone;
  }, [trafficJamZone]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
      }
    };
  }, []);

  // Notify parent on Auto Stop status change
  useEffect(() => {
    if (onAutoStopStateChange) {
      onAutoStopStateChange(autoStopTriggered);
    }
  }, [autoStopTriggered, onAutoStopStateChange]);

  // Helper: Automatically seed road obstacles (1 or 2 obstacles) along the active road direction when driving starts
  const seedRouteObstacles = useCallback((coords: GeoCoordinate[]): MapObstacle[] => {
    if (coords.length < 6) return [];
    
    // Decide whether to place 1 or 2 obstacles randomly
    const count = Math.random() > 0.4 ? 2 : 1;
    const result: MapObstacle[] = [];

    // Obstacle types pool
    const obstacleCatalog: Array<{ type: MapObstacle['type']; labelBn: string; labelEn: string; icon: string; radius: number }> = [
      { type: 'vehicle', labelBn: 'রাস্তায় স্থবির গাড়ি / জ্যাম', labelEn: 'Stopped Vehicle / Traffic', icon: '🚗', radius: 7.0 },
      { type: 'construction', labelBn: 'রাস্তা সংস্কার ও ব্যারিকেড', labelEn: 'Road Works Barrier', icon: '🚧', radius: 6.5 },
      { type: 'pedestrian', labelBn: 'রাস্তায় পথচারী ক্রসিং', labelEn: 'Pedestrian Crossing', icon: '🚶', radius: 5.5 },
      { type: 'barrier', labelBn: 'ট্রাফিক ডাইভারশন রোড ব্লক', labelEn: 'Traffic Roadblock', icon: '🛑', radius: 6.5 },
    ];

    if (count === 1) {
      // 1 obstacle placed at ~45% of the direction path
      const idx = Math.min(coords.length - 2, Math.max(2, Math.floor(coords.length * 0.45)));
      const item = obstacleCatalog[Math.floor(Math.random() * obstacleCatalog.length)];
      result.push({
        id: `ride-obs-${Date.now()}-1`,
        lat: coords[idx].lat,
        lng: coords[idx].lng,
        type: item.type,
        labelBn: item.labelBn,
        labelEn: item.labelEn,
        radiusMeters: item.radius,
        icon: item.icon,
        active: true
      });
    } else {
      // 2 obstacles placed along the driving direction path
      // 1st obstacle at ~32% of route (vehicle slows down, smoothly detours onto clear road)
      const idx1 = Math.max(2, Math.floor(coords.length * 0.32));
      // 2nd obstacle at ~68% of route (vehicle slows down, halts safely, then takes clear detour)
      const idx2 = Math.min(coords.length - 2, Math.floor(coords.length * 0.68));

      const item1 = obstacleCatalog[0]; // vehicle
      const item2 = obstacleCatalog[1]; // construction barrier

      result.push({
        id: `ride-obs-${Date.now()}-1`,
        lat: coords[idx1].lat,
        lng: coords[idx1].lng,
        type: item1.type,
        labelBn: item1.labelBn,
        labelEn: item1.labelEn,
        radiusMeters: item1.radius,
        icon: item1.icon,
        active: true
      });

      result.push({
        id: `ride-obs-${Date.now()}-2`,
        lat: coords[idx2].lat,
        lng: coords[idx2].lng,
        type: item2.type,
        labelBn: item2.labelBn,
        labelEn: item2.labelEn,
        radiusMeters: item2.radius,
        icon: item2.icon,
        active: true
      });
    }

    return result;
  }, []);

  // Recalculate route whenever destination or starting point changes
  const planRouteTo = useCallback((targetCoord: GeoCoordinate) => {
    // Generate smooth road waypoints with 1 or 2 distinct intersection turns (মাঝে মাঝে ১ বা ২টি ক্ষেত্রে নির্দিষ্ট দিকে মোড় নেওয়া)
    const { waypoints, turns } = generateRoadWaypointsWithTurns(carPosRef.current, targetCoord);
    setRouteCoordinates(waypoints);
    routeCoordsRef.current = waypoints;
    cumulativeDistsRef.current = calculatePathCumulativeDistances(waypoints);
    travelledMetersRef.current = 0;

    // Set planned turns
    setRouteTurns(turns);
    routeTurnsRef.current = turns;
    setActiveTurn(turns.length > 0 ? turns[0] : null);
    setDistToNextTurnMeters(turns.length > 0 ? turns[0].distanceFromStartMeters : null);
    setBlinkingTurnSignal(null);
    announcedTurnsRef.current = new Set();

    setOriginalBlockedRoute([]);
    setAvoidanceDetourActive(false);
    setAutoStopTriggered(false);
    setTrafficJamZone(null);
    trafficJamRef.current = null;
    setJammedRoadSegment([]);
    setJamAvoidanceDetourActive(false);

    const dist = calculateDistanceMeters(carPosRef.current, targetCoord);
    setDistanceRemainingMeters(dist);
    setHasArrived(false);

    // Don't show obstacles when idle or planning route; obstacles will only appear along the road when car starts moving
    setObstacles([]);
    obstaclesRef.current = [];
    setNearestObstacle(null);
    setNearestDistMeters(null);
  }, []);

  // Proactive Traffic Jam Bypass Handler (রাস্তায় জ্যাম থাকলে গাড়ি আগে থেকেই সেই রোড এড়িয়ে বিকল্প রাস্তায় মোড় নেবে)
  const handleProactiveJamAvoidance = useCallback((jam: TrafficJamZone) => {
    if (jam.bypassed || routeCoordsRef.current.length < 3) return;

    jam.bypassed = true;
    setTrafficJamZone({ ...jam, bypassed: true });
    trafficJamRef.current = { ...jam, bypassed: true };

    const {
      bypassedRoute,
      jammedSegment,
      clearStreetNameBn,
      clearStreetNameEn
    } = generateProactiveJamBypass(
      routeCoordsRef.current,
      carPosRef.current,
      { lat: jam.lat, lng: jam.lng },
      28.0
    );

    setJammedRoadSegment(jammedSegment);
    setOriginalBlockedRoute([...routeCoordsRef.current]);
    setRouteCoordinates(bypassedRoute);
    routeCoordsRef.current = bypassedRoute;
    cumulativeDistsRef.current = calculatePathCumulativeDistances(bypassedRoute);
    travelledMetersRef.current = 0;
    setJamAvoidanceDetourActive(true);

    const street = language === 'bn' ? clearStreetNameBn : clearStreetNameEn;
    const msg =
      language === 'bn'
        ? `🚨 সামনে সড়কে তীব্র যানজট শনাক্ত! গাড়ি আগে থেকেই ${street}-এ মোড় নিয়ে জ্যামযুক্ত রাস্তা এড়িয়ে চলছে।`
        : `🚨 Heavy traffic jam detected ahead! Vehicle proactively turning early onto ${street} to bypass congested road.`;
    setStatusMessage(msg);
    if (voiceVoiceFeedback) {
      speakPrompt(
        language === 'bn'
          ? `সামনে রাস্তায় তীব্র যানজট রয়েছে। গাড়ি আগে থেকেই বিকল্প ফাঁকা রাস্তায় মোড় নিয়ে জ্যাম এড়িয়ে চলছে।`
          : `Traffic jam detected ahead. Proactively taking alternate clear street in advance to avoid delay.`,
        language
      );
    }
  }, [language, voiceVoiceFeedback]);

  // Simulate traffic jam ahead along current driving direction (~60-70 meters ahead)
  const handleSimulateTrafficJamAhead = useCallback(() => {
    if (routeCoordsRef.current.length < 5) return;

    const path = routeCoordsRef.current;
    const cumDists = cumulativeDistsRef.current;
    const currentDist = travelledMetersRef.current;
    const targetAheadDist = currentDist + 65; // ~65 meters in front

    let jamCoord = path[Math.min(path.length - 2, Math.max(2, Math.floor(path.length * 0.5)))];
    for (let i = 0; i < cumDists.length; i++) {
      if (cumDists[i] >= targetAheadDist) {
        jamCoord = path[i];
        break;
      }
    }

    const newJam: TrafficJamZone = {
      id: `traffic-jam-${Date.now()}`,
      lat: jamCoord.lat,
      lng: jamCoord.lng,
      roadNameBn: 'ধানমন্ডি মেইন রোড (তীব্র যানজট)',
      roadNameEn: 'Main Roadway (Congested)',
      radiusMeters: 22.0,
      jammedSegment: [],
      active: true,
      bypassed: false
    };

    setTrafficJamZone(newJam);
    trafficJamRef.current = newJam;
    setJamAvoidanceDetourActive(false);

    const msg =
      language === 'bn'
        ? '🚨 সামনে সড়কে তীব্র যানজট রিপোর্ট করা হয়েছে (৬৫ মি. দূরে)! গাড়ি আগে থেকেই এই রাস্তা এড়িয়ে বিকল্প রোডে চলবে।'
        : '🚨 Severe traffic jam reported ahead (65m away)! Vehicle will proactively bypass this road ahead of time.';
    setStatusMessage(msg);
    if (voiceVoiceFeedback) speakPrompt(msg, language);
  }, [language, voiceVoiceFeedback]);

  // Initial route generation on mount or destination change
  useEffect(() => {
    planRouteTo({ lat: destination.lat, lng: destination.lng });
  }, [destination, planRouteTo]);

  // Initialize Web Speech API for voice command recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        setSpeechTranscript(transcript);
        setIsListening(false);
        handleVoiceCommand(transcript);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        setStatusMessage(
          language === 'bn'
            ? 'কথা বুঝতে সমস্যা হয়েছে। অনুগ্রহ করে আবার বলুন বা সার্চ বক্সে লিখুন।'
            : 'Could not capture voice. Please try speaking again or search below.'
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [language]);

  // Handle voice speech query
  const handleVoiceCommand = (transcript: string) => {
    const query = transcript.toLowerCase();
    setStatusMessage(language === 'bn' ? `আপনি বলেছেন: "${transcript}"` : `You said: "${transcript}"`);

    // Match with presets
    const matched = PRESET_LOCATIONS.find(loc =>
      loc.keywords.some(k => query.includes(k.toLowerCase())) ||
      query.includes(loc.nameBn.toLowerCase()) ||
      query.includes(loc.nameEn.toLowerCase())
    );

    if (matched) {
      setDestination(matched);
      planRouteTo({ lat: matched.lat, lng: matched.lng });
      startDriving();

      const announce =
        language === 'bn'
          ? `গন্তব্য সনাক্ত হয়েছে: ${matched.nameBn}। গাড়ি যাত্রা শুরু করছে।`
          : `Destination confirmed: ${matched.nameEn}. Autonomous vehicle starting.`;
      if (voiceVoiceFeedback) speakPrompt(announce, language);
      setStatusMessage(announce);
    } else {
      // Create search target near current position with offset
      const adhoc = {
        nameBn: transcript,
        nameEn: transcript,
        lat: 23.7500 + (Math.random() - 0.5) * 0.04,
        lng: 90.3900 + (Math.random() - 0.5) * 0.04
      };
      setDestination(adhoc);
      planRouteTo({ lat: adhoc.lat, lng: adhoc.lng });
      startDriving();

      const announce =
        language === 'bn'
          ? `গন্তব্য "${transcript}" নির্ধারণ করা হয়েছে। গাড়ি এগিয়ে যাচ্ছে।`
          : `Destination set to "${transcript}". Navigating now.`;
      if (voiceVoiceFeedback) speakPrompt(announce, language);
      setStatusMessage(announce);
    }
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        language === 'bn'
          ? 'আপনার ব্রাউজার ভয়েস স্পিচ সমর্থন করে না। অনুগ্রহ করে সার্চ বক্স ব্যবহার করুন।'
          : 'Your browser does not support Speech Recognition. Please use the search input.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechTranscript('');
      setStatusMessage(
        language === 'bn'
          ? 'শুনছি... আপনি কোথায় যেতে চান তা বলুন (যেমন: ধানমন্ডি লেক, সংসদ ভবন, শাহবাগ)'
          : 'Listening... Please speak your destination (e.g., Dhanmondi Lake, Parliament)'
      );
      try {
        recognitionRef.current.lang = language === 'bn' ? 'bn-BD' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Voice start failed:', err);
      }
    }
  };

  // Start Autonomous Driving (AUTO RUN)
  const startDriving = () => {
    if (isEngineLockedRef.current) {
      const msg =
        language === 'bn'
          ? '⚠️ ইঞ্জিন লক করা রয়েছে! প্রথমে পেরিমিটার অনুপ্রবেশ অ্যালার্ম আনলক করুন।'
          : '⚠️ Engine is locked! Reset perimeter breach alarm first.';
      setStatusMessage(msg);
      return;
    }
    if (isTumbledRef.current) {
      const msg =
        language === 'bn'
          ? '⚠️ গাড়ি উল্টে রয়েছে! সোজা করতে রিভার্স মোটর পালস বোতাম চাপুন।'
          : '⚠️ Rover is inverted! Execute reverse motor pulse self-righting first.';
      setStatusMessage(msg);
      return;
    }

    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    if (autoStopTriggered) {
      setAutoStopTriggered(false);
    }

    // Ensure road obstacles are dynamically placed along the route for every ride
    if (obstaclesRef.current.filter(o => o.active).length === 0 && routeCoordsRef.current.length >= 8) {
      const freshObs = seedRouteObstacles(routeCoordsRef.current);
      setObstacles(freshObs);
      obstaclesRef.current = freshObs;
    }

    setIsDriving(true);
    isDrivingRef.current = true;
    lastTimestampRef.current = performance.now();
    setHasArrived(false);
    setSpeedKmh(baseCruiseSpeed * 0.7);
    speedKmhRef.current = baseCruiseSpeed * 0.7;
    setAutoFollowMap(true);
    setStatusMessage(
      language === 'bn'
        ? 'অটো রান সক্রিয়: গাড়ি স্বয়ংক্রিয়ভাবে চলছে। বাধা এলে স্পিড কমাবে অথবা বিকল্প ফাঁকা রাস্তা দিয়ে গন্তব্যে পৌঁছাবে।'
        : 'AUTO RUN Active: Vehicle navigating smoothly. Auto speed reduction & clear road detour active.'
    );
  };

  // Trigger 360° Perimeter Breach Alarm (ইঞ্জিন লক, হাই-পিচ অ্যালার্ম ও ফ্ল্যাশার চালু)
  const triggerPerimeterBreach = (distMeters: number) => {
    setIsBreached(true);
    isBreachedRef.current = true;
    setBreachDistanceMeters(distMeters);
    setIsEngineLocked(true);
    isEngineLockedRef.current = true;
    setIsDriving(false);
    isDrivingRef.current = false;
    setSpeedKmh(0);
    speedKmhRef.current = 0;
    setMotorPwmLeft(0);
    setMotorPwmRight(0);
    setSteeringMode('STOP');

    if (isSirenAudibleRef.current) {
      ugvDefensiveAudio.startDefenseSiren();
    }

    const msg =
      language === 'bn'
        ? `🚨 পেরিমিটার অনুপ্রবেশ! রোভারের ২ মিটারের মধ্যে (${distMeters.toFixed(1)}m) অনুপ্রবেশকারী শনাক্ত — ইঞ্জিন লক ও ফ্ল্যাশার সক্রিয়!`
        : `🚨 PERIMETER BREACH! Intruder detected within 2m (${distMeters.toFixed(1)}m) — Engine locked & flashers active!`;
    setStatusMessage(msg);
    if (voiceVoiceFeedback) {
      speakPrompt(
        language === 'bn'
          ? `সতর্কতা! ২ মিটারের মধ্যে অনুপ্রবেশকারী শনাক্ত। ইঞ্জিন লক এবং অ্যালার্ম চালু করা হয়েছে।`
          : `Warning! Perimeter breach detected. Engine locked and defensive alarm engaged.`,
        language
      );
    }
  };

  // Clear Breach & Unlock Engine
  const handleClearBreach = () => {
    ugvDefensiveAudio.stopDefenseSiren();
    setIsBreached(false);
    isBreachedRef.current = false;
    setBreachDistanceMeters(null);
    setIsEngineLocked(false);
    isEngineLockedRef.current = false;
    const msg =
      language === 'bn'
        ? '🛡️ পেরিমিটার পুনরায় সুরক্ষিত করা হয়েছে। ইঞ্জিন আনলক সম্পন্ন।'
        : '🛡️ Perimeter secure. Engine unlocked and ready.';
    setStatusMessage(msg);
  };

  // Simulate Intruder approaching within 2m
  const handleSimulateIntruderBreach = () => {
    triggerPerimeterBreach(1.4);
  };

  // Simulate Rollover (180° Inversion / উল্টে যাওয়া)
  const handleSimulateRollover = () => {
    setRollAngleDeg(180);
    setIsTumbled(true);
    isTumbledRef.current = true;
    setIsDriving(false);
    isDrivingRef.current = false;
    setSpeedKmh(0);
    speedKmhRef.current = 0;
    setMotorPwmLeft(0);
    setMotorPwmRight(0);
    setSteeringMode('STOP');

    const msg =
      language === 'bn'
        ? '🚨 TUMBLE ALERT: গাড়ি ১৮০° উল্টে গেছে! রিভার্স মোটর পালস দিয়ে সোজা করার অ্যালগরিদম কার্যকর করুন।'
        : '🚨 TUMBLE ALERT: Vehicle inverted 180°! Execute reverse motor pulse to self-right.';
    setStatusMessage(msg);
    if (voiceVoiceFeedback) {
      speakPrompt(
        language === 'bn'
          ? 'টাম্বল অ্যালার্ট! গাড়িটি উল্টে গেছে। রিভার্স মোটর পালস অ্যালগরিদম প্রস্তুত।'
          : 'Tumble alert! Vehicle rollover detected. Reverse motor pulse algorithm standing by.',
        language
      );
    }

    if (autoSelfRightEnabled) {
      setTimeout(() => {
        handleExecuteSelfRighting();
      }, 1200);
    }
  };

  // Execute Kinetic Self-Righting via Reverse Motor Pulse
  const handleExecuteSelfRighting = () => {
    if (isSelfRightingActive) return;
    setIsSelfRightingActive(true);
    ugvDefensiveAudio.playKineticRightingPulse();

    setSelfRightingPhase(
      language === 'bn'
        ? 'পালস ১: হাই-টর্ক রিভার্স মোটর বিস্ফোরণ (PWM 255)'
        : 'Pulse 1: High-Torque Reverse Motor Burst (PWM 255)'
    );
    setMotorPwmLeft(255);
    setMotorPwmRight(255);
    setSteeringMode('STOP');

    setTimeout(() => {
      setSelfRightingPhase(
        language === 'bn'
          ? 'পালস ২: কাউন্টার-মোমেন্টাম কৌণিক টর্ক কিক'
          : 'Pulse 2: Counter-Momentum Angular Torque Kick'
      );
      ugvDefensiveAudio.playKineticRightingPulse();
      setRollAngleDeg(90);
    }, 450);

    setTimeout(() => {
      setSelfRightingPhase(
        language === 'bn'
          ? 'পালস ৩: কাইনেটিক ফ্লিপ ও ব্যালান্সিং'
          : 'Pulse 3: Kinetic Flip & Alignment'
      );
      setRollAngleDeg(25);
    }, 900);

    setTimeout(() => {
      setRollAngleDeg(0);
      setIsTumbled(false);
      isTumbledRef.current = false;
      setIsSelfRightingActive(false);
      setSelfRightingPhase(
        language === 'bn' ? '✓ গাড়ি সফলভাবে সোজা হয়েছে!' : '✓ Vehicle successfully upright!'
      );
      setMotorPwmLeft(0);
      setMotorPwmRight(0);
      setSteeringMode('STOP');

      const doneMsg =
        language === 'bn'
          ? '✅ রিভার্স মোটর পালস সফল! গাড়ি সোজা হয়েছে এবং ড্রাইভের জন্য প্রস্তুত।'
          : '✅ Self-righting complete! Rover upright and ready to navigate.';
      setStatusMessage(doneMsg);
      if (voiceVoiceFeedback) {
        speakPrompt(
          language === 'bn'
            ? 'রিভার্স মোটর পালস সফল হয়েছে। গাড়ি সোজা এবং সুরক্ষিত।'
            : 'Self-righting algorithm completed. Rover is upright and secure.',
          language
        );
      }
    }, 1400);
  };

  // Stop/Halt Autonomous Driving
  const stopDriving = () => {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setIsDriving(false);
    isDrivingRef.current = false;
    setSpeedKmh(0);
    speedKmhRef.current = 0;
    setMotorPwmLeft(0);
    setMotorPwmRight(0);
    setSteeringMode('STOP');
    if (onEmergencyStop) onEmergencyStop();
  };

  // Manual trigger: Drop dynamic sudden obstacle 18-25m in front of vehicle
  const handleDropSuddenObstacle = () => {
    const headingRad = (carHeadingRef.current * Math.PI) / 180;
    const metersToLat = 1 / 111320;
    const metersToLng = 1 / (111320 * Math.cos((carPosRef.current.lat * Math.PI) / 180));
    const distMeters = 20;

    const obsLat = carPosRef.current.lat + Math.cos(headingRad) * distMeters * metersToLat;
    const obsLng = carPosRef.current.lng + Math.sin(headingRad) * distMeters * metersToLng;

    const randomTypes: Array<{ type: MapObstacle['type']; labelBn: string; labelEn: string; icon: string; radius: number }> = [
      { type: 'pedestrian', labelBn: 'হঠাৎ আসা পথচারী', labelEn: 'Sudden Pedestrian', icon: '🚶', radius: 6.0 },
      { type: 'vehicle', labelBn: 'রাস্তায় স্থবির গাড়ি', labelEn: 'Blocked Car', icon: '🚗', radius: 8.0 },
      { type: 'construction', labelBn: 'রাস্তা সংস্কার কাজ ও ব্যারিকেড', labelEn: 'Road Construction', icon: '🚧', radius: 9.5 },
      { type: 'barrier', labelBn: 'ট্রাফিক ব্যারিকেড', labelEn: 'Traffic Barrier', icon: '🛑', radius: 7.0 }
    ];
    const picked = randomTypes[Math.floor(Math.random() * randomTypes.length)];

    const newObstacle: MapObstacle = {
      id: `dynamic-obs-${Date.now()}`,
      lat: obsLat,
      lng: obsLng,
      type: picked.type,
      labelBn: picked.labelBn,
      labelEn: picked.labelEn,
      radiusMeters: picked.radius,
      icon: picked.icon,
      active: true
    };

    setObstacles(prev => [...prev, newObstacle]);

    const msg =
      language === 'bn'
        ? `⚠️ নতুন বাধা সনাক্ত! সামনে ${newObstacle.labelBn} যুক্ত করা হয়েছে।`
        : `⚠️ New obstacle ahead! ${newObstacle.labelEn} placed in path.`;
    setStatusMessage(msg);
    if (voiceVoiceFeedback) speakPrompt(msg, language);
  };

  // Clear all obstacles & traffic jams
  const handleClearAllObstacles = () => {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setObstacles([]);
    setAutoStopTriggered(false);
    setAvoidanceDetourActive(false);
    setNearestObstacle(null);
    setNearestDistMeters(null);
    setTrafficJamZone(null);
    trafficJamRef.current = null;
    setJammedRoadSegment([]);
    setJamAvoidanceDetourActive(false);
    const msg = language === 'bn' ? 'সব বাধা ও ট্রাফিক জ্যাম মুছে ফেলা হয়েছে। পথ এখন সম্পূর্ণ মুক্ত।' : 'All obstacles and traffic jams cleared. Roadway is clear.';
    setStatusMessage(msg);
  };

  // Re-plan and bypass when Auto Stop is triggered: smoothly take turn onto clear road
  const handleRerouteAroundObstacle = () => {
    const targetObs = nearestObstacle || obstaclesRef.current.find(o => o.active);
    if (!targetObs || routeCoordsRef.current.length < 2) return;

    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }

    // Deactivate obstacle so it won't trigger again
    targetObs.active = false;
    obstaclesRef.current = obstaclesRef.current.map(o => o.id === targetObs.id ? { ...o, active: false } : o);
    setObstacles([...obstaclesRef.current]);

    // Trigger Auto Path Finder detour algorithm from current car position
    const currentPath = routeCoordsRef.current;
    setOriginalBlockedRoute([...currentPath]);
    const detoured = generateObstacleAvoidanceDetour(currentPath, targetObs, 'right', 16.0, carPosRef.current);
    setRouteCoordinates(detoured);
    routeCoordsRef.current = detoured;
    cumulativeDistsRef.current = calculatePathCumulativeDistances(detoured);
    travelledMetersRef.current = 0;

    setAvoidanceDetourActive(true);
    setAutoStopTriggered(false);
    startDriving();

    const msg =
      language === 'bn'
        ? '⚡ বিকল্প ফাঁকা রাস্তা নিশ্চিত। গাড়ি আস্তে আস্তে মোড় নিয়ে গন্তব্যের দিকে এগিয়ে যাচ্ছে।'
        : '⚡ Clear detour confirmed. Vehicle turning smoothly onto clear route toward destination.';
    setStatusMessage(msg);
    if (voiceVoiceFeedback) speakPrompt(msg, language);
  };

  // Map Click Handler (Destination selection OR Obstacle placement)
  const handleMapClick = (e: any) => {
    if (!e.detail?.latLng) return;
    const clickedLat = e.detail.latLng.lat;
    const clickedLng = e.detail.latLng.lng;

    if (placementMode) {
      const newObs: MapObstacle = {
        id: `placed-obs-${Date.now()}`,
        lat: clickedLat,
        lng: clickedLng,
        type: 'barrier',
        labelBn: 'কাস্টম ব্যারিকেড',
        labelEn: 'Placed Barrier',
        radiusMeters: 7.0,
        icon: '🛑',
        active: true
      };
      setObstacles(prev => [...prev, newObs]);
      setPlacementMode(false);
      const msg =
        language === 'bn'
          ? 'ম্যাপে ব্যারিকেড স্থাপন করা হয়েছে। অটোনোমাস সিস্টেম সতর্ক।'
          : 'Barrier placed on map. Autonomous system standing by.';
      setStatusMessage(msg);
    } else {
      const customDest = {
        nameBn: `কাস্টম পিন (${clickedLat.toFixed(4)}, ${clickedLng.toFixed(4)})`,
        nameEn: `Target Pin (${clickedLat.toFixed(4)}, ${clickedLng.toFixed(4)})`,
        lat: clickedLat,
        lng: clickedLng
      };
      setDestination(customDest);
      planRouteTo({ lat: clickedLat, lng: clickedLng });
      const msg =
        language === 'bn'
          ? `ম্যাপে নতুন টার্গেট পিন সিলেক্ট করা হয়েছে। ড্রাইভ শুরু করতে 'গাড়ি চালান' চাপুন।`
          : `New target pin selected on map. Click 'Start Vehicle' to drive.`;
      setStatusMessage(msg);
    }
  };

  // =========================================================================
  // SILKY SMOOTH 60 FPS AUTONOMOUS DRIVING & VEHICLE LOCATION UPDATE LOOP
  // =========================================================================
  useEffect(() => {
    if (!isDriving) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    let lastSensorCheckTime = 0;

    const smoothStep = (timestamp: number) => {
      if (!isDrivingRef.current || isEngineLockedRef.current || isTumbledRef.current) {
        if (isEngineLockedRef.current || isTumbledRef.current) {
          setIsDriving(false);
          isDrivingRef.current = false;
          setSpeedKmh(0);
          speedKmhRef.current = 0;
          setMotorPwmLeft(0);
          setMotorPwmRight(0);
          setSteeringMode('STOP');
        }
        return;
      }

      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      // Delta time calculation in seconds (capped to 0.05s to prevent warping on tab switch)
      const deltaSec = Math.min(0.05, (timestamp - lastTimestampRef.current) / 1000);
      lastTimestampRef.current = timestamp;

      const path = routeCoordsRef.current;
      const cumulativeDists = cumulativeDistsRef.current;

      if (path.length >= 2 && cumulativeDists.length >= 2) {
        const totalPathLength = cumulativeDists[cumulativeDists.length - 1];

        // 1. Check obstacles and safety every ~100ms
        let closestObs: MapObstacle | null = null;
        let closestDist = Infinity;

        if (timestamp - lastSensorCheckTime > 100) {
          lastSensorCheckTime = timestamp;

          for (const obs of obstaclesRef.current) {
            if (!obs.active) continue;
            const d = calculateDistanceMeters(carPosRef.current, { lat: obs.lat, lng: obs.lng });
            if (d < closestDist) {
              closestDist = d;
              closestObs = obs;
            }
          }

          setNearestObstacle(closestObs);
          setNearestDistMeters(closestDist < 100 ? Math.round(closestDist * 10) / 10 : null);

          // 1.5. 360° GEOFENCE PERIMETER DEFENSE (রোভারের ২ মিটারের মধ্যে অসৎ উদ্দেশ্যে এলে অ্যালার্ম ও ইঞ্জিন লক)
          if (
            isPerimeterArmedRef.current &&
            !isBreachedRef.current &&
            closestObs &&
            closestDist <= 2.0
          ) {
            triggerPerimeterBreach(closestDist);
            return;
          }

          // 2. PROACTIVE TRAFFIC JAM SCANNER (রাস্তায় জ্যাম থাকলে গাড়ি আগে থেকেই সেই রোড এড়িয়ে বিকল্প রাস্তায় মোড় নেবে)
          if (trafficJamRef.current && trafficJamRef.current.active && !trafficJamRef.current.bypassed) {
            const distToJam = calculateDistanceMeters(carPosRef.current, {
              lat: trafficJamRef.current.lat,
              lng: trafficJamRef.current.lng
            });
            // Proactively bypass when traffic jam is detected 25m - 85m ahead
            if (distToJam >= 25 && distToJam <= 85) {
              handleProactiveJamAvoidance(trafficJamRef.current);
            }
          }

          // 3. ROAD TURN MANEUVERS SCANNER (মাঝে মাঝে ১ বা ২টি ক্ষেত্রে নির্দিষ্ট দিকে মোড় নেওয়া)
          const turns = routeTurnsRef.current;
          let nextTurn: RouteTurnManeuver | null = null;
          let minTurnDist = Infinity;

          for (const turn of turns) {
            if (turn.completed) continue;
            const d = calculateDistanceMeters(carPosRef.current, turn.location);
            if (d < minTurnDist) {
              minTurnDist = d;
              nextTurn = turn;
            }
          }

          if (nextTurn) {
            setActiveTurn(nextTurn);
            setDistToNextTurnMeters(Math.round(minTurnDist));

            // Within 35m of turn: activate blinking turn indicator signal & announce once
            if (minTurnDist <= 35) {
              setBlinkingTurnSignal(nextTurn.direction === 'LEFT' ? 'LEFT' : 'RIGHT');

              if (!announcedTurnsRef.current.has(nextTurn.id)) {
                announcedTurnsRef.current.add(nextTurn.id);
                const turnVoice =
                  language === 'bn'
                    ? `সামনে ${Math.round(minTurnDist)} মিটারে ${nextTurn.direction === 'LEFT' ? 'বামে' : 'ডানে'} মোড় নিন`
                    : `In ${Math.round(minTurnDist)} meters, ${nextTurn.direction === 'LEFT' ? 'turn left' : 'turn right'}`;
                if (voiceVoiceFeedback) speakPrompt(turnVoice, language);
              }
            } else {
              setBlinkingTurnSignal(null);
            }

            // Mark turn completed once car passes it (within 5.5m)
            if (minTurnDist < 5.5) {
              nextTurn.completed = true;
              setBlinkingTurnSignal(null);
            }
          } else {
            setActiveTurn(null);
            setDistToNextTurnMeters(null);
            setBlinkingTurnSignal(null);
          }

          // 4. CRITICAL AUTO STOP EVALUATION (বাধা ৫.৫ মিটারের মধ্যে এলে গাড়ি গতি কমিয়ে নিরাপদে দাঁড়িয়ে যাবে)
          const criticalStopDistance = 5.5;
          if (autoStopEnabled && closestObs && closestDist <= criticalStopDistance) {
            setIsDriving(false);
            isDrivingRef.current = false;
            setAutoStopTriggered(true);
            setSpeedKmh(0);
            speedKmhRef.current = 0;
            setMotorPwmLeft(0);
            setMotorPwmRight(0);
            setSteeringMode('STOP');
            setSpeedGovernorState('AUTO_STOP');
            setThrottlePercent(0);

            const stopMsg =
              language === 'bn'
                ? `🛑 গতি কমিয়ে নিরাপদে গাড়ি দাঁড়িয়েছে! সামনে ${closestObs.labelBn} (${closestDist.toFixed(1)} মি.)।`
                : `🛑 Speed reduced to safe halt! Hazard ahead: ${closestObs.labelEn} at ${closestDist.toFixed(1)}m.`;
            setStatusMessage(stopMsg);
            if (voiceVoiceFeedback) {
              speakPrompt(
                language === 'bn'
                  ? `সামনে বাধা। গাড়ি গতি কমিয়ে নিরাপদে দাঁড়িয়েছে।`
                  : `Warning! Hazard ahead. Vehicle halted safely.`,
                language
              );
            }

            // AUTO RUN: After 2.5s safe stop, automatically turn around obstacle onto clear alternate road
            if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
            autoResumeTimerRef.current = setTimeout(() => {
              handleRerouteAroundObstacle();
            }, 2500);

            return;
          }

          // 5. AUTO PATH FINDER DYNAMIC DETOUR (বাধা একটু সামনে থাকতেই গতি কমিয়ে আস্তে আস্তে মোড় নিয়ে ফাঁকা রাস্তায় যাওয়া)
          if (
            autoPathFinderEnabled &&
            closestObs &&
            closestDist > criticalStopDistance &&
            closestDist <= 24.0 &&
            !avoidanceDetourActive
          ) {
            const pathHazard = findObstacleOnPath(path, [closestObs], 9.0);
            if (pathHazard) {
              // Deactivate obstacle so it doesn't re-trigger detour
              closestObs.active = false;
              obstaclesRef.current = obstaclesRef.current.map(o => o.id === closestObs!.id ? { ...o, active: false } : o);
              setObstacles([...obstaclesRef.current]);

              setOriginalBlockedRoute([...path]);
              const detourPath = generateObstacleAvoidanceDetour(path, closestObs, 'right', 16.0, carPosRef.current);
              setRouteCoordinates(detourPath);
              routeCoordsRef.current = detourPath;
              cumulativeDistsRef.current = calculatePathCumulativeDistances(detourPath);
              travelledMetersRef.current = 0;
              setAvoidanceDetourActive(true);

              const rerouteMsg =
                language === 'bn'
                  ? `⚡ গতি কমিয়ে আস্তে আস্তে মোড় নেওয়া হচ্ছে... বিকল্প ফাঁকা রাস্তা দিয়ে গন্তব্যের দিকে যাওয়া হচ্ছে!`
                  : `⚡ Reducing speed and smoothly turning onto clear alternate road toward destination!`;
              setStatusMessage(rerouteMsg);
              if (voiceVoiceFeedback) {
                speakPrompt(
                  language === 'bn'
                    ? `সামনে বাধা। গতি কমিয়ে আস্তে আস্তে মোড় নিয়ে ফাঁকা রাস্তা দিয়ে গন্তব্যে যাওয়া হচ্ছে।`
                    : `Obstacle ahead. Reducing speed and smoothly turning onto clear road.`,
                  language
                );
              }
            }
          }
        }

        // 4. DYNAMIC SPEED GOVERNOR COMPUTATION
        let activeSpeed = baseCruiseSpeed;
        if (autoSpeedAdjustEnabled) {
          const speedResult = computeAutoAdjustedSpeed(
            baseCruiseSpeed,
            0,
            closestDist < 25 ? closestDist : null,
            5.5
          );
          activeSpeed = speedResult.targetSpeedKmh;
          setSpeedGovernorState(speedResult.governorState);
          setThrottlePercent(speedResult.throttlePercent);
        } else {
          setSpeedGovernorState('CRUISE');
          setThrottlePercent(100);
        }

        setSpeedKmh(activeSpeed);
        speedKmhRef.current = activeSpeed;

        // 5. SMOOTH SUB-SEGMENT ADVANCEMENT (Distance = Speed * Time)
        const speedMps = (activeSpeed * 1000) / 3600; // km/h to m/s
        const distanceStepMeters = speedMps * deltaSec;
        travelledMetersRef.current += distanceStepMeters;

        // Interpolate smooth continuous position and heading along the polyline
        const {
          position: interpolatedPos,
          heading: targetHeading,
          isEnd,
          remainingMeters
        } = interpolatePositionAlongPath(path, cumulativeDists, travelledMetersRef.current);

        // Smooth angle lerp for vehicle chassis rotation
        const smoothlyTurnedHeading = smoothAngleLerp(carHeadingRef.current, targetHeading, 0.16);

        // Update Car Position & Heading smoothly
        carPosRef.current = interpolatedPos;
        carHeadingRef.current = smoothlyTurnedHeading;
        setCarPosition(interpolatedPos);
        setCarHeading(smoothlyTurnedHeading);
        setDistanceRemainingMeters(Math.round(remainingMeters));

        // Differential motor PWM steering based on turn sharpness
        const headingDeflection = ((targetHeading - smoothlyTurnedHeading + 540) % 360) - 180;
        let steer: 'STRAIGHT' | 'LEFT' | 'RIGHT' | 'STOP' = 'STRAIGHT';
        const basePwm = Math.round((activeSpeed / 30) * 220 + 35);
        let pwmL = basePwm;
        let pwmR = basePwm;

        if (headingDeflection < -8) {
          steer = 'LEFT';
          pwmL = Math.max(70, Math.round(basePwm * 0.6));
          pwmR = Math.min(255, Math.round(basePwm * 1.2));
        } else if (headingDeflection > 8) {
          steer = 'RIGHT';
          pwmL = Math.min(255, Math.round(basePwm * 1.2));
          pwmR = Math.max(70, Math.round(basePwm * 0.6));
        }

        setSteeringMode(steer);
        setMotorPwmLeft(pwmL);
        setMotorPwmRight(pwmR);

        // 6. DESTINATION ARRIVAL CHECK
        if (isEnd || travelledMetersRef.current >= totalPathLength) {
          setIsDriving(false);
          isDrivingRef.current = false;
          setHasArrived(true);
          setSpeedKmh(0);
          speedKmhRef.current = 0;
          setMotorPwmLeft(0);
          setMotorPwmRight(0);
          setSteeringMode('STOP');
          setDistanceRemainingMeters(0);
          setSpeedGovernorState('CRUISE');

          const destName = language === 'bn' ? destination.nameBn : destination.nameEn;
          const msg =
            language === 'bn'
              ? `অভিনন্দন! গাড়ি সফলভাবে ${destName} গন্তব্যে মসৃণভাবে পৌঁছে গেছে।`
              : `Success! Autonomous vehicle arrived smoothly at ${destName}.`;
          setStatusMessage(msg);
          if (voiceVoiceFeedback) speakPrompt(msg, language);
          return;
        }
      }

      // Schedule next 60 FPS frame
      animFrameRef.current = requestAnimationFrame(smoothStep);
    };

    animFrameRef.current = requestAnimationFrame(smoothStep);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    isDriving,
    autoStopEnabled,
    obstacleAvoidanceEnabled,
    autoPathFinderEnabled,
    autoSpeedAdjustEnabled,
    baseCruiseSpeed,
    avoidanceDetourActive,
    destination,
    language,
    voiceVoiceFeedback
  ]);

  // Filter preset locations by search
  const filteredPresets = PRESET_LOCATIONS.filter(loc =>
    loc.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // WebSerial Connect Simulation / Bridge
  const handleConnectSerial = async () => {
    if ('serial' in navigator) {
      try {
        await (navigator as any).serial.requestPort();
        setSerialConnected(true);
        setStatusMessage(
          language === 'bn'
            ? 'ইউএসবি হার্ডওয়্যার (Arduino/ESP32) সংযুক্ত হয়েছে। মোটর কমান্ড সরাসরি ট্রান্সমিট হচ্ছে।'
            : 'USB Hardware (Arduino/ESP32) connected! Motor PWM streaming.'
        );
      } catch (err) {
        setSerialConnected(prev => !prev);
      }
    } else {
      setSerialConnected(prev => !prev);
    }
  };

  // Calculate ETA in minutes & seconds based on current speed or cruise speed
  const activeSpeedForEta = speedKmh > 3 ? speedKmh : baseCruiseSpeed;
  const etaTotalSeconds = distanceRemainingMeters > 0 ? Math.round((distanceRemainingMeters / (activeSpeedForEta * 1000 / 3600))) : 0;
  const etaMinutes = Math.floor(etaTotalSeconds / 60);
  const etaSeconds = etaTotalSeconds % 60;
  const totalPathLength = cumulativeDistsRef.current.length > 0 ? cumulativeDistsRef.current[cumulativeDistsRef.current.length - 1] : 0;
  const tripProgress = totalPathLength > 0 ? Math.min(100, Math.max(0, Math.round((travelledMetersRef.current / totalPathLength) * 100))) : 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* 1. Ultra-Compact 3D Cockpit Header & Navigation Strip */}
      <div
        className={`px-3 py-2 rounded-2xl border-2 transition-all ${
          isLight
            ? 'bg-gradient-to-r from-white via-indigo-50 to-cyan-50 border-indigo-300 text-slate-800 shadow-[0_4px_20px_rgba(99,102,241,0.15)]'
            : 'bg-gradient-to-r from-[#0d162d] via-[#1a1236] to-[#0e1c2e] border-indigo-500/50 text-slate-100 shadow-[0_4px_25px_rgba(99,102,241,0.25)]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* 3D Search Box with Integrated Voice Mic */}
          <div className="relative flex-1 min-w-[240px] max-w-xl">
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none text-cyan-400">
                <Search className="w-3.5 h-3.5" />
              </div>

              <input
                type="text"
                id="input-location-search"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={
                  language === 'bn'
                    ? 'গন্তব্য খুঁজুন বা মুখে বলুন (যেমন: ধানমন্ডি)...'
                    : 'Search destination or speak...'
                }
                className={`w-full pl-8.5 pr-22 py-2 text-xs sm:text-sm font-medium rounded-xl border-2 transition-all focus:outline-hidden shadow-inner ${
                  isLight
                    ? 'bg-white border-indigo-400 text-slate-950 placeholder:text-slate-600 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/30'
                    : 'bg-[#070e20] border-indigo-500/60 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40'
                }`}
              />

              {/* Right Tools: Clear & 3D Colorful Voice Mic */}
              <div className="absolute right-1.5 flex items-center gap-1">
                {searchQuery.trim().length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* 3D Tactile Colorful Voice Mic */}
                <button
                  id="btn-voice-listen"
                  onClick={toggleListening}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-black transition-all active:translate-y-0.5 active:shadow-none cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400 shadow-[0_2px_0_#9f1239]'
                      : 'bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-[0_2px_0_#9f1239]'
                  }`}
                  title={language === 'bn' ? 'মুখে বলুন কোথায় যেতে চান' : 'Speak destination'}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 animate-bounce" />
                      <span className="font-bengali font-black">{language === 'bn' ? 'শুনছি...' : 'Rec...'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span className="font-bengali font-black">{language === 'bn' ? 'ভয়েস' : 'Voice'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && searchQuery.trim().length > 0 && (
              <div
                className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border-2 shadow-2xl z-50 max-h-56 overflow-y-auto ${
                  isLight ? 'bg-white border-indigo-300 text-slate-900' : 'bg-[#091124] border-indigo-500/60 text-slate-100 shadow-[0_10px_25px_rgba(0,0,0,0.8)]'
                }`}
              >
                {filteredPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setDestination(preset);
                      planRouteTo({ lat: preset.lat, lng: preset.lng });
                      setSearchQuery('');
                      setShowSuggestions(false);
                      startDriving();
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between border-b last:border-b-0 hover:bg-cyan-500/20 transition-colors cursor-pointer ${
                      isLight ? 'border-slate-200 text-slate-900' : 'border-indigo-900/50 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <span className="font-bengali font-bold">{language === 'bn' ? preset.nameBn : preset.nameEn}</span>
                    </div>
                    <span className="text-xs text-cyan-700 dark:text-cyan-300 font-black flex items-center gap-1 font-bengali">
                      <span>{language === 'bn' ? 'ড্রাইভ' : 'Go'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>



          {/* Master 3D Actions: Start/Stop + Voice Prompt + Help */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Tactile Extruded 3D Master Drive Button */}
            {isDriving ? (
              <button
                id="btn-stop-car"
                onClick={stopDriving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-b from-rose-600 to-rose-800 border-t border-rose-300 shadow-[0_3px_0_#881337] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer font-bengali"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{language === 'bn' ? 'গাড়ি থামান' : 'Halt'}</span>
              </button>
            ) : (
              <button
                id="btn-start-drive"
                onClick={startDriving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-b from-emerald-500 to-emerald-700 border-t border-emerald-300 shadow-[0_3px_0_#064e3b] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer font-bengali"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{language === 'bn' ? 'গাড়ি চালান' : 'Start Drive'}</span>
              </button>
            )}

            {/* Speech Audio Toggle */}
            <button
              onClick={() => setVoiceFeedback(prev => !prev)}
              className={`p-2 rounded-xl border-2 text-xs shadow-xs active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
                voiceVoiceFeedback
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-[0_2px_0_#b45309]'
                  : isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-950'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
              }`}
              title={voiceVoiceFeedback ? 'ভয়েস প্রম্পট অন' : 'ভয়েস প্রম্পট অফ'}
            >
              {voiceVoiceFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Guide */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-xl border-2 border-cyan-500 bg-cyan-600 hover:bg-cyan-500 text-white text-xs shadow-[0_2px_0_#0e7490] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              title="সহজ নির্দেশিকা"
            >
              <HelpCircle className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Live Status Ribbon with High Contrast */}
        <div className="mt-2.5 pt-2 border-t border-indigo-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                autoStopTriggered
                  ? 'bg-rose-600 animate-ping'
                  : isDriving
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-cyan-500'
              }`}
            ></span>
            <span
              className={`truncate font-bengali text-xs sm:text-sm font-extrabold ${
                autoStopTriggered
                  ? isLight ? 'text-rose-700' : 'text-rose-300'
                  : isDriving
                    ? isLight ? 'text-emerald-800' : 'text-emerald-300'
                    : isLight
                      ? 'text-slate-900'
                      : 'text-cyan-200'
              }`}
            >
              {statusMessage}
            </span>
          </div>

          <div className="shrink-0 text-xs font-mono font-bold hidden sm:flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full border ${
              isLight ? 'bg-indigo-100 text-indigo-950 border-indigo-300' : 'bg-indigo-950 text-indigo-200 border-indigo-400'
            }`}>
              {isDriving ? (avoidanceDetourActive ? 'DETOUR_ACTIVE' : 'AUTONOMOUS_CRUISE') : 'STANDBY'}
            </span>
            <span className={isLight ? 'text-emerald-800 font-black' : 'text-emerald-400 font-black'}>• 60FPS LERP</span>
          </div>
        </div>
      </div>

      {/* Critical Auto Stop Safe Intervention Banner (Compact Alert) */}
      {autoStopTriggered && nearestObstacle && (
        <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg flex items-center justify-between gap-2 animate-pulse text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🛑</span>
            <span className="font-bold font-bengali">
              {language === 'bn' ? `জরুরি অটো স্টপ! সামনে ${nearestObstacle.labelBn} (${nearestDistMeters}m)` : `Auto Stopped at ${nearestObstacle.labelEn}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRerouteAroundObstacle}
              className="px-2.5 py-1 rounded-lg bg-white text-rose-700 font-bold text-[11px] shadow-sm active:scale-95 cursor-pointer font-bengali"
            >
              {language === 'bn' ? 'বিকল্প পথ' : 'Bypass'}
            </button>
            <button
              onClick={() => {
                handleClearAllObstacles();
                startDriving();
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-800 text-white font-bold text-[11px] border border-rose-400 cursor-pointer font-bengali"
            >
              {language === 'bn' ? 'মুছে এগোন' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Integrated 3D Autonomous Cockpit Deck (Left: 3D Telemetry & Actions, Right: 3D Google Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* LEFT COLUMN: Ultra-Compact 3D Telemetry & Tactical Action Console */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-2 order-2 lg:order-1">
          {/* PANEL 1: Twin 3D Digital Gauges (Speedometer & Gyro Compass) */}
          <div
            className={`p-2.5 rounded-2xl border-2 transition-all ${
              isLight
                ? 'bg-gradient-to-br from-white via-cyan-50/70 to-indigo-50/70 border-cyan-400/80 text-slate-800 shadow-[0_4px_20px_rgba(6,182,212,0.18)]'
                : 'bg-gradient-to-br from-[#0a1428] via-[#101b3b] to-[#070f1e] border-cyan-500/40 text-slate-100 shadow-[0_4px_25px_rgba(6,182,212,0.2)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold pb-1.5 mb-2 font-bengali border-b border-cyan-500/30">
              <span className="flex items-center gap-1.5 text-cyan-400 font-extrabold">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>৩ডি স্পিডোমিটার ও জাইরো কম্পাস</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                speedGovernorState === 'AUTO_STOP'
                  ? 'bg-rose-500/25 text-rose-300 border-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  : speedGovernorState === 'DECELERATE_OBSTACLE'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              }`}>
                {speedGovernorState === 'AUTO_STOP' ? 'STOP' : speedGovernorState === 'DECELERATE_OBSTACLE' ? 'SLOW' : 'CRUISE'}
              </span>
            </div>

            {/* Twin Gauges Grid */}
            <div className="grid grid-cols-2 gap-2 items-center">
              {/* Gauge A: 3D Radial Speedometer SVG with Neon Glow */}
              <div className="relative flex flex-col items-center justify-center p-1.5 rounded-xl bg-[#050c1b] border-2 border-cyan-500/40 shadow-[inset_0_2px_8px_rgba(6,182,212,0.3)]">
                <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Outer Bezel Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={isLight ? '#c7d2fe' : '#1e293b'}
                    strokeWidth="7"
                    strokeDasharray="188"
                    strokeDashoffset="47"
                    strokeLinecap="round"
                  />
                  {/* Dynamic Glowing Colorful Speed Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={
                      speedGovernorState === 'AUTO_STOP'
                        ? '#f43f5e'
                        : speedGovernorState === 'DECELERATE_OBSTACLE'
                          ? '#f59e0b'
                          : '#06b6d4'
                    }
                    strokeWidth="7"
                    strokeDasharray="188"
                    strokeDashoffset={188 - (Math.min(100, (speedKmh / (baseCruiseSpeed || 25)) * 100) / 100) * 141}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                    filter="drop-shadow(0 0 4px currentColor)"
                  />
                </svg>

                {/* Center Digital Speed Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black font-mono tracking-tight text-cyan-300 leading-none drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                    {speedKmh.toFixed(1)}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400/90 font-black uppercase mt-0.5">
                    km/h
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold mt-0.5">
                    {throttlePercent}% Pwr
                  </span>
                </div>
              </div>

              {/* Gauge B: 3D Rotating Gyro Compass Dial with High Contrast */}
              <div className="relative flex flex-col items-center justify-center p-1.5 rounded-xl bg-[#050c1b] border-2 border-indigo-500/40 shadow-[inset_0_2px_8px_rgba(99,102,241,0.3)]">
                <div
                  className="w-24 h-24 rounded-full border border-indigo-500/50 bg-gradient-to-b from-[#0e1738] to-[#040817] relative flex items-center justify-center transition-transform duration-150 ease-out shadow-inner"
                  style={{ transform: `rotate(${-carHeading}deg)` }}
                >
                  {/* Cardinal Points in Vibrant Colors */}
                  <span className="absolute top-1 text-[10px] font-black text-rose-500 font-mono drop-shadow-[0_0_4px_rgba(244,63,94,0.8)]">N</span>
                  <span className="absolute bottom-1 text-[9px] font-bold text-cyan-400 font-mono">S</span>
                  <span className="absolute right-1.5 text-[9px] font-bold text-cyan-400 font-mono">E</span>
                  <span className="absolute left-1.5 text-[9px] font-bold text-cyan-400 font-mono">W</span>
                  {/* Crosshairs */}
                  <div className="w-full h-px bg-indigo-500/30 absolute"></div>
                  <div className="h-full w-px bg-indigo-500/30 absolute"></div>
                </div>

                {/* Center Direction Arrow */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Navigation className="w-5 h-5 text-emerald-400 fill-emerald-400 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                  <span className="text-[9px] font-mono font-black text-amber-300 mt-1 bg-black/80 px-1.5 py-0.2 rounded-full border border-amber-400/50">
                    {Math.round(carHeading)}°
                  </span>
                </div>
              </div>
            </div>

            {/* Target Destination & ETA Bar with Rich Gradients */}
            <div className="mt-2 pt-2 border-t border-cyan-500/30 flex items-center justify-between text-[11px] font-bengali">
              <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-bounce" />
                <span className="truncate font-black text-cyan-200">{destination.nameBn}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-emerald-400 font-black">
                <span>{distanceRemainingMeters > 1000 ? `${(distanceRemainingMeters / 1000).toFixed(2)}km` : `${Math.round(distanceRemainingMeters)}m`}</span>
                <span className="text-cyan-300/80 font-normal">| {etaMinutes}m {etaSeconds}s</span>
              </div>
            </div>
            {/* Multi-Color Trip Progress Bar */}
            <div className="w-full bg-[#050c1b] rounded-full h-2 mt-1.5 overflow-hidden p-0.5 border border-indigo-500/30">
              <div
                className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-fuchsia-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                style={{ width: `${tripProgress}%` }}
              ></div>
            </div>
          </div>

          {/* PANEL 2: Differential Motors & Steering Telemetry (Colorful Teal & Purple) */}
          <div
            className={`p-2.5 rounded-2xl border-2 transition-all ${
              isLight
                ? 'bg-gradient-to-br from-white via-teal-50/70 to-emerald-50/70 border-teal-400/80 text-slate-800 shadow-[0_4px_20px_rgba(20,184,166,0.18)]'
                : 'bg-gradient-to-br from-[#061824] via-[#092233] to-[#04121c] border-teal-500/40 text-slate-100 shadow-[0_4px_25px_rgba(20,184,166,0.2)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold mb-2 font-bengali text-teal-300">
              <span className="font-extrabold text-teal-300">মোটর ড্রাইভ ও ডিফারেনশিয়াল স্টিয়ারিং</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black font-bengali border ${
                  steeringMode === 'LEFT' || steeringMode === 'RIGHT'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : steeringMode === 'STOP'
                      ? 'bg-rose-500/25 text-rose-300 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      : 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                }`}
              >
                {steeringMode === 'LEFT' ? '⬅ বামে মোড়' : steeringMode === 'RIGHT' ? '➡ ডানে মোড়' : steeringMode === 'STOP' ? '🛑 ব্রেক' : '⬆ সোজা পথ'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              {/* Left Motor Card - Neon Cyan */}
              <div className="p-2 rounded-xl bg-[#041420] border border-cyan-500/40 shadow-inner">
                <div className="flex justify-between font-bengali">
                  <span className="text-cyan-300 font-bold">বাম মোটর (L):</span>
                  <span className="font-black text-cyan-300 font-mono drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">{motorPwmLeft} PWM</span>
                </div>
                <div className="w-full bg-[#020b12] rounded-full h-2 mt-1.5 overflow-hidden p-0.5 border border-cyan-500/30">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all shadow-[0_0_8px_rgba(6,182,212,0.9)]"
                    style={{ width: `${(motorPwmLeft / 255) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Right Motor Card - Neon Purple */}
              <div className="p-2 rounded-xl bg-[#140a24] border border-purple-500/40 shadow-inner">
                <div className="flex justify-between font-bengali">
                  <span className="text-purple-300 font-bold">ডান মোটর (R):</span>
                  <span className="font-black text-purple-300 font-mono drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]">{motorPwmRight} PWM</span>
                </div>
                <div className="w-full bg-[#0d041a] rounded-full h-2 mt-1.5 overflow-hidden p-0.5 border border-purple-500/30">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all shadow-[0_0_8px_rgba(168,85,247,0.9)]"
                    style={{ width: `${(motorPwmRight / 255) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL 3: 3D LiDAR Radar & Safety Scan (Vibrant Emerald & Gold) */}
          <div
            className={`p-2.5 rounded-2xl border-2 transition-all ${
              isLight
                ? 'bg-gradient-to-br from-white via-emerald-50/70 to-teal-50/70 border-emerald-400/80 text-slate-800 shadow-[0_4px_20px_rgba(16,185,129,0.18)]'
                : 'bg-gradient-to-br from-[#061c14] via-[#092b1f] to-[#04140e] border-emerald-500/40 text-slate-100 shadow-[0_4px_25px_rgba(16,185,129,0.2)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold mb-2 font-bengali">
              <span className="flex items-center gap-1.5 text-emerald-300 font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>৩৬০° লিডার ও বাধা স্ক্যানার</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black font-bengali border ${
                  nearestDistMeters === null
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : nearestDistMeters < 6
                      ? 'bg-rose-500/25 text-rose-300 border-rose-400 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                      : 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                }`}
              >
                {nearestDistMeters === null ? 'নিরাপদ (Clear)' : nearestDistMeters < 6 ? 'বিপজ্জনক!' : 'সতর্কতা'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#04130d] border border-emerald-500/40 shadow-inner">
              <div>
                <span className="text-[10px] text-emerald-300/80 font-bengali">নিকটবর্তী দূরত্ব:</span>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-lg font-black font-mono drop-shadow-md ${
                      nearestDistMeters === null
                        ? 'text-emerald-400'
                        : nearestDistMeters < 6
                          ? 'text-rose-400 animate-pulse'
                          : 'text-amber-400'
                    }`}
                  >
                    {nearestDistMeters !== null ? `${nearestDistMeters}m` : '25m+'}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bengali font-bold">
                    ({nearestObstacle ? nearestObstacle.labelBn : 'ফাঁকা'})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-emerald-300/80 font-bengali">পাথ স্ট্যাটাস:</span>
                <div className="text-[11px] font-black font-bengali text-emerald-300">
                  {avoidanceDetourActive ? 'স্বয়ংক্রিয় বাইপাস অন' : 'সোজা ক্রুজ রুট'}
                </div>
              </div>
            </div>
          </div>

          {/* PANEL 4: Tactile 3D Action Buttons (Vibrant Multi-Color Action Console) */}
          <div
            className={`p-2.5 rounded-2xl border-2 transition-all ${
              isLight
                ? 'bg-gradient-to-br from-white via-purple-50/70 to-pink-50/70 border-purple-400/80 text-slate-800 shadow-[0_4px_20px_rgba(168,85,247,0.18)]'
                : 'bg-gradient-to-br from-[#160c28] via-[#241242] to-[#0f071c] border-purple-500/40 text-slate-100 shadow-[0_4px_25px_rgba(168,85,247,0.2)]'
            }`}
          >
            <div className="text-[11px] font-bold text-purple-300 mb-2 font-bengali flex items-center justify-between">
              <span className="font-extrabold">ট্যাকটিক্যাল অটোনোমাস অ্যাকশন</span>
              <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/50 text-purple-200">
                {obstacles.filter(o => o.active).length}টি বাধা
              </span>
            </div>

            {/* Grid of 3D Tactile Action Buttons in Radiant Colors */}
            <div className="grid grid-cols-2 gap-2 font-bengali">
              {/* Button 1: Amber 3D Drop Sudden Obstacle */}
              <button
                id="btn-drop-sudden-obs"
                onClick={handleDropSuddenObstacle}
                className="px-2.5 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 border-t border-amber-100 shadow-[0_3px_0_#9a3412,0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_1px_0_#9a3412] hover:translate-y-[2px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="গাড়ির সামনে আকস্মিক বাধা ফেলে অটো স্টপ পরীক্ষা করুন"
              >
                <AlertTriangle className="w-4 h-4 text-slate-950" />
                <span>বাধা ফেলুন</span>
              </button>

              {/* Button 2: Rose 3D Simulate Traffic Jam */}
              <button
                id="btn-simulate-traffic-jam"
                onClick={handleSimulateTrafficJamAhead}
                className="px-2.5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-b from-rose-500 via-red-600 to-rose-800 border-t border-rose-300 shadow-[0_3px_0_#881337,0_0_15px_rgba(244,63,94,0.5)] hover:shadow-[0_1px_0_#881337] hover:translate-y-[2px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="সামনে ট্রাফিক জ্যাম ফেলে আগে থেকেই বাইপাস মোড় পরীক্ষা করুন"
              >
                <TrafficCone className="w-4 h-4 text-white" />
                <span>জ্যাম ফেলুন</span>
              </button>

              {/* Button 3: Vibrant Violet 3D Click to Place */}
              <button
                onClick={() => setPlacementMode(prev => !prev)}
                className={`px-2.5 py-2 rounded-xl text-xs font-black border-t transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  placementMode
                    ? 'bg-rose-600 text-white border-rose-300 shadow-inner animate-pulse'
                    : 'bg-gradient-to-b from-purple-500 via-violet-600 to-indigo-700 text-white border-purple-200 shadow-[0_3px_0_#4338ca,0_0_15px_rgba(147,51,234,0.5)] hover:shadow-[0_1px_0_#4338ca] hover:translate-y-[2px] active:translate-y-[3px] active:shadow-none'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{placementMode ? 'ম্যাপে ক্লিক...' : 'ম্যাপে বাধা'}</span>
              </button>

              {/* Button 4: Vibrant Cyan/Blue 3D Clear All */}
              <button
                onClick={handleClearAllObstacles}
                className="px-2.5 py-2 rounded-xl text-xs font-black bg-gradient-to-b from-cyan-500 via-sky-600 to-blue-700 text-white border-t border-cyan-200 shadow-[0_3px_0_#1d4ed8,0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_1px_0_#1d4ed8] hover:translate-y-[2px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="সব বাধা মুছে ফেলুন"
              >
                <Trash2 className="w-4 h-4" />
                <span>সব মুছুন</span>
              </button>
            </div>

            {/* Cruise Speed Slider & Hardware Sync */}
            <div className="mt-2.5 pt-2 border-t border-purple-500/30 flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 font-bengali">
                <span className="text-purple-300 font-bold">স্পিড:</span>
                <input
                  type="range"
                  min="12"
                  max="32"
                  step="1"
                  value={baseCruiseSpeed}
                  onChange={e => setBaseCruiseSpeed(Number(e.target.value))}
                  className="w-20 accent-cyan-400 cursor-pointer"
                />
                <span className="font-mono font-black text-cyan-300">{baseCruiseSpeed}km/h</span>
              </div>

              <button
                onClick={handleConnectSerial}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black font-bengali flex items-center gap-1 transition-all cursor-pointer border ${
                  serialConnected
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                    : 'bg-gradient-to-b from-teal-500 to-emerald-700 text-white border-teal-300 shadow-[0_2px_0_#065f46,0_0_10px_rgba(20,184,166,0.4)]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{serialConnected ? 'HW সংযুক্ত' : 'USB HW'}</span>
              </button>
            </div>
          </div>

          {/* PANEL 5: 360° Perimeter Defense & Self-Righting Roll-Over Recovery Module */}
          <UGVDefensiveSafetyModule
            language={language}
            theme={theme}
            isPerimeterArmed={isPerimeterArmed}
            onTogglePerimeterArm={() => {
              setIsPerimeterArmed(prev => {
                const next = !prev;
                if (!next && isBreached) {
                  handleClearBreach();
                }
                return next;
              });
            }}
            isBreached={isBreached}
            breachDistanceMeters={breachDistanceMeters}
            onSimulateIntruderBreach={handleSimulateIntruderBreach}
            onClearBreach={handleClearBreach}
            isEngineLocked={isEngineLocked}
            isSirenAudible={isSirenAudible}
            onToggleSirenAudible={() => {
              setIsSirenAudible(prev => {
                const next = !prev;
                if (!next) {
                  ugvDefensiveAudio.stopDefenseSiren();
                } else if (isBreached) {
                  ugvDefensiveAudio.startDefenseSiren();
                }
                return next;
              });
            }}
            rollAngleDeg={rollAngleDeg}
            pitchAngleDeg={pitchAngleDeg}
            isTumbled={isTumbled}
            isSelfRightingActive={isSelfRightingActive}
            selfRightingPhase={selfRightingPhase}
            onSimulateRollover={handleSimulateRollover}
            onExecuteSelfRighting={handleExecuteSelfRighting}
            autoSelfRightEnabled={autoSelfRightEnabled}
            onToggleAutoSelfRight={() => setAutoSelfRightEnabled(prev => !prev)}
          />
        </div>

        {/* RIGHT COLUMN: Interactive Google Map Window with Vibrant Neon Cockpit HUD Controls */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col order-1 lg:order-2">
          <div className="relative w-full rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.25)] h-[520px] sm:h-[580px] lg:h-[calc(100vh-130px)] lg:min-h-[560px] bg-[#070f22] flex-1">
        <APIProvider apiKey={apiKey} libraries={['marker', 'geometry', 'places']}>
          <Map
            id="ugv-autonomous-map"
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: carPosition.lat, lng: carPosition.lng }}
            defaultZoom={17}
            defaultTilt={55}
            defaultHeading={35}
            tilt={is3DView ? cameraTilt : 0}
            heading={is3DView ? carHeading : 0}
            gestureHandling="greedy"
            disableDefaultUI={false}
            rotateControl={true}
            cameraControl={true}
            onClick={handleMapClick}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Smooth 3D Camera Follower to keep vehicle centered and rotated smoothly */}
            <MapCameraFollower
              carPosition={carPosition}
              carHeading={carHeading}
              isDriving={isDriving}
              autoFollow={autoFollowMap}
              is3D={is3DView}
              tilt={cameraTilt}
              zoom={17.5}
            />

            {/* Original Blocked Path (Dashed Amber) if Detoured */}
            {avoidanceDetourActive && originalBlockedRoute.length > 0 && (
              <MapPolyline
                path={originalBlockedRoute}
                color="#f59e0b"
                weight={4}
                opacity={0.7}
                dashed={true}
              />
            )}

            {/* Jammed Road Segment - Red Dashed Polyline bypassed ahead of time */}
            {jammedRoadSegment.length > 0 && (
              <MapPolyline
                path={jammedRoadSegment}
                color="#ef4444"
                weight={7}
                opacity={0.88}
                dashed={true}
              />
            )}

            {/* Active Collision-Free Path Polyline (Vibrant Emerald / Cyan Glow) */}
            {routeCoordinates.length > 0 && (
              <MapPolyline
                path={routeCoordinates}
                color={avoidanceDetourActive || jamAvoidanceDetourActive ? '#06b6d4' : '#10b981'}
                weight={6}
                opacity={0.95}
              />
            )}

            {/* Traffic Jam Ahead Hazard Marker */}
            {trafficJamZone && trafficJamZone.active && (
              <AdvancedMarker
                position={{ lat: trafficJamZone.lat, lng: trafficJamZone.lng }}
                title={language === 'bn' ? trafficJamZone.roadNameBn : trafficJamZone.roadNameEn}
              >
                <div className="relative flex flex-col items-center group cursor-pointer -translate-y-2">
                  <div className="absolute rounded-full border-2 border-rose-500 bg-rose-500/30 animate-ping w-16 h-16 -top-3"></div>
                  <div className="relative z-10 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] flex items-center gap-1.5 text-xs font-bold text-rose-100">
                    <span className="text-base">🚗🚙🚕</span>
                    <span className="font-bengali text-[11px] font-black whitespace-nowrap drop-shadow">
                      {language === 'bn' ? 'তীব্র জ্যাম' : 'Traffic Jam'}
                    </span>
                  </div>
                  {trafficJamZone.bypassed ? (
                    <div className="mt-1 bg-emerald-900/95 text-emerald-200 border border-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-mono whitespace-nowrap shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                      {language === 'bn' ? '✓ আগে থেকেই এড়ানো হয়েছে' : '✓ Proactively Bypassed'}
                    </div>
                  ) : (
                    <div className="mt-1 bg-rose-900/95 text-rose-100 border border-rose-400 px-2 py-0.5 rounded-md text-[9px] font-mono whitespace-nowrap shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse">
                      {language === 'bn' ? '⚠️ সামনে জ্যাম' : '⚠️ Jam Ahead'}
                    </div>
                  )}
                </div>
              </AdvancedMarker>
            )}

            {/* Turn intersection waypoints along route */}
            {routeTurns.filter(t => !t.completed).map(turn => (
              <AdvancedMarker
                key={turn.id}
                position={turn.location}
                title={language === 'bn' ? turn.instructionBn : turn.instructionEn}
              >
                <div className="flex flex-col items-center cursor-pointer -translate-y-2">
                  <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 border-2 border-indigo-400 text-indigo-100 text-[10px] font-black shadow-[0_0_12px_rgba(99,102,241,0.5)] flex items-center gap-1.5 font-bengali whitespace-nowrap">
                    {turn.direction === 'LEFT' ? (
                      <CornerUpLeft className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <CornerUpRight className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>
                      {turn.direction === 'LEFT'
                        ? (language === 'bn' ? 'বামে মোড়' : 'Left Turn')
                        : (language === 'bn' ? 'ডানে মোড়' : 'Right Turn')}
                    </span>
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* Target Destination Marker */}
            <AdvancedMarker
              position={{ lat: destination.lat, lng: destination.lng }}
              title={language === 'bn' ? destination.nameBn : destination.nameEn}
            >
              <div className="flex flex-col items-center group cursor-pointer -translate-y-4">
                <div className="bg-gradient-to-r from-rose-500 via-red-500 to-pink-600 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-[0_0_18px_rgba(244,63,94,0.8)] border-2 border-white flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                  <MapPin className="w-4 h-4 fill-white" />
                  <span>{language === 'bn' ? destination.nameBn : destination.nameEn}</span>
                </div>
                <div className="w-3.5 h-3.5 bg-rose-600 rotate-45 -mt-1.5 border border-white shadow-md"></div>
              </div>
            </AdvancedMarker>

            {/* Dynamic Obstacle Markers - only visible when active on the road ahead */}
            {obstacles.filter(obs => obs.active).map(obs => {
              const isNearest = nearestObstacle?.id === obs.id;
              return (
                <AdvancedMarker
                  key={obs.id}
                  position={{ lat: obs.lat, lng: obs.lng }}
                  title={language === 'bn' ? obs.labelBn : obs.labelEn}
                >
                  <div className="relative flex flex-col items-center cursor-pointer group">
                    {/* Obstacle Hazard Buffer Halo */}
                    <div
                      className={`absolute rounded-full border-2 transition-all ${
                        isNearest
                          ? 'border-rose-500 bg-rose-500/30 animate-ping'
                          : 'border-amber-400/80 bg-amber-500/25'
                      }`}
                      style={{ width: '52px', height: '52px', top: '-16px' }}
                    ></div>

                    {/* Obstacle Visual Badge */}
                    <div
                      className={`relative z-10 p-2 rounded-2xl border-2 shadow-2xl flex items-center gap-1.5 text-xs font-black transition-transform group-hover:scale-115 ${
                        isNearest
                          ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white border-rose-300 ring-4 ring-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.8)]'
                          : 'bg-gradient-to-r from-amber-600 to-orange-700 text-white border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      }`}
                    >
                      <span className="text-lg">{obs.icon}</span>
                      <span className="text-[10px] hidden group-hover:inline whitespace-nowrap font-bengali">
                        {language === 'bn' ? obs.labelBn : obs.labelEn}
                      </span>
                    </div>

                    {/* Distance indicator badge */}
                    {nearestDistMeters !== null && isNearest && (
                      <div className="absolute -bottom-6 bg-rose-950/95 text-rose-200 border border-rose-400 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold whitespace-nowrap shadow-[0_0_10px_rgba(244,63,94,0.7)]">
                        {nearestDistMeters}m দূরত্ব
                      </div>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* UGV Autonomous Rover Vehicle Marker (Smooth 60 FPS Continuous Interpolation) */}
            <AdvancedMarker
              position={{ lat: carPosition.lat, lng: carPosition.lng }}
              title="UGV Autonomous Rover"
            >
              <div className="relative flex items-center justify-center cursor-pointer transition-transform duration-75 ease-out">
                {/* 360° 2-Meter Ultrasonic Perimeter Defense Zone */}
                {isPerimeterArmed && (
                  <div
                    className={`absolute -inset-10 rounded-full border-2 border-dashed transition-all pointer-events-none ${
                      isBreached
                        ? 'border-rose-500 bg-rose-500/30 animate-ping shadow-[0_0_25px_rgba(244,63,94,0.9)]'
                        : 'border-rose-400/50 bg-rose-500/5'
                    }`}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 px-1 rounded bg-black/70 text-[8px] font-mono text-rose-300">
                      2.0m DEFENSE
                    </div>
                  </div>
                )}

                {/* 360° Perimeter Strobe Flashers when breached */}
                {isBreached && (
                  <div className="absolute -inset-14 rounded-full border-4 border-amber-400 bg-amber-400/20 animate-pulse pointer-events-none"></div>
                )}

                {/* 360 LiDAR Radar Sensor Sweep Ring with Bright Glow */}
                <div
                  className={`absolute -inset-6 rounded-full border-2 transition-colors ${
                    isBreached
                      ? 'border-rose-500/95 bg-rose-600/30 animate-ping'
                      : isTumbled
                        ? 'border-amber-400/95 bg-amber-500/30 animate-pulse'
                        : autoStopTriggered
                          ? 'border-rose-400/90 bg-rose-500/25 animate-ping'
                          : speedGovernorState === 'DECELERATE_OBSTACLE'
                            ? 'border-amber-400/90 bg-amber-500/25 animate-pulse'
                            : 'border-cyan-400/60 bg-cyan-500/15 animate-ping'
                  }`}
                ></div>

                {/* Forward Perception Cone */}
                <div
                  className="absolute pointer-events-none transition-transform duration-100 ease-out"
                  style={{
                    transform: `rotate(${carHeading}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <div
                    className={`w-20 h-32 -mt-32 opacity-45 [clip-path:polygon(30%_100%,70%_100%,100%_0%,0%_0%)] filter drop-shadow-[0_0_8px_currentColor] ${
                      isBreached || autoStopTriggered
                        ? 'bg-rose-500 text-rose-500'
                        : isTumbled || speedGovernorState === 'DECELERATE_OBSTACLE'
                          ? 'bg-amber-400 text-amber-400'
                          : 'bg-cyan-400 text-cyan-400'
                    }`}
                  ></div>
                </div>

                {/* Car Rover Body with Dynamic Smooth Heading and Roll-Over Tilt */}
                <div
                  className={`relative z-10 w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0c1938] to-[#040817] border-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] flex flex-col items-center justify-center text-white transition-transform duration-100 ease-out ${
                    isBreached
                      ? 'border-rose-500 ring-4 ring-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,1)] animate-bounce'
                      : isTumbled
                        ? 'border-amber-500 ring-4 ring-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,1)]'
                        : autoStopTriggered
                          ? 'border-rose-400 ring-4 ring-rose-400/60 shadow-[0_0_25px_rgba(244,63,94,0.8)]'
                          : 'border-cyan-400 ring-2 ring-cyan-500/40'
                  }`}
                  style={{
                    transform: `rotate(${carHeading}deg) rotateY(${rollAngleDeg}deg) scale(${isTumbled ? 0.88 : 1})`
                  }}
                >
                  {/* Vehicle Heading Arrow */}
                  <div
                    className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[9px] -mt-1.5 filter drop-shadow-[0_0_4px_currentColor] ${
                      isBreached || autoStopTriggered ? 'border-b-rose-400 text-rose-400' : 'border-b-cyan-300 text-cyan-300'
                    }`}
                  ></div>

                  {/* Dynamic Blinking Turn Signal Lights on Vehicle Chassis */}
                  {blinkingTurnSignal === 'LEFT' && (
                    <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 flex items-center">
                      <div className="w-4 h-4 rounded-full bg-amber-300 border-2 border-white shadow-[0_0_12px_rgba(251,191,36,1)] animate-ping"></div>
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md"></div>
                    </div>
                  )}
                  {blinkingTurnSignal === 'RIGHT' && (
                    <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-30 flex items-center">
                      <div className="w-4 h-4 rounded-full bg-amber-300 border-2 border-white shadow-[0_0_12px_rgba(251,191,36,1)] animate-ping"></div>
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md"></div>
                    </div>
                  )}

                  {/* Rover Wheels / Chassis Visual */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-4.5 bg-gradient-to-b from-amber-300 to-amber-500 rounded-xs border border-amber-200 shadow-sm"></div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black shadow-inner border border-white/30 ${
                        isBreached || autoStopTriggered
                          ? 'bg-rose-600 text-white'
                          : isTumbled
                            ? 'bg-amber-600 text-white'
                            : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                      }`}
                    >
                      {isTumbled ? 'TMB' : isBreached ? 'ALM' : 'UGV'}
                    </div>
                    <div className="w-2 h-4.5 bg-gradient-to-b from-amber-300 to-amber-500 rounded-xs border border-amber-200 shadow-sm"></div>
                  </div>
                </div>

                {/* Status Callout Badge */}
                <div
                  className={`absolute -bottom-7 backdrop-blur-md border-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap shadow-lg ${
                    isBreached
                      ? 'bg-rose-950/95 text-rose-200 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse'
                      : isTumbled
                        ? 'bg-amber-950/95 text-amber-200 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.7)] animate-pulse'
                        : autoStopTriggered
                          ? 'bg-rose-950/95 text-rose-200 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                          : 'bg-[#050c1b]/95 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  {isBreached
                    ? '🚨 INTRUDER BREACH'
                    : isTumbled
                      ? '🚨 TUMBLE ALERT'
                      : autoStopTriggered
                        ? '🛑 AUTO STOP'
                        : blinkingTurnSignal
                          ? (blinkingTurnSignal === 'LEFT' ? '⬅️ বামে মোড় সিগন্যাল' : '➡️ ডানে মোড় সিগন্যাল')
                          : speedKmh > 0
                            ? `${speedKmh.toFixed(1)} km/h • ${carHeading.toFixed(0)}°`
                            : 'UGV READY'}
                </div>
              </div>
            </AdvancedMarker>
          </Map>
        </APIProvider>

        {/* 360° Perimeter Defense Flashing Screen Border & Alert Banner */}
        {isBreached && (
          <>
            <div className="absolute inset-0 z-20 pointer-events-none border-4 border-rose-500/80 animate-pulse shadow-[inset_0_0_60px_rgba(244,63,94,0.6)]"></div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-rose-100 border-2 border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.9)] backdrop-blur-md flex items-center gap-3 font-bengali text-xs font-bold animate-bounce">
              <ShieldAlert className="w-5 h-5 text-rose-300 animate-spin shrink-0" />
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-rose-100">
                  {language === 'bn'
                    ? `🚨 পেরিমিটার অনুপ্রবেশ! রোভারের ${breachDistanceMeters?.toFixed(1) || '২.০'} মিটারে অনুপ্রবেশকারী শনাক্ত!`
                    : `🚨 PERIMETER BREACH! Intruder detected at ${breachDistanceMeters?.toFixed(1) || '2.0'}m!`}
                </span>
                <span className="text-[10px] text-rose-200">
                  {language === 'bn'
                    ? 'ইঞ্জিন লক করা হয়েছে • হাই-পিচ অ্যালার্ম ও ফ্ল্যাশার চলছে'
                    : 'Engine Locked • High-Pitch Siren & Perimeter Strobes Active'}
                </span>
              </div>
              <button
                onClick={handleClearBreach}
                className="ml-1 px-3 py-1 rounded-xl bg-white text-rose-950 font-black text-[11px] shadow-lg hover:bg-rose-100 cursor-pointer pointer-events-auto"
              >
                {language === 'bn' ? 'আনলক' : 'Unlock'}
              </button>
            </div>
          </>
        )}

        {/* Tumble Alert & Self-Righting Roll-Over Recovery Floating Banner */}
        {isTumbled && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-950 via-orange-900 to-amber-950 text-amber-100 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.9)] backdrop-blur-md flex items-center gap-3 font-bengali text-xs font-bold animate-bounce">
            <RotateCw className={`w-5 h-5 text-amber-300 shrink-0 ${isSelfRightingActive ? 'animate-spin' : ''}`} />
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-amber-100">
                {language === 'bn'
                  ? `🚨 TUMBLE ALERT: গাড়ি উল্টে গেছে (${Math.round(rollAngleDeg)}°)!`
                  : `🚨 TUMBLE ALERT: UGV Inverted (${Math.round(rollAngleDeg)}°)!`}
              </span>
              <span className="text-[10px] text-amber-200">
                {isSelfRightingActive
                  ? selfRightingPhase
                  : (language === 'bn' ? 'রিভার্স মোটর পালস অ্যালগরিদম প্রস্তুত' : 'Reverse motor pulse algorithm ready')}
              </span>
            </div>
            <button
              onClick={handleExecuteSelfRighting}
              disabled={isSelfRightingActive}
              className="ml-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[11px] shadow-lg hover:brightness-110 cursor-pointer pointer-events-auto flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSelfRightingActive ? 'animate-spin' : ''}`} />
              <span>{language === 'bn' ? 'সোজা করুন' : 'Self-Right'}</span>
            </button>
          </div>
        )}

        {/* Floating Turn Guidance Banner */}
        {activeTurn && distToNextTurnMeters !== null && distToNextTurnMeters <= 45 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 text-indigo-100 border-2 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.6)] backdrop-blur-md flex items-center gap-2.5 font-bengali text-xs font-bold animate-pulse pointer-events-none">
            {activeTurn.direction === 'LEFT' ? (
              <CornerUpLeft className="w-5 h-5 text-amber-300 shrink-0" />
            ) : (
              <CornerUpRight className="w-5 h-5 text-amber-300 shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-[13px] font-black">
                {language === 'bn'
                  ? `সামনে ${distToNextTurnMeters} মিটারে ${activeTurn.direction === 'LEFT' ? 'বামে' : 'ডানে'} মোড় নিন`
                  : `In ${distToNextTurnMeters}m, turn ${activeTurn.direction === 'LEFT' ? 'left' : 'right'}`}
              </span>
              <span className="text-[10px] text-indigo-200 font-medium">
                {language === 'bn' ? activeTurn.streetNameBn : activeTurn.streetNameEn}
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping ml-1"></span>
          </div>
        )}

        {/* Floating Ahead Traffic Jam Bypass Alert Banner */}
        {jamAvoidanceDetourActive && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-emerald-100 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.6)] backdrop-blur-md flex items-center gap-2 font-bengali text-xs font-bold pointer-events-none">
            <Route className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              {language === 'bn'
                ? '🚨 আগাম জ্যাম পরিহার: গাড়ি আগে থেকেই বিকল্প ফাঁকা রাস্তায় মোড় নিয়ে জ্যাম এড়িয়ে চলেছে'
                : '🚨 Proactive Jam Bypass: Vehicle turned onto alternate clear street ahead of time'}
            </span>
          </div>
        )}

        {/* Floating Top-Left Status Overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-md border-2 shadow-xl flex items-center gap-2 ${
              autoStopTriggered
                ? 'bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-rose-100 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                : isDriving
                  ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-emerald-200 border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : hasArrived
                    ? 'bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-950 text-blue-200 border-blue-400/80 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : 'bg-[#0a1428]/90 text-cyan-200 border-cyan-500/50'
            }`}
          >
            <Radio className={`w-4 h-4 ${isDriving ? 'text-emerald-300 animate-spin' : 'text-cyan-300'}`} />
            <span className="font-bengali">
              {autoStopTriggered
                ? (language === 'bn' ? 'অটো স্টপ কার্যকর (বাধা সন্নিকটে)' : 'Auto Stop Engaged')
                : isDriving
                  ? avoidanceDetourActive
                    ? (language === 'bn' ? 'বিকল্প নিরাপদ রুটে ড্রাইভ চলছে' : 'Driving Bypass Route')
                    : (language === 'bn' ? `গাড়ি চলছে: ${destination.nameBn}` : `Navigating: ${destination.nameEn}`)
                  : hasArrived
                    ? (language === 'bn' ? 'গন্তব্যে পৌঁছে গেছে' : 'Arrived at Target')
                    : (language === 'bn' ? 'গাড়ি প্রস্তুত (Standby)' : 'Standby')}
            </span>
          </div>

          <div className="bg-[#050c1b]/90 backdrop-blur-md border border-cyan-500/50 text-cyan-200 px-3 py-1 rounded-xl text-[10px] font-mono flex items-center gap-2.5 shadow-md">
            <span>GPS: {carPosition.lat.toFixed(4)}N, {carPosition.lng.toFixed(4)}E</span>
            <span>হেডিং: {carHeading.toFixed(0)}°</span>
            <span className={is3DView ? 'text-emerald-400 font-black' : 'text-cyan-400'}>
              {is3DView ? `3D (${cameraTilt}°)` : '2D'}
            </span>
          </div>
        </div>

        {/* Floating Top-Right Controls (3D Toggle, Tilt Angles, Camera Follow, Center, Vision HUD) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {/* 3D / 2D Perspective Toggle Button - Radiant 3D Beveled Button */}
          <button
            id="btn-toggle-3d-view"
            onClick={() => {
              setIs3DView(prev => {
                const next = !prev;
                setStatusMessage(
                  language === 'bn'
                    ? next
                      ? '🎥 ৩ডি ভিউ (3D Perspective) সক্রিয় করা হয়েছে'
                      : '🗺️ সাধারণ ২ডি ভিউ (Top-Down 2D) সক্রিয় করা হয়েছে'
                    : next
                      ? '🎥 3D Perspective View Activated'
                      : '🗺️ 2D Top-Down View Activated'
                );
                return next;
              });
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border-t ${
              is3DView
                ? 'bg-gradient-to-b from-emerald-400 via-teal-500 to-cyan-600 text-slate-950 border-emerald-200 shadow-[0_3px_0_#065f46,0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_1px_0_#065f46] hover:translate-y-[2px] active:translate-y-[3px] active:shadow-none'
                : 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-200 border-slate-700 shadow-[0_3px_0_#0f172a] hover:translate-y-[2px] active:translate-y-[3px]'
            }`}
            title="3D / 2D ম্যাপ ভিউ টগল করুন"
          >
            <Box className="w-4 h-4 text-slate-950" />
            <span className="font-bengali font-black">
              {is3DView ? '3D ভিউ' : '2D ফ্ল্যাট'}
            </span>
          </button>

          {/* 3D Tilt Angle Presets (When 3D is active) */}
          {is3DView && (
            <div className="hidden sm:flex items-center gap-1 bg-[#050c1b]/95 border-2 border-indigo-500/50 rounded-xl p-1 backdrop-blur-md text-[11px] font-mono shadow-lg">
              {[
                { label: '35°', tilt: 35, title: 'হালকা ৩ডি' },
                { label: '55°', tilt: 55, title: 'স্ট্যান্ডার্ড ৩ডি' },
                { label: '65°', tilt: 65, title: 'ককপিট ৩ডি' }
              ].map(item => (
                <button
                  key={item.tilt}
                  onClick={() => {
                    setCameraTilt(item.tilt);
                    setStatusMessage(
                      language === 'bn'
                        ? `৩ডি ক্যামেরার কোণ ${item.label} নির্ধারণ করা হয়েছে`
                        : `3D Camera tilt set to ${item.label}`
                    );
                  }}
                  className={`px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    cameraTilt === item.tilt
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'text-cyan-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title={item.title}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Auto Follow Camera Toggle */}
          <button
            onClick={() => setAutoFollowMap(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border-t ${
              autoFollowMap
                ? 'bg-gradient-to-b from-indigo-500 via-purple-600 to-indigo-800 text-white border-indigo-300 shadow-[0_3px_0_#312e81,0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_1px_0_#312e81] hover:translate-y-[2px] active:translate-y-[3px] active:shadow-none'
                : 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-300 border-slate-700 shadow-[0_3px_0_#0f172a]'
            }`}
            title="গাড়ির সাথে ক্যামেরা চলাচল অন/অফ"
          >
            <Crosshair className="w-4 h-4 text-white" />
            <span className="hidden md:inline font-bengali">
              {autoFollowMap ? 'ক্যামেরা লক: অন' : 'ক্যামেরা লক: অফ'}
            </span>
          </button>

          {/* Center on Rover */}
          <button
            onClick={() => {
              setAutoFollowMap(true);
              setCarPosition({ ...carPosRef.current });
            }}
            className="p-2.5 rounded-xl bg-gradient-to-b from-teal-500 via-emerald-600 to-teal-800 text-white border-t border-teal-300 shadow-[0_3px_0_#064e3b,0_0_12px_rgba(20,184,166,0.5)] hover:shadow-[0_1px_0_#064e3b] hover:translate-y-[2px] active:translate-y-[3px] active:shadow-none text-xs flex items-center gap-1 transition-all cursor-pointer"
            title="গাড়ির লোকেশনে ফোকাস করুন"
          >
            <Compass className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline font-bengali font-black">সেন্টার</span>
          </button>

          {/* Camera Vision Toggle */}
          <button
            onClick={() => setShowCameraHud(prev => !prev)}
            className={`p-2.5 rounded-xl border-t text-xs flex items-center gap-1 transition-all cursor-pointer ${
              showCameraHud
                ? 'bg-gradient-to-b from-cyan-400 via-blue-500 to-cyan-700 text-white border-cyan-200 shadow-[0_3px_0_#0369a1,0_0_15px_rgba(6,182,212,0.6)] hover:shadow-[0_1px_0_#0369a1] hover:translate-y-[2px] active:translate-y-[3px] active:shadow-none'
                : 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-300 border-slate-700 shadow-[0_3px_0_#0f172a]'
            }`}
            title="AI বাম্পার ক্যামেরা ভিশন টগল"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom-Left Quick Hint Pill */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#050c1b]/95 backdrop-blur-md border-2 border-indigo-500/50 text-cyan-200 text-[11px] font-bengali shadow-lg">
          <span className="text-amber-400">💡</span>
          <span>ম্যাপে যেকোনো স্থানে ক্লিক করেও গন্তব্য পিন সেট করতে পারেন</span>
        </div>

        {/* Floating Mini Bumper Camera Vision (PiP HUD) with Vivid Neon Aesthetics */}
        {showCameraHud && (
          <div
            className={`absolute bottom-3 right-3 z-10 rounded-2xl overflow-hidden border-2 border-cyan-400/80 bg-[#050c1b]/95 shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-md transition-all ${
              isCameraHudExpanded ? 'w-64 sm:w-80' : 'w-44 sm:w-56'
            }`}
          >
            <div className="px-3 py-1.5 bg-gradient-to-r from-cyan-950 via-blue-950 to-cyan-950 border-b-2 border-cyan-400/50 flex items-center justify-between text-[10px] text-cyan-300 font-mono font-black">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span>AI CAMERA HUD</span>
              </span>
              <button
                onClick={() => setIsCameraHudExpanded(prev => !prev)}
                className="hover:text-white transition-colors cursor-pointer"
                title={isCameraHudExpanded ? 'Minimize' : 'Expand'}
              >
                {isCameraHudExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className={`relative ${isCameraHudExpanded ? 'h-36 sm:h-44' : 'h-24 sm:h-28'} bg-[#030712] flex items-center justify-center overflow-hidden`}>
              {/* Perspective grid lines */}
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px]"></div>
              <div className="absolute w-full h-px bg-cyan-500/40 top-1/2"></div>
              <div className="absolute h-full w-px bg-cyan-500/40 left-1/2"></div>

              {/* Nearest Obstacle Target Box in camera perception */}
              {nearestDistMeters !== null && nearestDistMeters < 25 && nearestObstacle && (
                <div
                  className={`absolute top-3 w-14 h-14 border-2 rounded-xl flex flex-col items-center justify-center text-[9px] font-mono font-black ${
                    nearestDistMeters <= 5.5
                      ? 'border-rose-500 bg-rose-500/30 text-rose-300 animate-ping shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                      : 'border-amber-400 bg-amber-500/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                  }`}
                >
                  <span className="text-base">{nearestObstacle.icon}</span>
                  <span>{nearestDistMeters}m</span>
                </div>
              )}

              {/* Drivable Corridor overlay */}
              <div className="absolute bottom-0 w-28 h-14 border-l-2 border-r-2 border-dashed border-cyan-400 [clip-path:polygon(20%_0%,80%_0%,100%_100%,0%_100%)] bg-cyan-500/15 flex items-center justify-center">
                <span className="text-[8px] font-mono text-cyan-300 font-black tracking-wider">DRIVABLE</span>
              </div>

              {/* Live Steering Guidance Label */}
              <div className="absolute top-1.5 left-2 px-2 py-0.5 rounded-lg bg-black/80 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold">
                {steeringMode === 'LEFT' ? '⬅ TURN LEFT' : steeringMode === 'RIGHT' ? '➡ TURN RIGHT' : '⬆ STRAIGHT'}
              </div>

              {/* Live status tag */}
              <div className="absolute bottom-1 right-2 text-[9px] font-mono font-black">
                {autoStopTriggered ? (
                  <span className="text-rose-400 font-black">BRAKE LOCK</span>
                ) : avoidanceDetourActive ? (
                  <span className="text-amber-300 font-black">DETOUR ACTIVE</span>
                ) : (
                  <span className="text-emerald-400 font-black">PATH CLEAR</span>
                )}
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* 5. Quick Help & User Guide Modal (সহজ নির্দেশিকা) */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full p-5 rounded-2xl border shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base md:text-lg font-bengali flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <span>{language === 'bn' ? 'সহজ ব্যবহার নির্দেশিকা' : 'How to Use (Quick Guide)'}</span>
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 font-bengali text-xs md:text-sm">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                  ১
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">গন্তব্য নির্ধারণ করুন</div>
                  <div className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                    ওপরের বক্সে গন্তব্য লিখুন অথবা 🎙️ মাইক বোতাম চেপে মুখে বলুন (যেমন: "ধানমন্ডি লেক") অথবা ম্যাপে সরাসরি ক্লিক করুন।
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50">
                <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center shrink-0">
                  ২
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">যাত্রা শুরু চাপুন</div>
                  <div className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                    সবুজ <strong>'যাত্রা শুরু'</strong> বোতামে চাপ দিলে গাড়িটি ৬০ এফপিএস মসৃণ মোশনে রাস্তার ওপর দিয়ে চলতে শুরু করবে।
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                  ৩
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">স্বয়ংক্রিয় নিরাপত্তা ও বাইপাস</div>
                  <div className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                    সামনে বাধা এলে গাড়ি নিজে নিজে ৫.৫ মিটারে অটো স্টপ করবে অথবা নতুন নিরাপদ বিকল্প পথ দিয়ে ঘুরে চলে যাবে!
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-bengali shadow-xs transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বুঝেছি, শুরু করুন' : 'Got it, let\'s go'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Machine Learning AI Neural Network Modal */}
      {showMLModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-[#070e22] border-2 border-cyan-500/60 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.4)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-950 via-[#0d1838] to-indigo-950 border-b border-indigo-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/40">
                  <Brain className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-white font-bengali">
                  {language === 'bn' ? 'মেশিন লার্নিং ও নিউরাল নেটওয়ার্ক কনসোল' : 'Machine Learning & Neural Network Console'}
                </h3>
              </div>
              <button
                onClick={() => setShowMLModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <MachineLearningPanel
                language={language}
                theme={theme}
                perception={{
                  fps: 60,
                  inferenceLatencyMs: 14.2,
                  detectedEntities: obstacles.slice(0, 5).map((o, idx) => ({
                    id: o.id || `entity-${idx}`,
                    type: 'rock' as const,
                    distance: Math.round(o.radiusMeters * 3) || 8,
                    angle: (idx % 2 === 0 ? 1 : -1) * (idx * 12 + 5),
                    confidence: 0.94,
                    box: { x: 0.3, y: 0.4, w: 0.2, h: 0.3 },
                    dangerLevel: 'CAUTION' as const
                  })),
                  drivableConfidence: 0.98,
                  horizonTilt: 0.2,
                  lightingCondition: 'sunny',
                  featurePoints: [],
                  depthEstimate: [18.5, 14.2, 8.4, 15.1, 19.8]
                }}
                pose={{ x: 0, y: 0, theta: carHeading, v: speedKmh / 3.6, omega: 0 }}
                isRunning={isDriving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
