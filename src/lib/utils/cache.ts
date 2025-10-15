class Cache {
  private store = new Map<string, { value: any; expiry: number }>();
  
  set(key: string, value: any, ttl: number = 300000) { // 5 minutes default
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }
  
  get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }
}

export const cache = new Cache();