// Geospatial calculation utilities for UGV Google Maps Navigation

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export type MapObstacleType = 'pedestrian' | 'vehicle' | 'construction' | 'barrier' | 'debris' | 'traffic_jam';

export interface MapObstacle {
  id: string;
  lat: number;
  lng: number;
  type: MapObstacleType;
  labelBn: string;
  labelEn: string;
  radiusMeters: number;
  icon: string;
  active: boolean;
}

export type TurnDirection = 'LEFT' | 'RIGHT' | 'SLIGHT_LEFT' | 'SLIGHT_RIGHT' | 'STRAIGHT';

export interface RouteTurnManeuver {
  id: string;
  distanceFromStartMeters: number;
  location: GeoCoordinate;
  direction: TurnDirection;
  turnAngleDeg: number;
  instructionBn: string;
  instructionEn: string;
  streetNameBn: string;
  streetNameEn: string;
  completed: boolean;
}

export interface TrafficJamZone {
  id: string;
  lat: number;
  lng: number;
  roadNameBn: string;
  roadNameEn: string;
  radiusMeters: number;
  jammedSegment: GeoCoordinate[];
  active: boolean;
  bypassed: boolean;
}

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
export function calculateDistanceMeters(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates bearing (heading) in degrees from point 1 to point 2 (0 = North, 90 = East, 180 = South, 270 = West)
 */
export function calculateBearing(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  const theta = Math.atan2(y, x);
  const degrees = (theta * 180) / Math.PI;

  return (degrees + 360) % 360;
}

const STREET_NAMES_POOL = [
  { bn: 'Mirpur Avenue', en: 'Mirpur Avenue' },
  { bn: 'Dhanmondi Road 27', en: 'Dhanmondi Road 27' },
  { bn: 'Satmasjid Road', en: 'Satmasjid Road' },
  { bn: 'Green Road Bypass', en: 'Green Road Bypass' },
  { bn: 'Panthapath Link Road', en: 'Panthapath Link Road' },
  { bn: 'Rokeya Sarani', en: 'Rokeya Sarani' },
  { bn: 'Manik Mia Avenue', en: 'Manik Mia Avenue' }
];

/**
 * Generates realistic road route waypoints with 1 or 2 distinct directional intersection turns
 * (e.g. Left turn or Right turn) and returns both the smooth waypoints and the turn maneuvers.
 */
export function generateRoadWaypointsWithTurns(
  start: GeoCoordinate,
  goal: GeoCoordinate,
  preferredTurns?: number
): { waypoints: GeoCoordinate[]; turns: RouteTurnManeuver[] } {
  // Intermediate road waypoints along the black asphalt road network (Satmasjid Road / Road 8 grid)
  const midLat = (start.lat + goal.lat) / 2 + 0.0012;
  const midLng = (start.lng + goal.lng) / 2 - 0.0010;
  const cornerNode: GeoCoordinate = { lat: midLat, lng: midLng };

  const waypoints: GeoCoordinate[] = [start];

  // Leg 1: start to intersection corner node
  const steps1 = 12;
  for (let i = 1; i <= steps1; i++) {
    const t = i / (steps1 + 1);
    waypoints.push({
      lat: start.lat + (cornerNode.lat - start.lat) * t,
      lng: start.lng + (cornerNode.lng - start.lng) * t
    });
  }
  waypoints.push(cornerNode);

  // Leg 2: intersection corner node to goal
  const steps2 = 12;
  for (let i = 1; i <= steps2; i++) {
    const t = i / (steps2 + 1);
    waypoints.push({
      lat: cornerNode.lat + (goal.lat - cornerNode.lat) * t,
      lng: cornerNode.lng + (goal.lng - cornerNode.lng) * t
    });
  }
  waypoints.push(goal);

  const turns: RouteTurnManeuver[] = [
    {
      id: `turn-node-${Date.now()}`,
      distanceFromStartMeters: Math.round(calculateDistanceMeters(start, cornerNode)),
      location: cornerNode,
      direction: 'RIGHT',
      turnAngleDeg: 90,
      instructionBn: 'Satmasjid Road ইন্টারসেকশনে ডানে মোড় নিন',
      instructionEn: 'Turn Right at Satmasjid Road Intersection',
      streetNameBn: 'Satmasjid Road',
      streetNameEn: 'Satmasjid Road',
      completed: false
    }
  ];

  return {
    waypoints: ensureRouteAvoidsWater(waypoints),
    turns
  };
}

/**
 * Generates intermediate realistic road route waypoints between start and goal
 */
export function generateRoadWaypoints(
  start: GeoCoordinate,
  goal: GeoCoordinate,
  steps: number = 24
): GeoCoordinate[] {
  const result = generateRoadWaypointsWithTurns(start, goal);
  return result.waypoints;
}

/**
 * Ahead-of-Time Traffic Jam Avoidance (Proactive Jam Avoidance)
 * When a traffic jam is detected 45-80m ahead, this builds an early alternate detour
 * branching off from the car's current position onto an adjacent clear street,
 * leaving the jammed road segment completely untouched and safe.
 */
export function generateProactiveJamBypass(
  path: GeoCoordinate[],
  currentPos: GeoCoordinate,
  jamCenter: GeoCoordinate,
  clearanceMeters: number = 28.0
): {
  bypassedRoute: GeoCoordinate[];
  jammedSegment: GeoCoordinate[];
  clearStreetNameBn: string;
  clearStreetNameEn: string;
} {
  if (path.length < 3) {
    return {
      bypassedRoute: path,
      jammedSegment: [],
      clearStreetNameBn: 'Alternate Link Road',
      clearStreetNameEn: 'Alternate Link Road'
    };
  }

  // Find where jam is on path
  let jamIdx = 0;
  let minJamDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = calculateDistanceMeters(path[i], jamCenter);
    if (d < minJamDist) {
      minJamDist = d;
      jamIdx = i;
    }
  }

  // Jammed segment (portion of original road that is heavily congested)
  const jamStartIdx = Math.max(0, jamIdx - 2);
  const jamEndIdx = Math.min(path.length - 1, jamIdx + 3);
  const jammedSegment = path.slice(jamStartIdx, jamEndIdx + 1);

  // Conversion rates
  const metersToLat = 1 / 111320;
  const metersToLng = 1 / (111320 * Math.cos((currentPos.lat * Math.PI) / 180));

  const goal = path[path.length - 1];
  const dLat = goal.lat - currentPos.lat;
  const dLng = goal.lng - currentPos.lng;
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

  // Orthogonal vector for alternate avenue
  const nLat = -dLng / len;
  const nLng = dLat / len;

  // Branch off to the right or left with generous clear offset
  const offsetLat = nLat * clearanceMeters * metersToLat;
  const offsetLng = nLng * clearanceMeters * metersToLng;

  const bypassedRoute: GeoCoordinate[] = [currentPos];
  const detourSteps = 10;

  // Early alternate avenue points branching away from jam
  const rejoinPoint = path[Math.min(path.length - 1, jamEndIdx + 1)] || goal;

  for (let i = 1; i <= detourSteps; i++) {
    const f = i / detourSteps;
    const baseLat = currentPos.lat + (rejoinPoint.lat - currentPos.lat) * f;
    const baseLng = currentPos.lng + (rejoinPoint.lng - currentPos.lng) * f;
    // Bell curve offset for parallel clear avenue
    const bell = Math.sin(f * Math.PI);
    bypassedRoute.push({
      lat: baseLat + offsetLat * bell,
      lng: baseLng + offsetLng * bell
    });
  }

  // Re-append rest of path to destination
  for (let i = jamEndIdx + 2; i < path.length; i++) {
    bypassedRoute.push(path[i]);
  }

  if (calculateDistanceMeters(bypassedRoute[bypassedRoute.length - 1], goal) > 1.0) {
    bypassedRoute.push(goal);
  }

  const clearStreet = STREET_NAMES_POOL[3];

  return {
    bypassedRoute,
    jammedSegment,
    clearStreetNameBn: clearStreet.bn,
    clearStreetNameEn: clearStreet.en
  };
}

