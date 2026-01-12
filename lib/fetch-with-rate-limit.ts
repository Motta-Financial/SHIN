// Global rate-limited fetch utility to prevent Supabase rate limiting
// Uses a queue to serialize requests and adds delays between them

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 200 // 200ms between requests
const requestQueue: Array<() => Promise<void>> = []
let isProcessingQueue = false

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return

  isProcessingQueue = true

  while (requestQueue.length > 0) {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }

    const request = requestQueue.shift()
    if (request) {
      lastRequestTime = Date.now()
      await request()
    }
  }

  isProcessingQueue = false
}

export async function fetchWithRateLimit(url: string, options?: RequestInit, maxRetries = 3): Promise<Response> {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      let lastError: Error | null = null

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(url, options)

          if (response.status === 429) {
            // Rate limited - wait with exponential backoff
            const waitTime = Math.pow(2, attempt + 1) * 500 // 1s, 2s, 4s
            console.log(`[v0] Rate limited on ${url}, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`)
            await new Promise((r) => setTimeout(r, waitTime))
            continue
          }

          resolve(response)
          return
        } catch (error) {
          lastError = error as Error
          const waitTime = Math.pow(2, attempt) * 500
          await new Promise((r) => setTimeout(r, waitTime))
        }
      }

      reject(lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`))
    }

    requestQueue.push(executeRequest)
    processQueue()
  })
}

// Fetch multiple URLs sequentially with rate limiting
export async function fetchAllWithRateLimit(urls: string[], options?: RequestInit): Promise<Response[]> {
  const results: Response[] = []

  for (const url of urls) {
    const response = await fetchWithRateLimit(url, options)
    results.push(response)
  }

  return results
}
