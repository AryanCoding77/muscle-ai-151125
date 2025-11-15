// API Types and Interfaces

export interface AIServiceConfig {
  apiKey: string;
  apiUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png';
  maxFileSize: number;
}

export interface APIRequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<TextContent | ImageContent>;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export interface AIChatRequest {
  model: string;
  messages: APIRequestMessage[];
  max_tokens: number;
  temperature: number;
  top_p: number;
  stream?: boolean;
}

export interface AnalysisMetadata {
  image_quality: 'excellent' | 'good' | 'fair' | 'poor';
  visible_muscle_groups: string[];
  analysis_confidence: number;
  photo_angle: 'front' | 'back' | 'side' | 'multiple';
}

export interface MuscleAnalysis {
  muscle_name: string;
  common_name: string;
  muscle_group: string;
  development_score: number;
  development_category: 'underdeveloped' | 'developing' | 'moderate' | 'well-developed' | 'exceptional';
  specific_notes: string;
  visibility_in_photo: 'clearly_visible' | 'partially_visible' | 'not_visible';
}

export interface OverallAssessment {
  strongest_muscles: string[];
  weakest_muscles: string[];
  overall_physique_score: number;
  body_symmetry_score: number;
  muscle_proportion_balance: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface Recommendation {
  muscle_target: string;
  priority: 'low' | 'medium' | 'high';
  suggested_exercises: string[];
  training_frequency: string;
}

export interface MuscleAnalysisResponse {
  analysis_metadata: AnalysisMetadata;
  muscle_analysis: MuscleAnalysis[];
  overall_assessment: OverallAssessment;
  recommendations: Recommendation[];
  limitations: string[];
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: number;
  cached?: boolean;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  userMessage: string;
}

export enum APIErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_IMAGE = 'INVALID_IMAGE',
  API_TIMEOUT = 'API_TIMEOUT',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  AUTH_ERROR = 'AUTH_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface APIState {
  isLoading: boolean;
  progress: number;
  statusMessage: string;
  error: APIError | null;
  retryCount: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  imageHash: string;
}

export interface QueuedRequest {
  id: string;
  imageUri: string;
  priority: number;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
