// Export all types from api.types.ts
export * from './api.types';

// Additional app-specific types
export interface AnalysisResult {
  id: string;
  timestamp: string;
  imageUri: string;
  muscleGroup?: string;
  overallScore?: number;
  analysis: any; // The full analysis response
}
