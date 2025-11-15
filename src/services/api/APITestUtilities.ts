// API Test Utilities - Testing helpers and sample responses

import { MuscleAnalysisResponse, APIError, APIErrorCode } from '../../types/api.types';
import { ERROR_MESSAGES } from '../../config/constants';

export class APITestUtilities {
  /**
   * Generate sample successful response
   */
  public static generateSuccessResponse(): MuscleAnalysisResponse {
    return {
      analysis_metadata: {
        image_quality: 'excellent',
        visible_muscle_groups: ['chest', 'shoulders', 'arms', 'back', 'abs'],
        analysis_confidence: 92,
        photo_angle: 'front',
      },
      muscle_analysis: [
        {
          muscle_name: 'Pectoralis Major',
          common_name: 'Chest',
          muscle_group: 'chest',
          development_score: 8.5,
          development_category: 'well-developed',
          specific_notes: 'Excellent chest development with clear separation between upper and lower pecs',
          visibility_in_photo: 'clearly_visible',
        },
        {
          muscle_name: 'Anterior Deltoid',
          common_name: 'Front Shoulders',
          muscle_group: 'shoulders',
          development_score: 7.8,
          development_category: 'well-developed',
          specific_notes: 'Well-rounded front delts with good definition',
          visibility_in_photo: 'clearly_visible',
        },
        {
          muscle_name: 'Biceps Brachii',
          common_name: 'Biceps',
          muscle_group: 'arms',
          development_score: 7.2,
          development_category: 'moderate',
          specific_notes: 'Good bicep peak and overall size',
          visibility_in_photo: 'clearly_visible',
        },
        {
          muscle_name: 'Rectus Abdominis',
          common_name: 'Abs',
          muscle_group: 'abs',
          development_score: 6.5,
          development_category: 'moderate',
          specific_notes: 'Visible six-pack with room for more definition',
          visibility_in_photo: 'clearly_visible',
        },
        {
          muscle_name: 'Latissimus Dorsi',
          common_name: 'Lats',
          muscle_group: 'back',
          development_score: 7.0,
          development_category: 'moderate',
          specific_notes: 'Good lat width visible from front',
          visibility_in_photo: 'partially_visible',
        },
      ],
      overall_assessment: {
        strongest_muscles: ['Chest', 'Front Shoulders'],
        weakest_muscles: ['Abs', 'Lower Back'],
        overall_physique_score: 7.4,
        body_symmetry_score: 8.1,
        muscle_proportion_balance: 'good',
      },
      recommendations: [
        {
          muscle_target: 'Rectus Abdominis',
          priority: 'high',
          suggested_exercises: ['Weighted crunches', 'Cable crunches', 'Planks'],
          training_frequency: '4-5 times per week',
        },
        {
          muscle_target: 'Lower Back',
          priority: 'medium',
          suggested_exercises: ['Deadlifts', 'Back extensions', 'Good mornings'],
          training_frequency: '2 times per week',
        },
      ],
      limitations: ['Lower body not visible', 'Rear delts not visible'],
    };
  }

  /**
   * Generate poor quality image response
   */
  public static generatePoorQualityResponse(): MuscleAnalysisResponse {
    return {
      analysis_metadata: {
        image_quality: 'poor',
        visible_muscle_groups: [],
        analysis_confidence: 25,
        photo_angle: 'multiple',
      },
      muscle_analysis: [],
      overall_assessment: {
        strongest_muscles: [],
        weakest_muscles: [],
        overall_physique_score: 0,
        body_symmetry_score: 0,
        muscle_proportion_balance: 'poor',
      },
      recommendations: [
        {
          muscle_target: 'General',
          priority: 'high',
          suggested_exercises: [],
          training_frequency: 'Unable to provide recommendations',
        },
      ],
      limitations: [
        'Image quality too poor for analysis',
        'Muscles not clearly visible',
        'Please upload a clearer photo with better lighting',
      ],
    };
  }