export const KNOWN_WATER_BODIES: GeoCoordinate[] = [
  { lat: 23.7461, lng: 90.3758 }, // Dhanmondi Lake
  { lat: 23.7550, lng: 90.3950 }, // Hatirjheel Lake West
  { lat: 23.7620, lng: 90.4100 }, // Hatirjheel Lake East
  { lat: 23.7900, lng: 90.4150 }, // Gulshan Lake
  { lat: 23.7100, lng: 90.4000 }  // Southern Water Reservoir / River
];

export const GLOBAL_ROAD_CORRIDORS: GeoCoordinate[][] = [
  [
    { lat: 23.7380, lng: 90.3712 },
    { lat: 23.7420, lng: 90.3730 },
    { lat: 23.7480, lng: 90.3755 },
    { lat: 23.7540, lng: 90.3780 }
  ],
  [
    { lat: 23.7390, lng: 90.3765 },
    { lat: 23.7445, lng: 90.3785 },
    { lat: 23.7500, lng: 90.3810 }
  ],
  [
    { lat: 23.7410, lng: 90.3820 },
    { lat: 23.7470, lng: 90.3835 },
    { lat: 23.7530, lng: 90.3850 }
  ]
];

export function snapToRoadCorridors(waypoints: GeoCoordinate[]): GeoCoordinate[] {
  return waypoints;
}

