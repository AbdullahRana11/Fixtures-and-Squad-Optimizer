export class CacheManager {
  private cache = new Map<string, { data: any; expires: number }>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.TTL) {
    this.cache.set(key, { data, expires: Date.now() + ttl });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
