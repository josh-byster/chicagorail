/**
 * Station Mapper
 *
 * Transforms database rows to domain objects.
 * Single Responsibility: Data transformation for stations
 */

import type { Station } from '@metra/shared';

/**
 * Database row interface for station queries
 */
export interface StationRow {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  lines_served: string;
  zone: string | null;
  wheelchair_accessible: number;
}

/**
 * Transform a database row to a Station object
 *
 * @param row - Raw database row from stops table
 * @returns Station domain object
 */
export const transformStationRow = (row: StationRow): Station => ({
  station_id: row.station_id,
  station_name: row.station_name,
  latitude: row.latitude,
  longitude: row.longitude,
  lines_served: JSON.parse(row.lines_served || '[]'),
  zone: row.zone || undefined,
  wheelchair_accessible: row.wheelchair_accessible === 1,
});

/**
 * Transform multiple database rows to Station objects
 *
 * @param rows - Array of raw database rows
 * @returns Array of Station domain objects
 */
export const transformStationRows = (rows: StationRow[]): Station[] =>
  rows.map(transformStationRow);