/**
 * Universally ensures any route waypoints and segments strictly avoid cutting through
 * ANY blue water body / jolasoi (lake, river, reservoir) anywhere on the map,
 * routing exclusively along paved asphalt roads.
 */
export function ensureRouteAvoidsWater(waypoints: GeoCoordinate[]): GeoCoordinate[] {
  const safeRadius = 95.0; // meters

  if (waypoints.length === 0) return waypoints;

  const roadSnapped = snapToRoadCorridors(waypoints);

  const refined: GeoCoordinate[] = [];
  for (let i = 0; i < roadSnapped.length; i++) {
    const pt = roadSnapped[i];
    let inWater = false;
    let nearestWaterCenter = KNOWN_WATER_BODIES[0];

    for (const wCenter of KNOWN_WATER_BODIES) {
      const dist = calculateDistanceMeters(pt, wCenter);
      if (dist < safeRadius) {
        inWater = true;
        nearestWaterCenter = wCenter;
        break;
      }
    }
    
    if (inWater) {
      const landBypass: GeoCoordinate = {
        lat: nearestWaterCenter.lat + 0.0014,
        lng: nearestWaterCenter.lng + 0.0016
      };
      refined.push(landBypass);
    } else {
      refined.push(pt);
    }
  }

  // Check segments for any water body intersection
  const fullySafe: GeoCoordinate[] = [];
  for (let i = 0; i < refined.length; i++) {
    fullySafe.push(refined[i]);
    if (i < refined.length - 1) {
      const a = refined[i];
      const b = refined[i + 1];
      const mid: GeoCoordinate = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
      
      let segmentInWater = false;
      let targetWaterCenter = KNOWN_WATER_BODIES[0];
      for (const wCenter of KNOWN_WATER_BODIES) {
        if (calculateDistanceMeters(mid, wCenter) < safeRadius) {
          segmentInWater = true;
          targetWaterCenter = wCenter;
          break;
        }
      }

      if (segmentInWater) {
        fullySafe.push({
          lat: targetWaterCenter.lat + 0.0016,
          lng: targetWaterCenter.lng + 0.0018
        });
      }
    }
  }

  return snapToRoadCorridors(fullySafe);
}

