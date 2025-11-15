// Application Constants and Configuration

export const API_CONFIG = {
  FIREWORKS_MODEL: process.env.EXPO_PUBLIC_FIREWORKS_MODEL || 'accounts/fireworks/models/qwen2p5-vl-3b-instruct',
  FIREWORKS_MODEL_FALLBACK: 'accounts/fireworks/models/qwen2p5-vl-32b-instruct',
  MAX_TOKENS: 2500,
  TEMPERATURE: 0.1,
  TOP_P: 0.9,
  DEFAULT_TIMEOUT: 60000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  EXPONENTIAL_BACKOFF_FACTOR: 2,
};

export const IMAGE_CONFIG = {
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  COMPRESSION_QUALITY: 0.8,
  MAX_FILE_SIZE: 1048576, // 1MB
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png'],
  DEFAULT_FORMAT: 'jpeg' as const,
};

export const CACHE_CONFIG = {
  DEFAULT_DURATION: 0, // 0 = no expiry (lifetime)
  MAX_CACHE_SIZE: 50, // Maximum number of cached analyses
  STORAGE_KEY_PREFIX: 'muscle_ai_cache_',
};

export const QUEUE_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 1,
  REQUEST_PRIORITY_HIGH: 1,
  REQUEST_PRIORITY_NORMAL: 5,
  REQUEST_PRIORITY_LOW: 10,
};

// ExerciseDB (RapidAPI) Configuration
export const EXERCISEDB_CONFIG = {
  BASE_URL: 'https://exercisedb.p.rapidapi.com',
  HOST: 'exercisedb.p.rapidapi.com',
  // Set this in your .env: EXPO_PUBLIC_RAPIDAPI_KEY=<your_key>
  RAPIDAPI_KEY: process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '',
  MAX_EXERCISES_PER_TARGET: 4,
  MAX_TARGETS: 6,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  INVALID_IMAGE: 'Please upload a clear muscle photo in JPEG or PNG format.',
  API_TIMEOUT: 'Analysis is taking longer than expected. Please try again.',
  INSUFFICIENT_CREDITS: 'API quota exceeded. Please try again later.',
  INVALID_RESPONSE: 'Unable to analyze the image. Please try another photo.',
  AUTH_ERROR: 'Authentication failed. Please check your API key.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

export const ANALYSIS_PROMPT = `You are an expert fitness trainer and anatomist. Analyze this muscle development photo and provide a comprehensive assessment in valid JSON format only:
{
  "analysis_metadata": {
    "image_quality": "excellent|good|fair|poor",
    "visible_muscle_groups": ["chest", "shoulders", "arms", "back", "legs", "abs", "glutes"],
    "analysis_confidence": 0-100,
    "photo_angle": "front|back|side|multiple"
  },
  "muscle_analysis": [
    {
      "muscle_name": "Scientific muscle name",
      "common_name": "Common name",
      "muscle_group": "chest|shoulders|arms|back|legs|abs|glutes",
      "development_score": 1-10,
      "development_category": "underdeveloped|developing|moderate|well-developed|exceptional",
      "specific_notes": "Detailed observation",
      "visibility_in_photo": "clearly_visible|partially_visible|not_visible"
    }
  ],
  "overall_assessment": {
    "strongest_muscles": ["muscle1", "muscle2"],
    "weakest_muscles": ["muscle3", "muscle4"],
    "overall_physique_score": 1-10,
    "body_symmetry_score": 1-10,
    "muscle_proportion_balance": "poor|fair|good|excellent"
  },
  "recommendations": [
    {
      "muscle_target": "Target muscle",
      "priority": "low|medium|high",
      "suggested_exercises": ["exercise1", "exercise2"],
      "training_frequency": "frequency recommendation"
    }
  ],
  "limitations": ["any limitations in analysis"]
}

Scoring criteria: 
- 1-3: Underdeveloped (minimal visible muscle definition)
- 4-5: Developing (some muscle definition visible)
- 6-7: Moderate (good muscle development and definition)
- 8-9: Well-developed (excellent muscle development)
- 10: Exceptional (professional bodybuilder level)

Only analyze clearly visible muscles. If image quality is poor or muscles are not clearly visible, indicate in analysis_metadata and limitations.`;

export const COLORS = {
  primary: '#007AFF',
  primaryDark: '#0051D5',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
  dark: '#1C1C1E',
  light: '#F2F2F7',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  
  // Muscle strength color coding
  muscleExceptional: '#34C759',
  muscleWellDeveloped: '#5AC8FA',
  muscleModerate: '#007AFF',
  muscleDeveloping: '#FF9500',
  muscleUnderdeveloped: '#FF3B30',
};

export const MUSCLE_GROUPS = {
  chest: { name: 'Chest', color: '#FF6B6B', icon: '💪' },
  shoulders: { name: 'Shoulders', color: '#4ECDC4', icon: '🦾' },
  arms: { name: 'Arms', color: '#45B7D1', icon: '💪' },
  back: { name: 'Back', color: '#96CEB4', icon: '🔙' },
  legs: { name: 'Legs', color: '#FFEAA7', icon: '🦵' },
  abs: { name: 'Abs', color: '#DDA0DD', icon: '🎯' },
  glutes: { name: 'Glutes', color: '#98D8C8', icon: '🍑' },
};
