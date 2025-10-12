/**
 * Color Utility Functions
 *
 * Handles validation and normalization of hex color codes from GTFS data
 */

/**
 * Normalizes a hex color code to ensure it's valid 6-character hex
 * Handles common issues from GTFS data:
 * - Missing # prefix (adds it)
 * - Short hex codes like "8000" (pads to 6 chars)
 * - Invalid values (returns fallback)
 *
 * @param color - The color string from GTFS (may or may not have # prefix)
 * @param fallback - Fallback color if invalid (default: '000000' black)
 * @returns Normalized hex color with # prefix (e.g., '#008000')
 */
export const normalizeHexColor = (color: string | null | undefined, fallback: string = '000000'): string => {
  // Handle null/undefined
  if (!color) {
    return `#${fallback}`;
  }

  // Remove # if present
  let cleaned = color.replace(/^#/, '');

  // Remove any whitespace
  cleaned = cleaned.trim();

  // Check if it's a valid hex string
  if (!/^[0-9A-Fa-f]+$/.test(cleaned)) {
    return `#${fallback}`;
  }

  // Handle different lengths
  if (cleaned.length === 6) {
    // Already valid 6-char hex
    return `#${cleaned.toUpperCase()}`;
  } else if (cleaned.length === 3) {
    // Short form like "F00" -> "FF0000"
    return `#${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`.toUpperCase();
  } else if (cleaned.length === 4) {
    // Pad 4-char codes by adding zeros to the end
    // "8000" -> "008000" (common for green)
    return `#${cleaned.padEnd(6, '0').toUpperCase()}`;
  } else if (cleaned.length < 6) {
    // Pad short codes with leading zeros
    return `#${cleaned.padStart(6, '0').toUpperCase()}`;
  } else {
    // Too long, truncate to 6 chars
    return `#${cleaned.substring(0, 6).toUpperCase()}`;
  }
};

/**
 * Converts GTFS numeric text color to hex
 * GTFS allows route_text_color to be 0 (meaning black) or a hex string
 *
 * @param textColor - The text color from GTFS (number 0 or hex string)
 * @param fallback - Fallback color (default: 'FFFFFF' white)
 * @returns Normalized hex color with # prefix
 */
export const normalizeTextColor = (textColor: string | number | null | undefined, fallback: string = 'FFFFFF'): string => {
  // Handle null/undefined
  if (textColor === null || textColor === undefined) {
    return `#${fallback}`;
  }

  // Handle numeric 0 (black)
  if (textColor === 0 || textColor === '0') {
    return '#000000';
  }

  // Handle as hex string
  return normalizeHexColor(String(textColor), fallback);
};