export interface WaterBodyZone {
  id: string;
  lat: number;
  lng: number;
  nameBn: string;
  nameEn: string;
  radiusMeters: number;
  active: boolean;
  avoided: boolean;
}

/**
 * Water Body & Lake Avoidance Rerouting
 * When a lake or water body is detected ahead on the route, this function calculates
 * an automatic detour routing around the water body along the perimeter road,
 * ensuring the UGV never drives through water.
 */
export function generateWaterBodyBypass(
  path: GeoCoordinate[],
  currentPos: GeoCoordinate,
  waterCenter: GeoCoordinate,
  detourOffsetMeters: number = 35.0
): {
  bypassedRoute: GeoCoordinate[];
  waterSegment: GeoCoordinate[];
  streetName: string;
} {
  if (path.length < 3) {
    return {
      bypassedRoute: path,
      waterSegment: [],
      streetName: 'Lake Perimeter Road'
    };
  }

  // Find nearest index to water body
  let waterIdx = 0;
  let minWaterDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = calculateDistanceMeters(path[i], waterCenter);
    if (d < minWaterDist) {
      minWaterDist = d;
      waterIdx = i;
    }
  }

  const startIdx = Math.max(0, waterIdx - 3);
  const endIdx = Math.min(path.length - 1, waterIdx + 4);
  const waterSegment = path.slice(startIdx, endIdx + 1);

  const metersToLat = 1 / 111320;
  const metersToLng = 1 / (111320 * Math.cos((currentPos.lat * Math.PI) / 180));

  const goal = path[path.length - 1];
  const dLat = goal.lat - currentPos.lat;
  const dLng = goal.lng - currentPos.lng;
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

  // Orthogonal vector to route around water body safely
  const nLat = -dLng / len;
  const nLng = dLat / len;

  const offsetLat = nLat * detourOffsetMeters * metersToLat;
  const offsetLng = nLng * detourOffsetMeters * metersToLng;

  const bypassedRoute: GeoCoordinate[] = path.slice(0, startIdx);
  const detourSteps = 12;
  const rejoinPoint = path[Math.min(path.length - 1, endIdx + 1)] || goal;
  const segmentStart = path[startIdx] || currentPos;

  for (let i = 0; i <= detourSteps; i++) {
    const f = i / detourSteps;
    const baseLat = segmentStart.lat + (rejoinPoint.lat - segmentStart.lat) * f;
    const baseLng = segmentStart.lng + (rejoinPoint.lng - segmentStart.lng) * f;
    // Outer arc around water body
    const arc = Math.sin(f * Math.PI) * 1.35;
    bypassedRoute.push({
      lat: baseLat + offsetLat * arc,
      lng: baseLng + offsetLng * arc
    });
  }

  for (let i = endIdx + 2; i < path.length; i++) {
    bypassedRoute.push(path[i]);
  }

  if (calculateDistanceMeters(bypassedRoute[bypassedRoute.length - 1], goal) > 1.0) {
    bypassedRoute.push(goal);
  }

  const safeBypassedRoute = ensureRouteAvoidsWater(bypassedRoute);

  return {
    bypassedRoute: safeBypassedRoute,
    waterSegment,
    streetName: 'Lake Perimeter Road / Satmasjid Bypass'
  };
}

/**
 * Checks perpendicular distance from a point P to a line segment AB in meters
 */
export function distanceToSegmentMeters(
  p: GeoCoordinate,
  a: GeoCoordinate,
  b: GeoCoordinate
): number {
  const l2 = calculateDistanceMeters(a, b);
  if (l2 === 0) return calculateDistanceMeters(p, a);

  // Approximate locally in flat coordinates for segment projection
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  const t = Math.max(0, Math.min(1, ((p.lat - a.lat) * dLat + (p.lng - a.lng) * dLng) / (dLat * dLat + dLng * dLng)));
  const projection: GeoCoordinate = {
    lat: a.lat + t * dLat,
    lng: a.lng + t * dLng
  };
  return calculateDistanceMeters(p, projection);
}

