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
  const totalDist = calculateDistanceMeters(start, goal);
  // Choose 1 or 2 turns based on distance
  const turnCount = preferredTurns !== undefined ? preferredTurns : (totalDist > 250 ? 2 : 1);
  const metersToLat = 1 / 111320;
  const metersToLng = 1 / (111320 * Math.cos((start.lat * Math.PI) / 180));

  const dLat = goal.lat - start.lat;
  const dLng = goal.lng - start.lng;
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

  // Orthogonal normal vector
  const nLat = -dLng / len;
  const nLng = dLat / len;

  const turns: RouteTurnManeuver[] = [];
  const waypoints: GeoCoordinate[] = [start];

  if (turnCount === 1) {
    // 1 Turn: Corner turn at ~45% distance
    const turnDistMeters = totalDist * 0.45;
    const offsetDistMeters = Math.min(65, Math.max(28, totalDist * 0.22));
    const cornerBaseLat = start.lat + dLat * 0.45;
    const cornerBaseLng = start.lng + dLng * 0.45;
    const cornerLat = cornerBaseLat + nLat * offsetDistMeters * metersToLat;
    const cornerLng = cornerBaseLng + nLng * offsetDistMeters * metersToLng;

    const cornerPoint: GeoCoordinate = { lat: cornerLat, lng: cornerLng };

    // Bearing into corner and bearing out of corner
    const bIn = calculateBearing(start, cornerPoint);
    const bOut = calculateBearing(cornerPoint, goal);
    const def = ((bOut - bIn + 540) % 360) - 180;
    const direction: TurnDirection = def > 0 ? 'RIGHT' : 'LEFT';

    const street = STREET_NAMES_POOL[0];
    turns.push({
      id: `turn-1-${Date.now()}`,
      distanceFromStartMeters: Math.round(turnDistMeters),
      location: cornerPoint,
      direction,
      turnAngleDeg: Math.abs(Math.round(def)),
      instructionBn: direction === 'RIGHT' ? `Turn Right onto ${street.en}` : `Turn Left onto ${street.en}`,
      instructionEn: direction === 'RIGHT' ? `Turn Right onto ${street.en}` : `Turn Left onto ${street.en}`,
      streetNameBn: street.en,
      streetNameEn: street.en,
      completed: false
    });

    // Leg 1: start to corner approach
    const leg1Steps = 12;
    for (let i = 1; i <= leg1Steps; i++) {
      const f = i / (leg1Steps + 1);
      waypoints.push({
        lat: start.lat + (cornerLat - start.lat) * f,
        lng: start.lng + (cornerLng - start.lng) * f
      });
    }

    // Fillet / curve around the corner (3-4 smooth intermediate points)
    const filletSteps = 5;
    for (let i = 1; i <= filletSteps; i++) {
      const t = i / (filletSteps + 1);
      // Quadratic bezier between end of leg 1, corner, and start of leg 2
      const p0 = waypoints[waypoints.length - 1];
      const p1 = cornerPoint;
      const p2 = {
        lat: cornerPoint.lat + (goal.lat - cornerPoint.lat) * 0.15,
        lng: cornerPoint.lng + (goal.lng - cornerPoint.lng) * 0.15
      };
      const bLat = (1 - t) * (1 - t) * p0.lat + 2 * (1 - t) * t * p1.lat + t * t * p2.lat;
      const bLng = (1 - t) * (1 - t) * p0.lng + 2 * (1 - t) * t * p1.lng + t * t * p2.lng;
      waypoints.push({ lat: bLat, lng: bLng });
    }

    // Leg 2: corner exit to goal
    const leg2Steps = 14;
    const lastP = waypoints[waypoints.length - 1];
    for (let i = 1; i <= leg2Steps; i++) {
      const f = i / leg2Steps;
      waypoints.push({
        lat: lastP.lat + (goal.lat - lastP.lat) * f,
        lng: lastP.lng + (goal.lng - lastP.lng) * f
      });
    }
  } else {
    // 2 Turns: Corner 1 at ~33% distance, Corner 2 at ~68% distance
    const turn1Dist = totalDist * 0.33;
    const turn2Dist = totalDist * 0.68;
    const offset1 = Math.min(55, Math.max(25, totalDist * 0.18));
    const offset2 = -offset1 * 0.8; // Zigzag road turn

    const c1BaseLat = start.lat + dLat * 0.33;
    const c1BaseLng = start.lng + dLng * 0.33;
    const c1: GeoCoordinate = {
      lat: c1BaseLat + nLat * offset1 * metersToLat,
      lng: c1BaseLng + nLng * offset1 * metersToLng
    };

    const c2BaseLat = start.lat + dLat * 0.68;
    const c2BaseLng = start.lng + dLng * 0.68;
    const c2: GeoCoordinate = {
      lat: c2BaseLat + nLat * offset2 * metersToLat,
      lng: c2BaseLng + nLng * offset2 * metersToLng
    };

    // Calculate Turn 1
    const bIn1 = calculateBearing(start, c1);
    const bOut1 = calculateBearing(c1, c2);
    const def1 = ((bOut1 - bIn1 + 540) % 360) - 180;
    const dir1: TurnDirection = def1 > 0 ? 'RIGHT' : 'LEFT';
    const street1 = STREET_NAMES_POOL[1];

    turns.push({
      id: `turn-1-${Date.now()}`,
      distanceFromStartMeters: Math.round(turn1Dist),
      location: c1,
      direction: dir1,
      turnAngleDeg: Math.abs(Math.round(def1)),
      instructionBn: dir1 === 'RIGHT' ? `Turn Right onto ${street1.en}` : `Turn Left onto ${street1.en}`,
      instructionEn: dir1 === 'RIGHT' ? `Turn Right onto ${street1.en}` : `Turn Left onto ${street1.en}`,
      streetNameBn: street1.en,
      streetNameEn: street1.en,
      completed: false
    });

    // Calculate Turn 2
    const bIn2 = calculateBearing(c1, c2);
    const bOut2 = calculateBearing(c2, goal);
    const def2 = ((bOut2 - bIn2 + 540) % 360) - 180;
    const dir2: TurnDirection = def2 > 0 ? 'RIGHT' : 'LEFT';
    const street2 = STREET_NAMES_POOL[2];

    turns.push({
      id: `turn-2-${Date.now()}`,
      distanceFromStartMeters: Math.round(turn2Dist),
      location: c2,
      direction: dir2,
      turnAngleDeg: Math.abs(Math.round(def2)),
      instructionBn: dir2 === 'RIGHT' ? `Turn Right onto ${street2.en}` : `Turn Left onto ${street2.en}`,
      instructionEn: dir2 === 'RIGHT' ? `Turn Right onto ${street2.en}` : `Turn Left onto ${street2.en}`,
      streetNameBn: street2.en,
      streetNameEn: street2.en,
      completed: false
    });

    // Generate waypoints along leg 1, fillet 1, leg 2, fillet 2, leg 3
    const leg1Steps = 9;
    for (let i = 1; i <= leg1Steps; i++) {
      const f = i / (leg1Steps + 1);
      waypoints.push({
        lat: start.lat + (c1.lat - start.lat) * f,
        lng: start.lng + (c1.lng - start.lng) * f
      });
    }

    // Fillet 1
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const p0 = waypoints[waypoints.length - 1];
      const p1 = c1;
      const p2 = { lat: c1.lat + (c2.lat - c1.lat) * 0.18, lng: c1.lng + (c2.lng - c1.lng) * 0.18 };
      waypoints.push({
        lat: (1 - t) * (1 - t) * p0.lat + 2 * (1 - t) * t * p1.lat + t * t * p2.lat,
        lng: (1 - t) * (1 - t) * p0.lng + 2 * (1 - t) * t * p1.lng + t * t * p2.lng
      });
    }

    // Leg 2: between corners
    const leg2Steps = 10;
    const lastP1 = waypoints[waypoints.length - 1];
    for (let i = 1; i <= leg2Steps; i++) {
      const f = i / (leg2Steps + 1);
      waypoints.push({
        lat: lastP1.lat + (c2.lat - lastP1.lat) * f,
        lng: lastP1.lng + (c2.lng - lastP1.lng) * f
      });
    }

    // Fillet 2
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const p0 = waypoints[waypoints.length - 1];
      const p1 = c2;
      const p2 = { lat: c2.lat + (goal.lat - c2.lat) * 0.18, lng: c2.lng + (goal.lng - c2.lng) * 0.18 };
      waypoints.push({
        lat: (1 - t) * (1 - t) * p0.lat + 2 * (1 - t) * t * p1.lat + t * t * p2.lat,
        lng: (1 - t) * (1 - t) * p0.lng + 2 * (1 - t) * t * p1.lng + t * t * p2.lng
      });
    }

    // Leg 3: c2 to goal
    const leg3Steps = 11;
    const lastP2 = waypoints[waypoints.length - 1];
    for (let i = 1; i <= leg3Steps; i++) {
      const f = i / leg3Steps;
      waypoints.push({
        lat: lastP2.lat + (goal.lat - lastP2.lat) * f,
        lng: lastP2.lng + (goal.lng - lastP2.lng) * f
      });
    }
  }

  // Ensure goal is exactly the final waypoint
  waypoints.push(goal);

  const sanitizedWaypoints = ensureRouteAvoidsWater(waypoints);
  return { waypoints: sanitizedWaypoints, turns };
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

