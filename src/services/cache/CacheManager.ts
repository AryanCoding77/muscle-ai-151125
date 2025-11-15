// Cache Manager - Handles caching of API responses

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MuscleAnalysisResponse, CacheEntry } from '../../types/api.types';
import { CACHE_CONFIG } from '../../config/constants';

export class CacheManager {
  private static instance: CacheManager;
  private cacheKeyPrefix = CACHE_CONFIG.STORAGE_KEY_PREFIX;
  private maxCacheSize = CACHE_CONFIG.MAX_CACHE_SIZE;
  private cacheDuration = CACHE_CONFIG.DEFAULT_DURATION;

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached analysis for an image
   */
  public async getCachedAnalysis(
    imageUri: string
  ): Promise<MuscleAnalysisResponse | null> {
    try {
      const cacheKey = await this.generateCacheKey(imageUri);
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (!cachedData) {
        return null;
      }

      const cacheEntry: CacheEntry<MuscleAnalysisResponse> = JSON.parse(cachedData);

      // Check if cache is expired (0 or undefined means no expiry / lifetime)
      if (cacheEntry.expiresAt && cacheEntry.expiresAt > 0 && Date.now() > cacheEntry.expiresAt) {
        await this.removeCacheEntry(cacheKey);
        return null;
      }

      console.log('Cache hit for image:', imageUri);
      return cacheEntry.data;

    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
      return null;
    }
  }

  /**
   * Cache analysis result
   */
  public async cacheAnalysis(
    imageUri: string,
    analysis: MuscleAnalysisResponse
  ): Promise<void> {
    try {
      const cacheKey = await this.generateCacheKey(imageUri);
      const imageHash = await this.generateImageHash(imageUri);

      const cacheEntry: CacheEntry<MuscleAnalysisResponse> = {
        data: analysis,
        timestamp: Date.now(),
        // If cacheDuration <= 0, store as lifetime (expiresAt = 0)
        expiresAt: this.cacheDuration > 0 ? Date.now() + this.cacheDuration : 0,
        imageHash,
      };

      // Check cache size and clean if needed
      await this.maintainCacheSize();

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      console.log('Analysis cached for image:', imageUri);

      // Update cache index
      await this.updateCacheIndex(cacheKey);

    } catch (error) {
      console.error('Failed to cache analysis:', error);
      // Don't throw - caching failure shouldn't break the app
    }
  }

  /**
   * Generate cache key from image URI
   */
  private async generateCacheKey(imageUri: string): Promise<string> {
    const hash = await this.generateImageHash(imageUri);
    return `${this.cacheKeyPrefix}${hash}`;
  }

  /**
   * Generate hash from image URI
   */
  private async generateImageHash(imageUri: string): Promise<string> {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < imageUri.length; i++) {
      const char = imageUri.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Maintain cache size by removing old entries
   */
  private async maintainCacheSize(): Promise<void> {
    try {
      const cacheIndex = await this.getCacheIndex();
      
      if (cacheIndex.length >= this.maxCacheSize) {
        // Sort by timestamp and remove oldest entries
        const sortedIndex = cacheIndex.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = sortedIndex.slice(0, Math.floor(this.maxCacheSize * 0.2)); // Remove 20% oldest

        for (const entry of toRemove) {
          await this.removeCacheEntry(entry.key);
        }

        console.log(`Removed ${toRemove.length} old cache entries`);
      }
    } catch (error) {
      console.error('Failed to maintain cache size:', error);
    }
  }

  /**
   * Get cache index
   */
  private async getCacheIndex(): Promise<Array<{ key: string; timestamp: number }>> {
    try {
      const indexKey = `${this.cacheKeyPrefix}index`;
      const indexData = await AsyncStorage.getItem(indexKey);
      return indexData ? JSON.parse(indexData) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Update cache index
   */
  private async updateCacheIndex(cacheKey: string): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      const existingIndex = index.findIndex(item => item.key === cacheKey);

      if (existingIndex >= 0) {
        index[existingIndex].timestamp = Date.now();
      } else {
        index.push({ key: cacheKey, timestamp: Date.now() });
      }

      const indexKey = `${this.cacheKeyPrefix}index`;
      await AsyncStorage.setItem(indexKey, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to update cache index:', error);
    }
  }

  /**
   * Remove cache entry
   */
  private async removeCacheEntry(cacheKey: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(cacheKey);
      
      // Update index
      const index = await this.getCacheIndex();
      const filteredIndex = index.filter(item => item.key !== cacheKey);
      const indexKey = `${this.cacheKeyPrefix}index`;
      await AsyncStorage.setItem(indexKey, JSON.stringify(filteredIndex));
    } catch (error) {
      console.error('Failed to remove cache entry:', error);
    }
  }

  /**
   * Clear all cache
   */
  public async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cacheKeyPrefix));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    try {
      const index = await this.getCacheIndex();
      let totalSize = 0;

      for (const entry of index) {
        const data = await AsyncStorage.getItem(entry.key);
        if (data) {
          totalSize += data.length;
        }
      }

      const timestamps = index.map(item => item.timestamp);
      
      return {
        totalEntries: index.length,
        totalSize,
        oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
        newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Invalidate cache for specific image
   */
  public async invalidateCache(imageUri: string): Promise<void> {
    try {
      const cacheKey = await this.generateCacheKey(imageUri);
      await this.removeCacheEntry(cacheKey);
      console.log('Cache invalidated for image:', imageUri);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Set custom cache duration
   */
  public setCacheDuration(duration: number): void {
    this.cacheDuration = duration;
  }

  /**
   * Check if analysis is cached
   */
  public async isCached(imageUri: string): Promise<boolean> {
    const cached = await this.getCachedAnalysis(imageUri);
    return cached !== null;
  }
}
