// Global rate-limited fetch utility to prevent Supabase rate limiting
// Uses a semaphore to limit concurrent requests

const MAX_CONCURRENT_REQUESTS = 2 // Maximum concurrent requests - keep low to avoid Supabase rate limits
const MIN_REQUEST_INTERVAL = 200 // 200ms minimum between requests
let activeRequests = 0
let lastRequestTime = 0

async function waitForSlot(): Promise<void> {
  // Wait for a slot to become available
  while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  
  // Ensure minimum interval between requests
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  
  activeRequests++
  lastRequestTime = Date.now()
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1)
}

export async function fetchWithRateLimit(url: string, options?: RequestInit, maxRetries = 3): Promise<Response> {
  await waitForSlot()
  
  let lastError: Error | null = null

  try {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)

        if (response.status === 429) {
          // Rate limited - wait with exponential backoff
          const waitTime = Math.pow(2, attempt + 1) * 1000 // 2s, 4s, 8s
          console.log(`[v0] Rate limited on ${url}, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`)
          await new Promise((r) => setTimeout(r, waitTime))
          continue
        }

        return response
      } catch (error) {
        lastError = error as Error
        const waitTime = Math.pow(2, attempt) * 500
        await new Promise((r) => setTimeout(r, waitTime))
      }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`)
  } finally {
    releaseSlot()
  }
}

// Fetch multiple URLs with controlled concurrency (respects MAX_CONCURRENT_REQUESTS)
export async function fetchAllWithRateLimit(urls: string[], options?: RequestInit): Promise<Response[]> {
  // All requests go through fetchWithRateLimit which handles concurrency
  return Promise.all(urls.map((url) => fetchWithRateLimit(url, options)))
}

// Alias for backwards compatibility - uses rate limiting
export const fetchWithRetry = fetchWithRateLimit