  /**
   * Generate partial analysis response
   */
  public static generatePartialAnalysisResponse(): MuscleAnalysisResponse {
    return {
      analysis_metadata: {
        image_quality: 'fair',
        visible_muscle_groups: ['chest', 'shoulders'],
        analysis_confidence: 60,
        photo_angle: 'side',
      },
      muscle_analysis: [
        {
          muscle_name: 'Pectoralis Major',
          common_name: 'Chest',
          muscle_group: 'chest',
          development_score: 6.0,
          development_category: 'moderate',
          specific_notes: 'Partially visible from side angle',
          visibility_in_photo: 'partially_visible',
        },
        {
          muscle_name: 'Lateral Deltoid',
          common_name: 'Side Shoulders',
          muscle_group: 'shoulders',
          development_score: 7.0,
          development_category: 'moderate',
          specific_notes: 'Good lateral delt development',
          visibility_in_photo: 'clearly_visible',
        },
      ],
      overall_assessment: {
        strongest_muscles: ['Side Shoulders'],
        weakest_muscles: [],
        overall_physique_score: 6.5,
        body_symmetry_score: 0,
        muscle_proportion_balance: 'fair',
      },
      recommendations: [
        {
          muscle_target: 'Full Body',
          priority: 'medium',
          suggested_exercises: ['Compound movements'],
          training_frequency: 'Based on limited visibility',
        },
      ],
      limitations: [
        'Side angle limits full assessment',
        'Many muscle groups not visible',
        'Cannot assess symmetry from this angle',
      ],
    };
  }

  /**
   * Generate error responses
   */
  public static generateErrorResponse(errorCode: APIErrorCode): APIError {
    const errorMap: Record<APIErrorCode, APIError> = {
      [APIErrorCode.NETWORK_ERROR]: {
        code: APIErrorCode.NETWORK_ERROR,
        message: 'Network request failed',
        retryable: true,
        userMessage: ERROR_MESSAGES.NETWORK_ERROR,
      },
      [APIErrorCode.RATE_LIMIT]: {
        code: APIErrorCode.RATE_LIMIT,
        message: 'Rate limit exceeded',
        details: { retryAfter: 60 },
        retryable: true,
        userMessage: ERROR_MESSAGES.RATE_LIMIT,
      },
      [APIErrorCode.INVALID_IMAGE]: {
        code: APIErrorCode.INVALID_IMAGE,
        message: 'Invalid image format or content',
        retryable: false,
        userMessage: ERROR_MESSAGES.INVALID_IMAGE,
      },
      [APIErrorCode.API_TIMEOUT]: {
        code: APIErrorCode.API_TIMEOUT,
        message: 'Request timed out after 60 seconds',
        retryable: true,
        userMessage: ERROR_MESSAGES.API_TIMEOUT,
      },
      [APIErrorCode.INSUFFICIENT_CREDITS]: {
        code: APIErrorCode.INSUFFICIENT_CREDITS,
        message: 'API credits exhausted',
        details: { creditsRemaining: 0 },
        retryable: false,
        userMessage: ERROR_MESSAGES.INSUFFICIENT_CREDITS,
      },
      [APIErrorCode.INVALID_RESPONSE]: {
        code: APIErrorCode.INVALID_RESPONSE,
        message: 'Failed to parse API response',
        retryable: true,
        userMessage: ERROR_MESSAGES.INVALID_RESPONSE,
      },
      [APIErrorCode.AUTH_ERROR]: {
        code: APIErrorCode.AUTH_ERROR,
        message: 'Invalid API key',
        retryable: false,
        userMessage: ERROR_MESSAGES.AUTH_ERROR,
      },
      [APIErrorCode.SERVER_ERROR]: {
        code: APIErrorCode.SERVER_ERROR,
        message: 'Internal server error',
        retryable: true,
        userMessage: ERROR_MESSAGES.SERVER_ERROR,
      },
      [APIErrorCode.UNKNOWN_ERROR]: {
        code: APIErrorCode.UNKNOWN_ERROR,
        message: 'An unknown error occurred',
        retryable: false,
        userMessage: ERROR_MESSAGES.UNKNOWN_ERROR,
      },
    };

    return errorMap[errorCode];
  }