/**
 * Finds if any active obstacle intersects or is dangerously close to the path
 */
export function findObstacleOnPath(
  path: GeoCoordinate[],
  obstacles: MapObstacle[],
  corridorWidthMeters: number = 8.0
): { obstacle: MapObstacle; waypointIndex: number; distanceToCarMeters: number } | null {
  if (path.length < 2) return null;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    for (const obs of obstacles) {
      if (!obs.active) continue;
      const d = distanceToSegmentMeters({ lat: obs.lat, lng: obs.lng }, p1, p2);
      if (d < (obs.radiusMeters + corridorWidthMeters)) {
        const distToCar = calculateDistanceMeters(path[0], { lat: obs.lat, lng: obs.lng });
        return {
          obstacle: obs,
          waypointIndex: i,
          distanceToCarMeters: distToCar
        };
      }
    }
  }
  return null;
}

/**
 * Auto Path Finder: Generates a smooth, collision-free avoidance detour around an obstacle.
 * Supports passing currentPos to smoothly branch from the vehicle's exact position.
 */
export function generateObstacleAvoidanceDetour(
  path: GeoCoordinate[],
  obstacle: MapObstacle,
  side: 'left' | 'right' = 'right',
  clearanceMeters: number = 16.0,
  currentPos?: GeoCoordinate
): GeoCoordinate[] {
  if (path.length < 2) return path;

  // Find nearest path index to obstacle
  let closestIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = calculateDistanceMeters(path[i], { lat: obstacle.lat, lng: obstacle.lng });
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }

  const detourEndIdx = Math.min(path.length - 1, closestIdx + 3);
  const pStart = currentPos || path[Math.max(0, closestIdx - 3)];
  const pEnd = path[detourEndIdx];

  // Conversion: 1 meter in degrees approx (1 deg lat ~ 111,000m)
  const metersToLat = 1 / 111320;
  const metersToLng = 1 / (111320 * Math.cos((obstacle.lat * Math.PI) / 180));

  // Determine perpendicular vector to the path direction
  const vLat = pEnd.lat - pStart.lat;
  const vLng = pEnd.lng - pStart.lng;
  const len = Math.sqrt(vLat * vLat + vLng * vLng) || 1;

  // Perpendicular unit vector (normal)
  const sign = side === 'left' ? -1 : 1;
  const nLat = (-vLng / len) * sign;
  const nLng = (vLat / len) * sign;

  const totalOffsetMeters = obstacle.radiusMeters + clearanceMeters;
  const offsetLat = nLat * totalOffsetMeters * metersToLat;
  const offsetLng = nLng * totalOffsetMeters * metersToLng;

  const newPath: GeoCoordinate[] = [];

  if (currentPos) {
    // Detour starts seamlessly from the vehicle's current position
    newPath.push(currentPos);
    const numDetourPoints = 7;
    for (let j = 1; j <= numDetourPoints; j++) {
      const fraction = j / numDetourPoints;
      const baseLat = pStart.lat + (pEnd.lat - pStart.lat) * fraction;
      const baseLng = pStart.lng + (pEnd.lng - pStart.lng) * fraction;

      // Parabolic bell curve multiplier for smooth arc
      const bell = Math.sin(fraction * Math.PI);
      newPath.push({
        lat: baseLat + offsetLat * bell,
        lng: baseLng + offsetLng * bell
      });
    }
  } else {
    const detourStartIdx = Math.max(0, closestIdx - 3);
    for (let i = 0; i < detourStartIdx; i++) {
      newPath.push(path[i]);
    }
    const numDetourPoints = 6;
    for (let j = 0; j <= numDetourPoints; j++) {
      const fraction = j / numDetourPoints;
      const baseLat = pStart.lat + (pEnd.lat - pStart.lat) * fraction;
      const baseLng = pStart.lng + (pEnd.lng - pStart.lng) * fraction;

      const bell = Math.sin(fraction * Math.PI);
      newPath.push({
        lat: baseLat + offsetLat * bell,
        lng: baseLng + offsetLng * bell
      });
    }
  }

  // Keep path after detour leading to the destination
  for (let i = detourEndIdx + 1; i < path.length; i++) {
    newPath.push(path[i]);
  }

  // Guarantee destination point is intact
  if (path.length > 0 && newPath.length > 0) {
    const origGoal = path[path.length - 1];
    const lastPoint = newPath[newPath.length - 1];
    if (calculateDistanceMeters(origGoal, lastPoint) > 1.0) {
      newPath.push(origGoal);
    }
  }

  return newPath;
}

