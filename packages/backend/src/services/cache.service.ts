import { Train } from '@metra/shared';

/**
 * Cache Service
 *
 * Simple in-memory cache for train data with TTL
 * Reduces SQLite queries by caching results
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache store
const cacheStore: Map<string, CacheEntry<any>> = new Map();

// Default TTL: 30 seconds (30000 milliseconds)
const DEFAULT_TTL = 30000;

/**
 * Generate cache key for train queries
 * @param originId - Origin station ID
 * @param destinationId - Destination station ID
 * @param limit - Limit parameter (optional)
 * @param time - Time parameter (optional)
 * @returns Cache key string
 */
export const generateTrainCacheKey = (
  originId: string,
  destinationId: string,
  limit?: number,
  time?: string
): string => {
  return `trains:${originId}:${destinationId}:${limit || 'all'}:${time || 'now'}`;
};

/**
 * Get cached data if available and not expired
 * @param key - Cache key
 * @returns Cached data or null if not available/expired
 */
export const getCachedData = <T>(key: string): T | null => {
  const entry = cacheStore.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check if cache entry is expired
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    // Remove expired entry
    cacheStore.delete(key);
    return null;
  }
  
  return entry.data as T;
};

/**
 * Set data in cache with TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in milliseconds (default: 30 seconds)
 */
export const setCachedData = <T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): void => {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

/**
 * Clear all cache entries
 */
export const clearCache = (): void => {
  cacheStore.clear();
};

/**
 * Get cache statistics
 * @returns Cache size and entry count
 */
export const getCacheStats = (): { size: number; entries: number } => {
  return {
    size: cacheStore.size,
    entries: Array.from(cacheStore.values()).filter(
      entry => Date.now() - entry.timestamp <= entry.ttl
    ).length,
  };
};
