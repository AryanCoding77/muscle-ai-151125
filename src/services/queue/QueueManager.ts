// Queue Manager - Handles request queuing and prioritization

import { QueuedRequest } from '../../types/api.types';
import { QUEUE_CONFIG } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class QueueManager {
  private static instance: QueueManager;
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;
  private currentRequest: QueuedRequest | null = null;
  private queueStorageKey = 'muscle_ai_request_queue';

  private constructor() {
    this.loadQueue();
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * Add request to queue
   */
  public async addToQueue(
    imageUri: string,
    priority: number = QUEUE_CONFIG.REQUEST_PRIORITY_NORMAL
  ): Promise<string> {
    const request: QueuedRequest = {
      id: this.generateRequestId(),
      imageUri,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(request);
    this.sortQueue();
    await this.saveQueue();

    console.log(`Request ${request.id} added to queue`);
    return request.id;
  }

  /**
   * Process queue
   */
  public async processQueue(
    onProcess: (request: QueuedRequest) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const request = this.queue.shift();
        if (!request) break;

        this.currentRequest = request;
        request.status = 'processing';
        await this.saveQueue();

        try {
          await onProcess(request);
          request.status = 'completed';
        } catch (error) {
          console.error(`Failed to process request ${request.id}:`, error);
          request.status = 'failed';
          request.retryCount++;

          // Re-queue if retryable
          if (request.retryCount < 3) {
            request.status = 'pending';
            request.priority = QUEUE_CONFIG.REQUEST_PRIORITY_HIGH;
            this.queue.push(request);
            this.sortQueue();
          }
        }

        await this.saveQueue();
        this.currentRequest = null;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    pending: number;
    processing: QueuedRequest | null;
    total: number;
  } {
    return {
      pending: this.queue.filter(r => r.status === 'pending').length,
      processing: this.currentRequest,
      total: this.queue.length,
    };
  }

  /**
   * Get request by ID
   */
  public getRequest(requestId: string): QueuedRequest | undefined {
    if (this.currentRequest?.id === requestId) {
      return this.currentRequest;
    }
    return this.queue.find(r => r.id === requestId);
  }

  /**
   * Cancel request
   */
  public async cancelRequest(requestId: string): Promise<boolean> {
    const index = this.queue.findIndex(r => r.id === requestId);
    if (index >= 0) {
      this.queue.splice(index, 1);
      await this.saveQueue();
      console.log(`Request ${requestId} cancelled`);
      return true;
    }
    return false;
  }

  /**
   * Clear queue
   */
  public async clearQueue(): Promise<void> {
    this.queue = [];
    this.currentRequest = null;
    await this.saveQueue();
    console.log('Queue cleared');
  }

  /**
   * Sort queue by priority and timestamp
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.queueStorageKey,
        JSON.stringify(this.queue)
      );
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.queueStorageKey);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        // Reset processing status for incomplete requests
        this.queue = this.queue.map(req => ({
          ...req,
          status: req.status === 'processing' ? 'pending' : req.status,
        }));
        this.sortQueue();
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Get queue position for request
   */
  public getQueuePosition(requestId: string): number {
    const index = this.queue.findIndex(r => r.id === requestId);
    return index >= 0 ? index + 1 : -1;
  }

  /**
   * Update request priority
   */
  public async updatePriority(
    requestId: string,
    priority: number
  ): Promise<boolean> {
    const request = this.queue.find(r => r.id === requestId);
    if (request && request.status === 'pending') {
      request.priority = priority;
      this.sortQueue();
      await this.saveQueue();
      return true;
    }
    return false;
  }

  /**
   * Get estimated wait time
   */
  public getEstimatedWaitTime(requestId: string): number {
    const position = this.getQueuePosition(requestId);
    if (position <= 0) return 0;
    
    // Estimate 30 seconds per request
    return position * 30000;
  }
}
