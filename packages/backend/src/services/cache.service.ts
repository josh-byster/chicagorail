/**
 * Cache Service
 *
 * In-memory cache for train data with TTL and automatic cleanup
 * Features:
 * - Time-based expiration (TTL)
 * - Periodic cleanup of expired entries
 * - Maximum cache size with LRU eviction
 * - Prevents memory leaks
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  lastAccessed: number;
}

// In-memory cache store
const cacheStore: Map<string, CacheEntry<unknown>> = new Map();

// Configuration (exported for testing)
export const DEFAULT_TTL = 30000; // 30 seconds
export const MAX_CACHE_SIZE = 1000; // Maximum number of entries
export const CLEANUP_INTERVAL = 60000; // Cleanup every 60 seconds

let cleanupTimer: NodeJS.Timeout | null = null;

// Time provider (can be mocked for testing)
let timeProvider = (): number => Date.now();

/**
 * Set custom time provider (for testing)
 * @internal
 */
export const setTimeProvider = (provider: () => number): void => {
  timeProvider = provider;
};

/**
 * Reset time provider to default (for testing)
 * @internal
 */
export const resetTimeProvider = (): void => {
  timeProvider = () => Date.now();
};

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
  time?: string,
  date?: string
): string => {
  return `trains:${originId}:${destinationId}:${limit || 'all'}:${time || 'now'}:${date || 'today'}`;
};

/**
 * Get cached data if available and not expired
 * Updates last accessed timestamp for LRU tracking
 * @param key - Cache key
 * @returns Cached data or null if not available/expired
 */
export const getCachedData = <T>(key: string): T | null => {
  const entry = cacheStore.get(key);

  if (!entry) {
    return null;
  }

  // Check if cache entry is expired
  const now = timeProvider();
  if (now - entry.timestamp > entry.ttl) {
    // Remove expired entry
    cacheStore.delete(key);
    return null;
  }

  // Update last accessed time for LRU
  entry.lastAccessed = now;

  return entry.data as T;
};

/**
 * Set data in cache with TTL
 * Enforces maximum cache size with LRU eviction
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in milliseconds (default: 30 seconds)
 */
export const setCachedData = <T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): void => {
  const now = timeProvider();

  // Check if we need to evict entries (LRU)
  if (cacheStore.size >= MAX_CACHE_SIZE && !cacheStore.has(key)) {
    evictLRU();
  }

  cacheStore.set(key, {
    data,
    timestamp: now,
    ttl,
    lastAccessed: now,
  });

  // Start cleanup timer if not already running
  if (!cleanupTimer) {
    startPeriodicCleanup();
  }
};

/**
 * Evict least recently used entry
 */
const evictLRU = (): void => {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of cacheStore.entries()) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    cacheStore.delete(oldestKey);
  }
};

/**
 * Clean up expired cache entries
 * Exported for testing
 */
export const cleanupExpired = (): void => {
  const now = timeProvider();
  const keysToDelete: string[] = [];

  for (const [key, entry] of cacheStore.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    cacheStore.delete(key);
  }
};

/**
 * Start periodic cleanup timer
 */
const startPeriodicCleanup = (): void => {
  cleanupTimer = setInterval(() => {
    cleanupExpired();

    // Stop cleanup if cache is empty
    if (cacheStore.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL);

  // Don't prevent process from exiting
  cleanupTimer.unref();
};

/**
 * Clear all cache entries and stop cleanup timer
 */
export const clearCache = (): void => {
  cacheStore.clear();

  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
};

/**
 * Get cache statistics
 * @returns Cache size, valid entries, and expired entries
 */
export const getCacheStats = (): {
  size: number;
  validEntries: number;
  expiredEntries: number;
} => {
  const now = timeProvider();
  let validCount = 0;
  let expiredCount = 0;

  for (const entry of cacheStore.values()) {
    if (now - entry.timestamp <= entry.ttl) {
      validCount++;
    } else {
      expiredCount++;
    }
  }

  return {
    size: cacheStore.size,
    validEntries: validCount,
    expiredEntries: expiredCount,
  };
};
