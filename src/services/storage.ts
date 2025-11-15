import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult } from '../types';

class StorageService {
  private readonly ANALYSIS_HISTORY_KEY = 'muscle_ai_analysis_history';
  private readonly CACHE_KEY_PREFIX = 'muscle_ai_cache_';

  // Analysis History Management
  async getAnalysisHistory(): Promise<AnalysisResult[]> {
    try {
      const historyJson = await AsyncStorage.getItem(this.ANALYSIS_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error loading analysis history:', error);
      return [];
    }
  }

  async saveAnalysisResult(result: AnalysisResult): Promise<void> {
    try {
      const history = await this.getAnalysisHistory();
      const updatedHistory = [result, ...history].slice(0, 100); // Keep last 100 results
      await AsyncStorage.setItem(this.ANALYSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving analysis result:', error);
      throw error;
    }
  }

  // Replace entire analysis history (utility for screens that edit history)
  async setAnalysisHistory(history: AnalysisResult[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ANALYSIS_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error setting analysis history:', error);
      throw error;
    }
  }

  // Remove a specific analysis by id
  async removeAnalysisById(id: string): Promise<void> {
    try {
      const history = await this.getAnalysisHistory();
      const filtered = history.filter((h) => h.id !== id);
      await this.setAnalysisHistory(filtered);
    } catch (error) {
      console.error('Error removing analysis by id:', error);
      throw error;
    }
  }

  async clearAnalysisHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ANALYSIS_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing analysis history:', error);
      throw error;
    }
  }

  // Generic Storage Methods
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving item ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error loading item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  // Cache Management
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: string | null;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      let totalSize = 0;
      let oldestEntry: string | null = null;
      let oldestTimestamp = Date.now();

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          try {
            const parsed = JSON.parse(value);
            if (parsed.timestamp && parsed.timestamp < oldestTimestamp) {
              oldestTimestamp = parsed.timestamp;
              oldestEntry = new Date(parsed.timestamp).toISOString();
            }
          } catch {
            // Ignore parsing errors for cache stats
          }
        }
      }

      return {
        totalEntries: cacheKeys.length,
        totalSize,
        oldestEntry,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalEntries: 0, totalSize: 0, oldestEntry: null };
    }
  }

  async clearCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
