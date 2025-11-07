/**
 * Utility functions for handling datetime operations in Chicago timezone.
 * These functions handle GTFS time formatting and timezone conversions.
 */

/**
 * Calculates the timezone offset for Chicago (America/Chicago) on a given date.
 * Accounts for daylight saving time (DST) transitions.
 *
 * @param dateStr - Date string in ISO format (YYYY-MM-DD)
 * @returns Timezone offset string in format ±HH:MM (e.g., "-06:00" for CST, "-05:00" for CDT)
 *
 * @example
 * getChicagoOffset('2025-01-15') // Returns "-06:00" (CST in winter)
 * getChicagoOffset('2025-07-15') // Returns "-05:00" (CDT in summer)
 */
export const getChicagoOffset = (dateStr: string): string => {
  // Create a specific moment in UTC (noon to avoid edge cases)
  const utcDate = new Date(`${dateStr}T12:00:00Z`);

  // Format in Chicago timezone to see what hour it is there
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    hour12: false,
  });

  const chicagoHourStr = formatter.format(utcDate);
  const chicagoHour = parseInt(chicagoHourStr);

  // Calculate offset: Chicago time - UTC time
  const utcHour = 12;
  let offsetHours = chicagoHour - utcHour;

  // Handle day boundary crossing
  if (offsetHours > 12) offsetHours -= 24;
  if (offsetHours < -12) offsetHours += 24;

  // Format as ±HH:MM
  const sign = offsetHours >= 0 ? '+' : '-';
  const absHours = Math.abs(offsetHours);

  return `${sign}${String(absHours).padStart(2, '0')}:00`;
};

/**
 * Constructs an ISO 8601 datetime string from a GTFS time string and date,
 * accounting for times that go past midnight and Chicago timezone.
 *
 * GTFS times can exceed 24 hours to represent service past midnight
 * (e.g., "25:30:00" represents 1:30 AM the next day).
 *
 * @param timeStr - GTFS time string in HH:MM:SS format (may exceed 24 hours)
 * @param dateStr - Base date string in ISO format (YYYY-MM-DD)
 * @returns ISO 8601 datetime string with Chicago timezone offset
 *
 * @example
 * constructDateTime('14:30:00', '2025-01-15') // "2025-01-15T14:30:00-06:00"
 * constructDateTime('25:30:00', '2025-01-15') // "2025-01-16T01:30:00-06:00" (next day)
 * constructDateTime('', '2025-01-15')         // "" (empty input returns empty)
 */
export const constructDateTime = (timeStr: string, dateStr: string): string => {
  if (!timeStr) return '';

  // Handle GTFS times that go past midnight (e.g., "25:30:00" for 1:30 AM next day)
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  let adjustedDate = dateStr;
  let adjustedHours = hours;

  if (hours >= 24) {
    // Calculate how many days to add
    const daysToAdd = Math.floor(hours / 24);
    adjustedHours = hours % 24;

    // Add days to the date
    const date = new Date(dateStr);
    date.setDate(date.getDate() + daysToAdd);
    adjustedDate = date.toISOString().split('T')[0];
  }

  const normalizedTime = `${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const offset = getChicagoOffset(adjustedDate);
  return `${adjustedDate}T${normalizedTime}${offset}`;
};
