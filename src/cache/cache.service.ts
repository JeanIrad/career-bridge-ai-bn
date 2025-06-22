import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private cache = new Map<string, { data: string; expiry: number }>();

  constructor(private configService: ConfigService) {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set(key: string, data: string, ttlSeconds: number): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiry });
  }

  async del(pattern: string): Promise<void> {
    if (pattern.includes('*')) {
      const basePattern = pattern.replace('*', '');
      for (const key of this.cache.keys()) {
        if (key.startsWith(basePattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.delete(pattern);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
