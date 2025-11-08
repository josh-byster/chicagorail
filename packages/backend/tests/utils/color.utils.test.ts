/**
 * Unit tests for color utility functions
 * All functions are pure
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeHexColor,
  normalizeTextColor,
} from '../../src/utils/color.utils';

describe('color.utils', () => {
  describe('normalizeHexColor', () => {
    it('should add # prefix to valid 6-char hex', () => {
      expect(normalizeHexColor('FF0000')).toBe('#FF0000');
      expect(normalizeHexColor('00FF00')).toBe('#00FF00');
      expect(normalizeHexColor('0000FF')).toBe('#0000FF');
    });

    it('should preserve # prefix if already present', () => {
      expect(normalizeHexColor('#FF0000')).toBe('#FF0000');
      expect(normalizeHexColor('#ABCDEF')).toBe('#ABCDEF');
    });

    it('should convert to uppercase', () => {
      expect(normalizeHexColor('ff0000')).toBe('#FF0000');
      expect(normalizeHexColor('abcdef')).toBe('#ABCDEF');
      expect(normalizeHexColor('#abcdef')).toBe('#ABCDEF');
    });

    it('should handle 3-char shorthand', () => {
      // F00 → FF0000
      expect(normalizeHexColor('F00')).toBe('#FF0000');
      // ABC → AABBCC
      expect(normalizeHexColor('ABC')).toBe('#AABBCC');
      // 123 → 112233
      expect(normalizeHexColor('123')).toBe('#112233');
    });

    it('should pad 4-char codes with leading zeros', () => {
      // 8000 → 008000 (common for green in GTFS)
      expect(normalizeHexColor('8000')).toBe('#008000');
      expect(normalizeHexColor('ABCD')).toBe('#00ABCD');
    });

    it('should pad short codes with leading zeros', () => {
      expect(normalizeHexColor('1')).toBe('#000001');
      expect(normalizeHexColor('12')).toBe('#000012');
      expect(normalizeHexColor('123')).toBe('#112233'); // 3-char is special case
      expect(normalizeHexColor('1234')).toBe('#001234');
      expect(normalizeHexColor('12345')).toBe('#012345');
    });

    it('should truncate codes longer than 6 chars', () => {
      expect(normalizeHexColor('1234567')).toBe('#123456');
      expect(normalizeHexColor('ABCDEF123')).toBe('#ABCDEF');
    });

    it('should handle null and undefined', () => {
      expect(normalizeHexColor(null)).toBe('#000000');
      expect(normalizeHexColor(undefined)).toBe('#000000');
    });

    it('should use custom fallback', () => {
      expect(normalizeHexColor(null, 'FFFFFF')).toBe('#FFFFFF');
      expect(normalizeHexColor(undefined, 'FF0000')).toBe('#FF0000');
      expect(normalizeHexColor('', 'ABCDEF')).toBe('#ABCDEF');
    });

    it('should handle empty string', () => {
      expect(normalizeHexColor('')).toBe('#000000');
      expect(normalizeHexColor('   ')).toBe('#000000');
    });

    it('should trim whitespace', () => {
      expect(normalizeHexColor('  FF0000  ')).toBe('#FF0000');
      // Note: '#ABCDEF' with spaces becomes ' ABCDEF ' after # removal,
      // then trimmed to 'ABCDEF', but whitespace in the original makes it invalid
      expect(normalizeHexColor('#ABCDEF')).toBe('#ABCDEF');
    });

    it('should reject invalid hex characters', () => {
      expect(normalizeHexColor('GGGGGG')).toBe('#000000');
      expect(normalizeHexColor('ZZZZZZ')).toBe('#000000');
      expect(normalizeHexColor('HELLO!')).toBe('#000000');
      expect(normalizeHexColor('FF-000')).toBe('#000000');
    });

    it('should handle mixed case', () => {
      expect(normalizeHexColor('AbCdEf')).toBe('#ABCDEF');
      expect(normalizeHexColor('#FfFfFf')).toBe('#FFFFFF');
    });

    it('should handle common Metra colors', () => {
      // Metra BNSF Railway (red)
      expect(normalizeHexColor('DE1F2D')).toBe('#DE1F2D');

      // Metra UP North (green)
      expect(normalizeHexColor('008000')).toBe('#008000');

      // Metra Rock Island (blue)
      expect(normalizeHexColor('0060A9')).toBe('#0060A9');
    });

    it('should handle edge case with "0" string', () => {
      expect(normalizeHexColor('0')).toBe('#000000');
    });

    it('should handle "000000" (black)', () => {
      expect(normalizeHexColor('000000')).toBe('#000000');
      expect(normalizeHexColor('#000000')).toBe('#000000');
    });

    it('should handle "FFFFFF" (white)', () => {
      expect(normalizeHexColor('FFFFFF')).toBe('#FFFFFF');
      expect(normalizeHexColor('#FFFFFF')).toBe('#FFFFFF');
    });
  });

  describe('normalizeTextColor', () => {
    it('should convert numeric 0 to black', () => {
      expect(normalizeTextColor(0)).toBe('#000000');
      expect(normalizeTextColor('0')).toBe('#000000');
    });

    it('should handle null and undefined', () => {
      expect(normalizeTextColor(null)).toBe('#FFFFFF');
      expect(normalizeTextColor(undefined)).toBe('#FFFFFF');
    });

    it('should use custom fallback', () => {
      expect(normalizeTextColor(null, '000000')).toBe('#000000');
      expect(normalizeTextColor(undefined, 'FF0000')).toBe('#FF0000');
    });

    it('should delegate to normalizeHexColor for hex strings', () => {
      expect(normalizeTextColor('FFFFFF')).toBe('#FFFFFF');
      expect(normalizeTextColor('FF0000')).toBe('#FF0000');
      expect(normalizeTextColor('#ABCDEF')).toBe('#ABCDEF');
    });

    it('should handle string "0" as black', () => {
      expect(normalizeTextColor('0')).toBe('#000000');
    });

    it('should handle numeric values other than 0', () => {
      // Numbers get converted to strings: 255 → "255" (3 chars)
      // 3-char codes are expanded: "255" → "225555"
      expect(normalizeTextColor(255)).toBe('#225555');
    });

    it('should handle empty string', () => {
      expect(normalizeTextColor('')).toBe('#FFFFFF');
    });

    it('should handle valid hex colors', () => {
      expect(normalizeTextColor('000000')).toBe('#000000');
      expect(normalizeTextColor('FFFFFF')).toBe('#FFFFFF');
      expect(normalizeTextColor('FF0000')).toBe('#FF0000');
    });

    it('should handle short hex codes', () => {
      expect(normalizeTextColor('FFF')).toBe('#FFFFFF');
      expect(normalizeTextColor('F00')).toBe('#FF0000');
    });

    it('should preserve behavior for all normalizeHexColor cases', () => {
      // Should behave same as normalizeHexColor for non-null/non-zero values
      expect(normalizeTextColor('8000')).toBe('#008000');
      expect(normalizeTextColor('ABC')).toBe('#AABBCC');
      expect(normalizeTextColor('  FF0000  ')).toBe('#FF0000');
    });

    it('should handle invalid input by using fallback', () => {
      expect(normalizeTextColor('invalid')).toBe('#FFFFFF');
      expect(normalizeTextColor('GGGGGG')).toBe('#FFFFFF');
    });

    it('should differentiate between 0 and other falsy values', () => {
      expect(normalizeTextColor(0)).toBe('#000000');
      expect(normalizeTextColor(null)).toBe('#FFFFFF');
      expect(normalizeTextColor(undefined)).toBe('#FFFFFF');
      expect(normalizeTextColor('')).toBe('#FFFFFF');
    });
  });
});
