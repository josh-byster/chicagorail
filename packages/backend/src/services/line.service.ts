import { getDatabase } from './database.service';
import { Line } from '@metra/shared';
import { normalizeHexColor, normalizeTextColor } from '../utils/color.utils';

/**
 * Line Service
 *
 * Queries train lines from SQLite database
 */

interface RouteRow {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
}

/**
 * Get all train lines
 * @returns Array of Line objects
 */
export const getAllLines = (): Line[] => {
  const db = getDatabase();
  
  const routes = db.prepare(`
    SELECT 
      route_id,
      route_short_name,
      route_long_name,
      route_type,
      route_color,
      route_text_color
    FROM routes
    ORDER BY route_long_name
  `).all() as RouteRow[];
  
  // Get stations for each line
  const lineStations: Record<string, string[]> = {};
  
  // For each route, get unique stations
  routes.forEach(route => {
    const stations = db.prepare(`
      SELECT DISTINCT st.stop_id
      FROM stop_times st
      JOIN trips t ON st.trip_id = t.trip_id
      WHERE t.route_id = ?
      ORDER BY st.stop_id
    `).all(route.route_id) as { stop_id: string }[];
    
    lineStations[route.route_id] = stations.map(s => s.stop_id);
  });
  
  // Transform routes to Line objects
  return routes.map((route) => ({
    line_id: route.route_id,
    line_name: route.route_long_name,
    line_short_name: route.route_short_name,
    line_color: normalizeHexColor(route.route_color, '000000'),
    line_text_color: normalizeTextColor(route.route_text_color, 'FFFFFF'),
    stations: lineStations[route.route_id] || [],
  })) as Line[];
};

/**
 * Get a specific train line by ID
 * @param lineId - The line ID to look up
 * @returns Line object or null if not found
 */
export const getLineById = (lineId: string): Line | null => {
  const db = getDatabase();
  
  const route = db.prepare(`
    SELECT 
      route_id,
      route_short_name,
      route_long_name,
      route_type,
      route_color,
      route_text_color
    FROM routes
    WHERE route_id = ?
  `).get(lineId) as RouteRow | undefined;
  
  if (!route) {
    return null;
  }
  
  // Get stations for this line
  const stations = db.prepare(`
    SELECT DISTINCT st.stop_id
    FROM stop_times st
    JOIN trips t ON st.trip_id = t.trip_id
    WHERE t.route_id = ?
    ORDER BY st.stop_id
  `).all(lineId) as { stop_id: string }[];
  
  const stationIds = stations.map(s => s.stop_id);
  
  return {
    line_id: route.route_id,
    line_name: route.route_long_name,
    line_short_name: route.route_short_name,
    line_color: normalizeHexColor(route.route_color, '000000'),
    line_text_color: normalizeTextColor(route.route_text_color, 'FFFFFF'),
    stations: stationIds,
  } as Line;
};
