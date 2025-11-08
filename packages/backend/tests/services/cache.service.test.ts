/**
 * Unit tests for cache service
 * Tests TTL, LRU eviction, cleanup, and statistics
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateTrainCacheKey,
  getCachedData,
  setCachedData,
  clearCache,
  getCacheStats,
  cleanupExpired,
  setTimeProvider,
  resetTimeProvider,
  DEFAULT_TTL,
  MAX_CACHE_SIZE,
} from '../../src/services/cache.service';

describe('cache.service', () => {
  let mockTime = 1000000;

  beforeEach(() => {
    clearCache();
    mockTime = 1000000;
    setTimeProvider(() => mockTime);
  });

  afterEach(() => {
    clearCache();
    resetTimeProvider();
  });

  describe('generateTrainCacheKey', () => {
    it('should generate cache key with all parameters', () => {
      const key = generateTrainCacheKey(
        'ORIGIN',
        'DEST',
        10,
        '14:30:00',
        '2025-01-15'
      );
      expect(key).toBe('trains:ORIGIN:DEST:10:14:30:00:2025-01-15');
    });

    it('should use defaults for missing parameters', () => {
      const key = generateTrainCacheKey('ORIGIN', 'DEST');
      expect(key).toBe('trains:ORIGIN:DEST:all:now:today');
    });

    it('should handle partial parameters', () => {
      const key = generateTrainCacheKey('ORIGIN', 'DEST', 5);
      expect(key).toBe('trains:ORIGIN:DEST:5:now:today');
    });

    it('should generate different keys for different origins', () => {
      const key1 = generateTrainCacheKey('ORIGIN1', 'DEST');
      const key2 = generateTrainCacheKey('ORIGIN2', 'DEST');
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different destinations', () => {
      const key1 = generateTrainCacheKey('ORIGIN', 'DEST1');
      const key2 = generateTrainCacheKey('ORIGIN', 'DEST2');
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different limits', () => {
      const key1 = generateTrainCacheKey('ORIGIN', 'DEST', 5);
      const key2 = generateTrainCacheKey('ORIGIN', 'DEST', 10);
      expect(key1).not.toBe(key2);
    });
  });

  describe('getCachedData and setCachedData', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key';
      const data = { value: 'test' };

      setCachedData(key, data);
      const retrieved = getCachedData(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const result = getCachedData('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      setCachedData('string', 'test');
      setCachedData('number', 123);
      setCachedData('boolean', true);
      setCachedData('array', [1, 2, 3]);
      setCachedData('object', { a: 1, b: 2 });

      expect(getCachedData('string')).toBe('test');
      expect(getCachedData('number')).toBe(123);
      expect(getCachedData('boolean')).toBe(true);
      expect(getCachedData('array')).toEqual([1, 2, 3]);
      expect(getCachedData('object')).toEqual({ a: 1, b: 2 });
    });

    it('should update existing key', () => {
      const key = 'test-key';
      setCachedData(key, 'old');
      setCachedData(key, 'new');

      expect(getCachedData(key)).toBe('new');
    });

    it('should use default TTL', () => {
      const key = 'test-key';
      setCachedData(key, 'data');

      // Advance time by less than DEFAULT_TTL
      mockTime += DEFAULT_TTL / 2;
      expect(getCachedData(key)).toBe('data');

      // Advance time past DEFAULT_TTL
      mockTime += DEFAULT_TTL / 2 + 1;
      expect(getCachedData(key)).toBeNull();
    });

    it('should respect custom TTL', () => {
      const key = 'test-key';
      const customTTL = 5000;

      setCachedData(key, 'data', customTTL);

      // Within TTL
      mockTime += customTTL - 1;
      expect(getCachedData(key)).toBe('data');

      // Past TTL
      mockTime += 2;
      expect(getCachedData(key)).toBeNull();
    });

    it('should delete expired entry on access', () => {
      const key = 'test-key';
      setCachedData(key, 'data', 1000);

      const stats1 = getCacheStats();
      expect(stats1.size).toBe(1);

      // Expire the entry
      mockTime += 1001;

      // Access should delete it
      getCachedData(key);

      const stats2 = getCacheStats();
      expect(stats2.size).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache is full', () => {
      // Fill cache to MAX_CACHE_SIZE
      for (let i = 0; i < MAX_CACHE_SIZE; i++) {
        setCachedData(`key-${i}`, `value-${i}`);
      }

      // Access key-0 to make it recently used
      mockTime += 100;
      getCachedData('key-0');

      // Add one more entry (should evict key-1, the oldest unaccessed)
      mockTime += 100;
      setCachedData('new-key', 'new-value');

      // key-0 should still exist (was accessed)
      expect(getCachedData('key-0')).toBe('value-0');

      // key-1 should be evicted
      expect(getCachedData('key-1')).toBeNull();

      // new-key should exist
      expect(getCachedData('new-key')).toBe('new-value');

      // Cache size should still be MAX_CACHE_SIZE
      expect(getCacheStats().size).toBe(MAX_CACHE_SIZE);
    });

    it('should track last accessed time', () => {
      setCachedData('key-1', 'value-1');
      mockTime += 1000;
      setCachedData('key-2', 'value-2');

      // Access key-1 to update its lastAccessed
      mockTime += 1000;
      getCachedData('key-1');

      // Fill to capacity
      for (let i = 3; i <= MAX_CACHE_SIZE; i++) {
        mockTime += 10;
        setCachedData(`key-${i}`, `value-${i}`);
      }

      // Add one more - should evict key-2 (oldest unaccessed)
      mockTime += 10;
      setCachedData('new-key', 'new-value');

      expect(getCachedData('key-1')).toBe('value-1');
      expect(getCachedData('key-2')).toBeNull();
    });

    it('should not evict when updating existing key', () => {
      // Fill cache
      for (let i = 0; i < MAX_CACHE_SIZE; i++) {
        setCachedData(`key-${i}`, `value-${i}`);
      }

      // Update existing key (should not trigger eviction)
      const initialSize = getCacheStats().size;
      setCachedData('key-0', 'updated-value');

      expect(getCacheStats().size).toBe(initialSize);
      expect(getCachedData('key-0')).toBe('updated-value');
    });
  });

  describe('clearCache', () => {
    it('should remove all cache entries', () => {
      setCachedData('key-1', 'value-1');
      setCachedData('key-2', 'value-2');
      setCachedData('key-3', 'value-3');

      clearCache();

      expect(getCachedData('key-1')).toBeNull();
      expect(getCachedData('key-2')).toBeNull();
      expect(getCachedData('key-3')).toBeNull();
      expect(getCacheStats().size).toBe(0);
    });

    it('should work on empty cache', () => {
      expect(() => clearCache()).not.toThrow();
      expect(getCacheStats().size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return correct stats for empty cache', () => {
      const stats = getCacheStats();
      expect(stats).toEqual({
        size: 0,
        validEntries: 0,
        expiredEntries: 0,
      });
    });

    it('should count valid entries', () => {
      setCachedData('key-1', 'value-1', 5000);
      setCachedData('key-2', 'value-2', 5000);
      setCachedData('key-3', 'value-3', 5000);

      const stats = getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.validEntries).toBe(3);
      expect(stats.expiredEntries).toBe(0);
    });

    it('should count expired entries', () => {
      setCachedData('key-1', 'value-1', 1000);
      setCachedData('key-2', 'value-2', 1000);

      // Advance time to expire entries
      mockTime += 1001;

      setCachedData('key-3', 'value-3', 5000); // Still valid

      const stats = getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.validEntries).toBe(1);
      expect(stats.expiredEntries).toBe(2);
    });

    it('should update stats as entries expire', () => {
      setCachedData('key-1', 'value-1', 1000);

      const stats1 = getCacheStats();
      expect(stats1.validEntries).toBe(1);
      expect(stats1.expiredEntries).toBe(0);

      mockTime += 1001;

      const stats2 = getCacheStats();
      expect(stats2.validEntries).toBe(0);
      expect(stats2.expiredEntries).toBe(1);
    });
  });

  describe('cleanupExpired', () => {
    it('should remove expired entries', () => {
      setCachedData('key-1', 'value-1', 1000);
      setCachedData('key-2', 'value-2', 1000);
      setCachedData('key-3', 'value-3', 5000);

      // Expire first two entries
      mockTime += 1001;

      cleanupExpired();

      const stats = getCacheStats();
      expect(stats.size).toBe(1);
      expect(getCachedData('key-1')).toBeNull();
      expect(getCachedData('key-2')).toBeNull();
      expect(getCachedData('key-3')).toBe('value-3');
    });

    it('should not remove valid entries', () => {
      setCachedData('key-1', 'value-1', 5000);
      setCachedData('key-2', 'value-2', 5000);

      mockTime += 1000; // Not expired yet

      cleanupExpired();

      const stats = getCacheStats();
      expect(stats.size).toBe(2);
      expect(getCachedData('key-1')).toBe('value-1');
      expect(getCachedData('key-2')).toBe('value-2');
    });

    it('should work on empty cache', () => {
      expect(() => cleanupExpired()).not.toThrow();
      expect(getCacheStats().size).toBe(0);
    });

    it('should handle mixed expired and valid entries', () => {
      setCachedData('expired-1', 'value-1', 1000);
      setCachedData('valid-1', 'value-2', 10000);
      setCachedData('expired-2', 'value-3', 1000);
      setCachedData('valid-2', 'value-4', 10000);

      mockTime += 1001;

      cleanupExpired();

      expect(getCachedData('expired-1')).toBeNull();
      expect(getCachedData('expired-2')).toBeNull();
      expect(getCachedData('valid-1')).toBe('value-2');
      expect(getCachedData('valid-2')).toBe('value-4');
      expect(getCacheStats().size).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero TTL', () => {
      setCachedData('key', 'value', 0);

      // Should immediately expire
      mockTime += 1;
      expect(getCachedData('key')).toBeNull();
    });

    it('should handle very long TTL', () => {
      const longTTL = Number.MAX_SAFE_INTEGER;
      setCachedData('key', 'value', longTTL);

      mockTime += 1000000;
      expect(getCachedData('key')).toBe('value');
    });

    it('should handle null data', () => {
      setCachedData('key', null);
      expect(getCachedData('key')).toBeNull();
    });

    it('should handle undefined data', () => {
      setCachedData('key', undefined);
      expect(getCachedData('key')).toBeUndefined();
    });

    it('should handle special characters in keys', () => {
      const specialKeys = [
        'key:with:colons',
        'key-with-dashes',
        'key_with_underscores',
        'key.with.dots',
        'key/with/slashes',
        'key with spaces',
      ];

      specialKeys.forEach((key) => {
        setCachedData(key, 'value');
        expect(getCachedData(key)).toBe('value');
      });
    });

    it('should handle very long keys', () => {
      const longKey = 'x'.repeat(10000);
      setCachedData(longKey, 'value');
      expect(getCachedData(longKey)).toBe('value');
    });

    it('should handle large objects', () => {
      const largeData = {
        items: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: Array.from({ length: 100 }, () => Math.random()),
        })),
      };

      setCachedData('large', largeData);
      const retrieved = getCachedData('large');

      expect(retrieved).toEqual(largeData);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple sets to same key', () => {
      setCachedData('key', 'value1');
      setCachedData('key', 'value2');
      setCachedData('key', 'value3');

      expect(getCachedData('key')).toBe('value3');
      expect(getCacheStats().size).toBe(1);
    });

    it('should handle interleaved sets and gets', () => {
      setCachedData('key1', 'value1');
      expect(getCachedData('key1')).toBe('value1');

      setCachedData('key2', 'value2');
      expect(getCachedData('key1')).toBe('value1');
      expect(getCachedData('key2')).toBe('value2');

      mockTime += 100;
      setCachedData('key3', 'value3');

      expect(getCachedData('key1')).toBe('value1');
      expect(getCachedData('key2')).toBe('value2');
      expect(getCachedData('key3')).toBe('value3');
    });
  });
});
