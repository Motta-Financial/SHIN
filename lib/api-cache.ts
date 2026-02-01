// Simple in-memory cache for API responses to prevent rate limiting
// Cache entries expire after a short TTL to ensure fresh data

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<unknown>>()

// Default TTL of 60 seconds - short enough to get fresh data, long enough to prevent rate limiting
const DEFAULT_TTL = 60 * 1000

// Longer TTL for expensive/frequently accessed data
export const LONG_TTL = 5 * 60 * 1000 // 5 minutes

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }

  return entry.data
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

export function clearCache(keyPrefix?: string): void {
  if (keyPrefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

// Generate a cache key from URL and params
export function getCacheKey(baseKey: string, params?: Record<string, string | undefined>): string {
  if (!params) return baseKey
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&")
  return sortedParams ? `${baseKey}?${sortedParams}` : baseKey
}

export const getCachedData = getCached
export const setCachedData = setCache
