/**
 * GTFS Parser Service
 *
 * Parses GTFS CSV files into typed data structures.
 *
 * Single Responsibility: CSV parsing and data transformation
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import * as logger from '../utils/logger.utils.js';
import type {
  GTFSData,
  GTFSAgency,
  GTFSRoute,
  GTFSStop,
  GTFSTrip,
  GTFSStopTime,
  GTFSCalendar,
  GTFSCalendarDate,
} from '../types/gtfs.types.js';

/**
 * Parse a single GTFS CSV file
 */
const parseGTFSFile = <T>(filePath: string): T[] => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        // Convert numeric strings to numbers for specific columns
        if (
          context.column === 'stop_lat' ||
          context.column === 'stop_lon' ||
          context.column === 'route_type' ||
          context.column === 'direction_id' ||
          context.column === 'stop_sequence' ||
          context.column === 'wheelchair_boarding' ||
          context.column === 'exception_type' ||
          context.column === 'monday' ||
          context.column === 'tuesday' ||
          context.column === 'wednesday' ||
          context.column === 'thursday' ||
          context.column === 'friday' ||
          context.column === 'saturday' ||
          context.column === 'sunday'
        ) {
          return value ? parseFloat(value) : null;
        }
        return value;
      },
    });
    return records as T[];
  } catch (error) {
    logger.error(`Failed to parse ${filePath}:`, error);
    throw error;
  }
};

/**
 * Parse all GTFS files from the extracted directory
 */
export const parseGTFSFiles = (tempDir: string): GTFSData => {
  logger.debug('Parsing GTFS files...');

  const agencies = parseGTFSFile<GTFSAgency>(path.join(tempDir, 'agency.txt'));
  logger.debug(`Parsed ${agencies.length} agencies`);

  const routes = parseGTFSFile<GTFSRoute>(path.join(tempDir, 'routes.txt'));
  logger.debug(`Parsed ${routes.length} routes`);

  const stops = parseGTFSFile<GTFSStop>(path.join(tempDir, 'stops.txt'));
  logger.debug(`Parsed ${stops.length} stops`);

  const trips = parseGTFSFile<GTFSTrip>(path.join(tempDir, 'trips.txt'));
  logger.debug(`Parsed ${trips.length} trips`);

  const stopTimes = parseGTFSFile<GTFSStopTime>(
    path.join(tempDir, 'stop_times.txt')
  );
  logger.debug(`Parsed ${stopTimes.length} stop times`);

  const calendar = parseGTFSFile<GTFSCalendar>(
    path.join(tempDir, 'calendar.txt')
  );
  logger.debug(`Parsed ${calendar.length} calendar entries`);

  const calendarDates = parseGTFSFile<GTFSCalendarDate>(
    path.join(tempDir, 'calendar_dates.txt')
  );
  logger.debug(`Parsed ${calendarDates.length} calendar date exceptions`);

  return {
    agencies,
    routes,
    stops,
    trips,
    stopTimes,
    calendar,
    calendarDates,
  };
};
