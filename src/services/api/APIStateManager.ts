// API State Manager - Manages API request states and progress

import { APIState, APIError } from '../../types/api.types';

type StateListener = (state: APIState) => void;

export class APIStateManager {
  private static instance: APIStateManager;
  private currentState: APIState = {
    isLoading: false,
    progress: 0,
    statusMessage: '',
    error: null,
    retryCount: 0,
  };
  private listeners: Set<StateListener> = new Set();

  private constructor() {}

  public static getInstance(): APIStateManager {
    if (!APIStateManager.instance) {
      APIStateManager.instance = new APIStateManager();
    }
    return APIStateManager.instance;
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update state
   */
  public updateState(updates: Partial<APIState>): void {
    this.currentState = {
      ...this.currentState,
      ...updates,
    };
    this.notifyListeners();
  }

  /**
   * Set loading state
   */
  public setLoading(isLoading: boolean, message?: string): void {
    this.updateState({
      isLoading,
      statusMessage: message || '',
      progress: isLoading ? 0 : 100,
    });
  }

  /**
   * Update progress
   */
  public updateProgress(progress: number, message?: string): void {
    this.updateState({
      progress: Math.min(100, Math.max(0, progress)),
      statusMessage: message || this.currentState.statusMessage,
    });
  }

  /**
   * Set error state
   */
  public setError(error: APIError | null): void {
    this.updateState({
      isLoading: false,
      error,
      progress: 0,
    });
  }

  /**
   * Reset state
   */
  public reset(): void {
    this.currentState = {
      isLoading: false,
      progress: 0,
      statusMessage: '',
      error: null,
      retryCount: 0,
    };
    this.notifyListeners();
  }

  /**
   * Get current state
   */
  public getState(): APIState {
    return { ...this.currentState };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.currentState);
    });
  }

  /**
   * Increment retry count
   */
  public incrementRetry(): void {
    this.updateState({
      retryCount: this.currentState.retryCount + 1,
    });
  }
}