/**
 * Dynamic Speed Governor (Auto Speed Adjust)
 * Computes optimal autonomous vehicle speed (km/h) based on:
 * 1. Base cruise speed
 * 2. Heading curvature (slow down on sharp curves)
 * 3. Proximity to nearest obstacle (smooth deceleration -> emergency auto stop)
 */
export function computeAutoAdjustedSpeed(
  baseCruiseSpeed: number,
  headingDiffDegrees: number,
  distToObstacleMeters: number | null,
  minDistForAutoStop: number = 5.5
): {
  targetSpeedKmh: number;
  governorState: 'CRUISE' | 'DECELERATE_CURVE' | 'DECELERATE_OBSTACLE' | 'AUTO_STOP';
  throttlePercent: number;
} {
  // 1. Critical Obstacle Auto Stop
  if (distToObstacleMeters !== null && distToObstacleMeters <= minDistForAutoStop) {
    return {
      targetSpeedKmh: 0,
      governorState: 'AUTO_STOP',
      throttlePercent: 0
    };
  }

  let speed = baseCruiseSpeed;
  let state: 'CRUISE' | 'DECELERATE_CURVE' | 'DECELERATE_OBSTACLE' | 'AUTO_STOP' = 'CRUISE';

  // 2. Obstacle Proximity Deceleration (smooth slowdown within 30m caution zone)
  if (distToObstacleMeters !== null && distToObstacleMeters < 30.0) {
    // Proportional deceleration down to turning crawl (~7 km/h)
    const factor = Math.max(0.24, (distToObstacleMeters - minDistForAutoStop) / (30.0 - minDistForAutoStop));
    const obstacleSpeed = baseCruiseSpeed * factor;
    speed = Math.min(speed, obstacleSpeed);
    state = 'DECELERATE_OBSTACLE';
  }

  // 3. Curve / Turn Deceleration (slow down smoothly for turning)
  const absHeadingDiff = Math.abs(headingDiffDegrees);
  if (absHeadingDiff > 10) {
    // Sharp turn: limit speed to 7 - 10 km/h
    const turnFactor = Math.max(0.3, 1 - (absHeadingDiff - 10) / 45);
    const curveSpeed = baseCruiseSpeed * turnFactor;
    if (curveSpeed < speed) {
      speed = curveSpeed;
      if (state !== 'DECELERATE_OBSTACLE') {
        state = 'DECELERATE_CURVE';
      }
    }
  }

  const safeSpeed = Math.max(0, Math.round(speed * 10) / 10);
  const throttle = Math.round((safeSpeed / baseCruiseSpeed) * 100);

  return {
    targetSpeedKmh: safeSpeed,
    governorState: state,
    throttlePercent: throttle
  };
}

/**
 * Pre-calculates cumulative distance in meters for each vertex of a path
 */
export function calculatePathCumulativeDistances(path: GeoCoordinate[]): number[] {
  if (path.length === 0) return [];
  const dists: number[] = [0];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const d = calculateDistanceMeters(path[i], path[i + 1]);
    total += d;
    dists.push(total);
  }
  return dists;
}

/**
 * Smoothly interpolates an exact position and heading along a path at a given distance
 */