  /**
   * Validate API response structure
   */
  public static validateResponseStructure(response: any): boolean {
    try {
      // Check required top-level fields
      if (!response.analysis_metadata || 
          !response.muscle_analysis || 
          !response.overall_assessment || 
          !response.recommendations) {
        return false;
      }

      // Check metadata structure
      const metadata = response.analysis_metadata;
      if (!metadata.image_quality || 
          !Array.isArray(metadata.visible_muscle_groups) ||
          typeof metadata.analysis_confidence !== 'number' ||
          !metadata.photo_angle) {
        return false;
      }

      // Check muscle analysis array
      if (!Array.isArray(response.muscle_analysis)) {
        return false;
      }

      // Validate each muscle entry
      for (const muscle of response.muscle_analysis) {
        if (!muscle.muscle_name || 
            !muscle.common_name ||
            !muscle.muscle_group ||
            typeof muscle.development_score !== 'number' ||
            !muscle.development_category ||
            !muscle.visibility_in_photo) {
          return false;
        }

        // Validate score range
        if (muscle.development_score < 1 || muscle.development_score > 10) {
          return false;
        }
      }

      // Check overall assessment
      const assessment = response.overall_assessment;
      if (!Array.isArray(assessment.strongest_muscles) ||
          !Array.isArray(assessment.weakest_muscles) ||
          typeof assessment.overall_physique_score !== 'number' ||
          typeof assessment.body_symmetry_score !== 'number' ||
          !assessment.muscle_proportion_balance) {
        return false;
      }

      // Check recommendations
      if (!Array.isArray(response.recommendations)) {
        return false;
      }

      for (const rec of response.recommendations) {
        if (!rec.muscle_target || 
            !rec.priority ||
            !Array.isArray(rec.suggested_exercises) ||
            !rec.training_frequency) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Response validation error:', error);
      return false;
    }
  }

  /**
   * Generate test image URIs
   */
  public static getTestImageURIs(): {
    highQuality: string;
    mediumQuality: string;
    poorQuality: string;
    invalidFormat: string;
  } {
    return {
      highQuality: 'https://example.com/test-images/high-quality-muscle.jpg',
      mediumQuality: 'https://example.com/test-images/medium-quality-muscle.jpg',
      poorQuality: 'https://example.com/test-images/poor-quality.jpg',
      invalidFormat: 'https://example.com/test-images/invalid.txt',
    };
  }

  /**
   * Simulate API delay
   */
  public static async simulateDelay(ms: number = 2000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate progress updates for testing
   */
  public static async* generateProgressUpdates() {
    const updates = [
      { progress: 10, message: 'Validating image...' },
      { progress: 25, message: 'Processing image...' },
      { progress: 40, message: 'Sending to AI...' },
      { progress: 60, message: 'Analyzing muscles...' },
      { progress: 80, message: 'Generating recommendations...' },
      { progress: 95, message: 'Finalizing results...' },
      { progress: 100, message: 'Analysis complete!' },
    ];

    for (const update of updates) {
      yield update;
      await this.simulateDelay(500);
    }
  }

  /**
   * Test retry logic
   */
  public static async testRetryLogic(
    failCount: number = 2
  ): Promise<{ attempts: number; success: boolean }> {
    let attempts = 0;
    const maxAttempts = failCount + 1;

    while (attempts < maxAttempts) {
      attempts++;
      
      if (attempts <= failCount) {
        await this.simulateDelay(1000);
        throw new Error(`Simulated failure ${attempts}/${failCount}`);
      }
      
      return { attempts, success: true };
    }

    return { attempts, success: false };
  }
}
