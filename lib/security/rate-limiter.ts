// Rate limiting utility to prevent abuse
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  check(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || []

    // Filter out requests outside the time window
    const recentRequests = existingRequests.filter((time) => time > windowStart)

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false
    }

    // Add current request
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(windowStart)
    }

    return true
  }

  private cleanup(windowStart: number) {
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((time) => time > windowStart)
      if (recentRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recentRequests)
      }
    }
  }
}

// Global rate limiter instances
export const apiRateLimiter = new RateLimiter()
export const authRateLimiter = new RateLimiter()