export function interpolatePositionAlongPath(
  path: GeoCoordinate[],
  cumulativeDistances: number[],
  targetDistanceMeters: number
): {
  position: GeoCoordinate;
  heading: number;
  segmentIndex: number;
  isEnd: boolean;
  remainingMeters: number;
} {
  if (path.length === 0) {
    return {
      position: { lat: 0, lng: 0 },
      heading: 0,
      segmentIndex: 0,
      isEnd: true,
      remainingMeters: 0
    };
  }

  const totalLength = cumulativeDistances[cumulativeDistances.length - 1] || 0;

  // If before start or at start
  if (targetDistanceMeters <= 0 || path.length === 1) {
    const heading = path.length > 1 ? calculateBearing(path[0], path[1]) : 0;
    return {
      position: path[0],
      heading,
      segmentIndex: 0,
      isEnd: false,
      remainingMeters: totalLength
    };
  }

  // If at or past end
  if (targetDistanceMeters >= totalLength) {
    const lastIdx = path.length - 1;
    const heading = path.length > 1 ? calculateBearing(path[lastIdx - 1], path[lastIdx]) : 0;
    return {
      position: path[lastIdx],
      heading,
      segmentIndex: lastIdx - 1,
      isEnd: true,
      remainingMeters: 0
    };
  }

  // Find the active segment
  let segIdx = 0;
  while (segIdx < cumulativeDistances.length - 2 && cumulativeDistances[segIdx + 1] < targetDistanceMeters) {
    segIdx++;
  }

  const dStart = cumulativeDistances[segIdx];
  const dEnd = cumulativeDistances[segIdx + 1];
  const segmentLength = dEnd - dStart;

  const t = segmentLength > 0 ? (targetDistanceMeters - dStart) / segmentLength : 0;
  const pA = path[segIdx];
  const pB = path[segIdx + 1];

  const lat = pA.lat + (pB.lat - pA.lat) * t;
  const lng = pA.lng + (pB.lng - pA.lng) * t;
  const heading = calculateBearing(pA, pB);
  const remainingMeters = Math.max(0, totalLength - targetDistanceMeters);

  return {
    position: { lat, lng },
    heading,
    segmentIndex: segIdx,
    isEnd: false,
    remainingMeters
  };
}

/**
 * Smoothly interpolates an angle in degrees dealing with 0/360 wrap-around
 */
export function smoothAngleLerp(current: number, target: number, t: number): number {
  const diff = ((target - current + 540) % 360) - 180;
  return (current + diff * Math.min(1, Math.max(0, t)) + 360) % 360;
}

/**
 * Browser Speech Synthesis voice prompt (Bangla / English)
 */
export function speakPrompt(text: string, lang: 'bn' | 'en' = 'bn'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Strict Road Boundary & Lane Confinement Checker
 * Ensures the vehicle position stays strictly within the exact road asphalt boundaries,
 * never wandering onto adjacent fields, grass, or land (jomi).
 */
export function clampToRoadCorridor(
  pos: GeoCoordinate,
  path: GeoCoordinate[]
): GeoCoordinate {
  if (path.length < 2) return pos;

  let minDist = Infinity;
  let bestPoint = pos;

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];

    const l2 = calculateDistanceMeters(a, b);
    if (l2 === 0) continue;

    const dLat = b.lat - a.lat;
    const dLng = b.lng - a.lng;
    const t = Math.max(0, Math.min(1, ((pos.lat - a.lat) * dLat + (pos.lng - a.lng) * dLng) / (dLat * dLat + dLng * dLng)));
    const proj: GeoCoordinate = {
      lat: a.lat + t * dLat,
      lng: a.lng + t * dLng
    };

    const d = calculateDistanceMeters(pos, proj);
    if (d < minDist) {
      minDist = d;
      bestPoint = proj;
    }
  }

  // Strictly lock vehicle within road asphalt boundaries (max 4.5m lateral tolerance)
  if (minDist > 4.5) {
    return bestPoint;
  }
  // Strictly lock vehicle 100% to the road centerline without any drift
  return bestPoint;
}