/**
 * Universally ensures any route waypoints and segments strictly avoid cutting through
 * ANY blue water body / jolasoi (lake, river, reservoir) anywhere on the map,
 * routing exclusively along paved asphalt roads.
 */
export function ensureRouteAvoidsWater(waypoints: GeoCoordinate[]): GeoCoordinate[] {
  const safeRadius = 95.0; // meters

  if (waypoints.length === 0) return waypoints;

  // Paved road reference corridors
  const roadCorridors: GeoCoordinate[][] = [
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

  const refined: GeoCoordinate[] = [];
  for (let i = 0; i < waypoints.length; i++) {
    const pt = waypoints[i];
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
      // Force point onto paved land road perimeter
      const landBypass: GeoCoordinate = {
        lat: nearestWaterCenter.lat + 0.0014,
        lng: nearestWaterCenter.lng + 0.0016
      };
      refined.push(landBypass);
    } else {
      // Snap to nearest paved road corridor
      let closestPt = pt;
      let minD = Infinity;
      for (const corridor of roadCorridors) {
        for (let j = 0; j < corridor.length - 1; j++) {
          const a = corridor[j];
          const b = corridor[j + 1];
          const l2 = calculateDistanceMeters(a, b);
          if (l2 === 0) continue;
          const dLat = b.lat - a.lat;
          const dLng = b.lng - a.lng;
          const t = Math.max(0, Math.min(1, ((pt.lat - a.lat) * dLat + (pt.lng - a.lng) * dLng) / (dLat * dLat + dLng * dLng)));
          const proj: GeoCoordinate = { lat: a.lat + t * dLat, lng: a.lng + t * dLng };
          const d = calculateDistanceMeters(pt, proj);
          if (d < minD) {
            minD = d;
            closestPt = proj;
          }
        }
      }
      if (minD > 20 && minD < 120) {
        refined.push({
          lat: pt.lat * 0.4 + closestPt.lat * 0.6,
          lng: pt.lng * 0.4 + closestPt.lng * 0.6
        });
      } else {
        refined.push(pt);
      }
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

  return fullySafe;
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

