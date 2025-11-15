// Custom Hook for API Analysis - Manages the complete analysis flow

import { useState, useEffect, useCallback } from 'react';
import { 
  MuscleAnalysisResponse, 
  APIResponse, 
  APIState,
  APIError 
} from '../types/api.types';
import { FireworksAIService } from '../services/api/FireworksAIService';
import { APIStateManager } from '../services/api/APIStateManager';
import { CacheManager } from '../services/cache/CacheManager';
import { QueueManager } from '../services/queue/QueueManager';
import { canUserAnalyze, incrementUsageCounter } from '../services/subscriptionService';
import { updateUserStreak } from '../services/streakService';

interface UseAPIAnalysisOptions {
  enableCache?: boolean;
  enableQueue?: boolean;
  onProgress?: (state: APIState) => void;
  onSuccess?: (result: MuscleAnalysisResponse) => void;
  onError?: (error: APIError) => void;
}

export const useAPIAnalysis = (options: UseAPIAnalysisOptions = {}) => {
  const {
    enableCache = true,
    enableQueue = true,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<APIState>({
    isLoading: false,
    progress: 0,
    statusMessage: '',
    error: null,
    retryCount: 0,
  });

  const [result, setResult] = useState<MuscleAnalysisResponse | null>(null);
  const [history, setHistory] = useState<MuscleAnalysisResponse[]>([]);

  const apiService = FireworksAIService.getInstance();
  
  const stateManager = APIStateManager.getInstance();
  const cacheManager = CacheManager.getInstance();
  const queueManager = QueueManager.getInstance();

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState) => {
      setState(newState);
      onProgress?.(newState);
    });

    return unsubscribe;
  }, [onProgress]);

  /**
   * Analyze image
   */
  const analyzeImage = useCallback(async (imageUri: string) => {
    console.log('🎯 === HOOK: Starting Image Analysis ===');
    console.log('📱 Service Mode: LIVE API');
    console.log('📸 Image URI:', imageUri);
    console.log('💾 Cache Enabled:', enableCache);
    console.log('📋 Queue Enabled:', enableQueue);
    
    try {
      // Reset state
      console.log('🔄 Resetting analysis state...');
      stateManager.reset();
      stateManager.setLoading(true, 'Checking subscription...');

      // 🔒 BACKEND VALIDATION: Check if user can analyze
      console.log('🔒 Checking subscription status from backend...');
      const canAnalyze = await canUserAnalyze();
      
      if (!canAnalyze.can_analyze) {
        console.error('❌ User cannot analyze:', canAnalyze.subscription_status);
        const error: APIError = {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Active subscription required to analyze images',
          retryable: false,
          userMessage: canAnalyze.subscription_status === 'none' 
            ? 'You need an active subscription to analyze images. Please purchase a plan.'
            : `You have reached your analysis limit. Remaining: ${canAnalyze.analyses_remaining}`,
        };
        stateManager.setError(error);
        stateManager.setLoading(false);
        onError?.(error);
        return null;
      }

      console.log('✅ Subscription valid. Analyses remaining:', canAnalyze.analyses_remaining);
      stateManager.setLoading(true, 'Starting analysis...');

      // Check cache first if enabled
      if (enableCache) {
        console.log('🔍 Checking cache for existing analysis...');
        const cached = await cacheManager.getCachedAnalysis(imageUri);
        if (cached) {
          console.log('✅ Found cached result, using cached data');
          stateManager.updateProgress(100, 'Loaded from cache');
          setResult(cached);
          onSuccess?.(cached);
          stateManager.setLoading(false);
          return cached;
        }
        console.log('❌ No cached result found');
      }

      // Add to queue if enabled
      if (enableQueue) {
        console.log('📋 Adding request to queue...');
        const requestId = await queueManager.addToQueue(imageUri);
        console.log('✅ Request queued with ID:', requestId);
        stateManager.updateProgress(5, `Request queued (ID: ${requestId})`);
      }

      // Perform analysis
      console.log('🚀 Calling API service for analysis...');
      console.log('🔧 Service type:', apiService.constructor.name);
      
      const response = await apiService.analyzeMuscleImage(
        imageUri,
        (progressState) => {
          console.log('📊 Progress update:', progressState.progress + '%', '-', progressState.statusMessage);
          stateManager.updateState(progressState);
        }
      );

      console.log('📥 Received response from API service');
      console.log('✅ Response success:', response.success);
      
      if (response.success && response.data) {
        console.log('🎉 Analysis successful, updating state...');
        
        // 🔒 BACKEND: Increment usage counter
        console.log('📊 Incrementing usage counter...');
        try {
          const usageResult = await incrementUsageCounter();
          if (usageResult.success) {
            console.log('✅ Usage counter updated successfully');
          } else {
            console.error('⚠️ Failed to increment usage counter:', usageResult.error);
          }
        } catch (usageError) {
          console.error('⚠️ Error incrementing usage counter:', usageError);
          // Don't fail the analysis if usage counter fails
        }

        // 🔥 Update user streak after successful analysis
        console.log('🔥 Updating user streak...');
        try {
          const streakResult = await updateUserStreak();
          console.log('✅ Streak updated:', streakResult);
          
          // Log milestone achievements
          if (streakResult.milestoneAchieved) {
            console.log('🏆 Milestone achieved:', streakResult.milestoneAchieved);
          }
          
          if (streakResult.isNewRecord) {
            console.log('🎉 New personal record! Longest streak:', streakResult.longestStreak);
          }
        } catch (streakError) {
          console.error('⚠️ Error updating streak:', streakError);
          // Don't fail the analysis if streak update fails
        }
        
        setResult(response.data);
        setHistory(prev => [...prev, response.data!]);
        onSuccess?.(response.data);
        stateManager.updateProgress(100, 'Analysis complete');
      } else if (response.error) {
        console.error('❌ API returned error:', response.error);
        stateManager.setError(response.error);
        onError?.(response.error);
      }

      stateManager.setLoading(false);
      console.log('🏁 Analysis process completed');
      return response.data || null;

    } catch (error) {
      console.error('💥 === HOOK: Analysis Exception ===');
      console.error('❌ Error in useAPIAnalysis:', error);
      console.error('🔍 Error type:', typeof error);
      console.error('📝 Error message:', (error as any)?.message || 'Unknown error');
      console.error('=====================================');
      
      const apiError: APIError = {
        code: 'UNKNOWN_ERROR',
        message: (error as any)?.message || 'Analysis failed',
        retryable: false,
        userMessage: 'An unexpected error occurred during analysis',
      };
      
      stateManager.setError(apiError);
      onError?.(apiError);
      return null;
    }
  }, [apiService, enableCache, enableQueue, onSuccess, onError]);

  /**
   * Retry analysis
   */
  const retry = useCallback(async (imageUri: string) => {
    stateManager.incrementRetry();
    return analyzeImage(imageUri);
  }, [analyzeImage]);

  /**
   * Cancel current analysis
   */
  const cancel = useCallback(() => {
    apiService.cancelCurrentRequest();
    stateManager.reset();
  }, [apiService]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(async () => {
    await cacheManager.clearCache();
  }, []);

  /**
   * Get cache stats
   */
  const getCacheStats = useCallback(async () => {
    return await cacheManager.getCacheStats();
  }, []);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * Test API connection
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      stateManager.setLoading(true, 'Testing connection...');
      const isConnected = await apiService.testConnection();
      stateManager.setLoading(false);
      return isConnected;
    } catch (error) {
      stateManager.setLoading(false);
      return false;
    }
  }, [apiService]);


  return {
    // State
    state,
    result,
    history,
    
    // Actions
    analyzeImage,
    retry,
    cancel,
    clearCache,
    clearHistory,
    getCacheStats,
    testConnection,
    
    // Flags
    isLoading: state.isLoading,
    hasError: !!state.error,
    progress: state.progress,
  };
};
