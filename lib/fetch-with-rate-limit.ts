// Global rate-limited fetch utility to prevent Supabase rate limiting
// Uses a semaphore pattern with exponential backoff

const MAX_CONCURRENT = 3
const MIN_INTERVAL_MS = 150
let active = 0
let lastTime = 0
const queue: Array<() => void> = []

function tryNext() {
  if (queue.length > 0 && active < MAX_CONCURRENT) {
    const next = queue.shift()
    next?.()
  }
}

function waitForSlot(): Promise<void> {
  return new Promise((resolve) => {
    const attempt = () => {
      if (active < MAX_CONCURRENT) {
        const now = Date.now()
        const gap = MIN_INTERVAL_MS - (now - lastTime)
        if (gap > 0) {
          setTimeout(() => {
            active++
            lastTime = Date.now()
            resolve()
          }, gap)
        } else {
          active++
          lastTime = Date.now()
          resolve()
        }
      } else {
        queue.push(attempt)
      }
    }
    attempt()
  })
}

function releaseSlot() {
  active = Math.max(0, active - 1)
  tryNext()
}

async function isRateLimited(response: Response): Promise<boolean> {
  if (response.status === 429) return true
  // Supabase sometimes returns 200 with "Too Many Requests" as plain text body
  const ct = response.headers.get("content-type") || ""
  if (!ct.includes("application/json") && response.status < 400) {
    // Clone to peek at the body without consuming it
    const clone = response.clone()
    try {
      const text = await clone.text()
      if (text.includes("Too Many R")) return true
    } catch {
      // ignore
    }
  }
  return false
}

export async function fetchWithRateLimit(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  await waitForSlot()

  try {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)

        if (await isRateLimited(response)) {
          const wait = Math.pow(2, attempt + 1) * 1000
          console.log(
            `[v0] Rate limited on ${url}, waiting ${wait}ms before retry ${attempt + 1}/${maxRetries}`,
          )
          await new Promise((r) => setTimeout(r, wait))
          continue
        }

        return response
      } catch (error) {
        if (attempt === maxRetries - 1) throw error
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500))
      }
    }

    throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`)
  } finally {
    releaseSlot()
  }
}

// Fetch multiple URLs sequentially with rate limiting
export async function fetchAllWithRateLimit(
  urls: string[],
  options?: RequestInit,
): Promise<Response[]> {
  const results: Response[] = []
  for (const url of urls) {
    results.push(await fetchWithRateLimit(url, options))
  }
  return results
}

export const fetchWithRetry = fetchWithRateLimit
