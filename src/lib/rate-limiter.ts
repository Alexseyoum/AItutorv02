// File: src/lib/rate-limiter.ts
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { max: number; window: number }> = new Map();

  constructor() {
    // Set default limits
    this.setLimit("question-generation", 10, 60000); // 10 requests per minute
    this.setLimit("ai-api", 30, 60000); // 30 requests per minute
  }

  setLimit(key: string, max: number, window: number) {
    this.limits.set(key, { max, window });
  }

  async checkLimit(key: string): Promise<boolean> {
    const limit = this.limits.get(key);
    if (!limit) return true;

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < limit.window);
    
    // Update the requests array
    this.requests.set(key, validRequests);
    
    // Check if we're under the limit
    return validRequests.length < limit.max;
  }

  async addRequest(key: string) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
  }

  async waitForLimit(key: string): Promise<void> {
    while (!(await this.checkLimit(key))) {
      const limit = this.limits.get(key);
      if (limit) {
        // Wait for a portion of the window to pass
        await new Promise(resolve => setTimeout(resolve, limit.window / 10));
      } else {
        // Wait 1 second if no limit is set
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    await this.addRequest(key);
  }
}

export const rateLimiter = new RateLimiter();