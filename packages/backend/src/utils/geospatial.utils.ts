/**
 * Geospatial Utility Functions
 *
 * Pure functions for calculating distances, bearings, and spatial relationships.
 * Uses Haversine formula for accurate distance calculations on Earth's surface.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the great-circle distance between two points using the Haversine formula
 *
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 *
 * @example
 * const distance = calculateHaversineDistance(41.8781, -87.6298, 41.8897, -87.6231);
 * console.log(distance); // ~1.5 km
 */
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate the initial bearing from point 1 to point 2
 *
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Bearing in degrees (0-359), where 0 is North, 90 is East
 *
 * @example
 * const bearing = calculateBearing(41.8781, -87.6298, 41.8897, -87.6231);
 * console.log(bearing); // ~15 degrees (North-Northeast)
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const toDegrees = (radians: number) => (radians * 180) / Math.PI;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = (toDegrees(θ) + 360) % 360;

  return bearing;
};

/**
 * Calculate the angular difference between two bearings
 * Handles wrap-around at 0/360 degrees
 *
 * @param bearing1 - First bearing in degrees (0-359)
 * @param bearing2 - Second bearing in degrees (0-359)
 * @returns Angular difference in degrees (0-180)
 *
 * @example
 * angleDifference(10, 350); // Returns 20 (not 340)
 * angleDifference(90, 270); // Returns 180
 */
export const angleDifference = (bearing1: number, bearing2: number): number => {
  let diff = Math.abs(bearing1 - bearing2);
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
};

/**
 * Find the closest point from a list based on Haversine distance
 *
 * @param lat - Latitude of reference point
 * @param lon - Longitude of reference point
 * @param points - Array of points with stop_id, stop_lat, stop_lon
 * @returns The closest point, or undefined if no points provided
 */
export const findClosestPoint = <
  T extends { stop_id: string; stop_lat: number; stop_lon: number },
>(
  lat: number,
  lon: number,
  points: T[]
): T | undefined => {
  if (!points || points.length === 0) {
    return undefined;
  }

  let closestPoint: T | undefined = undefined;
  let minDistance = Infinity;

  for (const point of points) {
    const distance = calculateHaversineDistance(
      lat,
      lon,
      point.stop_lat,
      point.stop_lon
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }

  return closestPoint;
};

/**
 * Filter points that match a given bearing within a tolerance
 * Useful for determining which stations are "ahead" of a train's current position
 *
 * @param lat - Current latitude
 * @param lon - Current longitude
 * @param targetBearing - Target bearing in degrees
 * @param points - Array of points to filter
 * @param tolerance - Bearing tolerance in degrees (default: 45)
 * @returns Points that match the bearing criteria
 */
export const filterPointsByBearing = <
  T extends { stop_id: string; stop_lat: number; stop_lon: number },
>(
  lat: number,
  lon: number,
  targetBearing: number,
  points: T[],
  tolerance: number = 45
): T[] => {
  return points.filter((point) => {
    const bearing = calculateBearing(lat, lon, point.stop_lat, point.stop_lon);
    const diff = angleDifference(targetBearing, bearing);
    return diff <= tolerance;
  });
};
