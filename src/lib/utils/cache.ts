class Cache {
  private store = new Map<string, { value: unknown; expiry: number }>();
  
  set<T>(key: string, value: T, ttl: number = 300000) { // 5 minutes default
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }
  
  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value as T;
  }
}

export const cache = new Cache();