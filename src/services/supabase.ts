import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('🔧 Supabase client initializing with URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('🔧 Supabase client initializing with key:', supabaseAnonKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('✅ Supabase client created successfully');

// Type definitions for user profile
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  username?: string;
  created_at: string;
  updated_at?: string;
}

// Type definitions for analysis history
export interface AnalysisHistoryRecord {
  id: string;
  user_id: string;
  analysis_data: any;
  overall_score?: number;
  image_url?: string;
  created_at: string;
}

// Helper function to get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Helper function to update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return false;
  }
};

// Analysis History Database Functions
export const saveAnalysisToDatabase = async (
  userId: string,
  analysisData: any,
  overallScore?: number,
  imageUrl?: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('analysis_history')
      .insert({
        user_id: userId,
        analysis_data: analysisData,
        overall_score: overallScore,
        image_url: imageUrl,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving analysis to database:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in saveAnalysisToDatabase:', error);
    return null;
  }
};

export const getAnalysisHistory = async (userId: string): Promise<AnalysisHistoryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }

    return data as AnalysisHistoryRecord[];
  } catch (error) {
    console.error('Error in getAnalysisHistory:', error);
    return [];
  }
};

export const deleteAnalysisFromDatabase = async (
  userId: string,
  analysisId: string
): Promise<boolean> => {
  try {
    // First get the analysis to find the image URL
    const { data: analysis } = await supabase
      .from('analysis_history')
      .select('image_url')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    // Delete the analysis record
    const { error } = await supabase
      .from('analysis_history')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting analysis from database:', error);
      return false;
    }

    // If the analysis had a cloud image, delete it from storage
    if (analysis?.image_url && analysis.image_url.includes('supabase')) {
      try {
        const imagePath = extractImagePathFromUrl(analysis.image_url);
        if (imagePath) {
          await deleteAnalyzeImage(imagePath);
        }
      } catch (storageError) {
        console.warn('Failed to delete image from storage:', storageError);
        // Don't fail the entire operation if image deletion fails
      }
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAnalysisFromDatabase:', error);
    return false;
  }
};

// Image Upload Functions for Analyze Feature

/**
 * Upload an analyze image to Supabase storage
 * @param userId - The user's ID
 * @param imageUri - Local image URI from ImagePicker
 * @returns Promise<string | null> - Cloud URL of uploaded image or null if failed
 */
export const uploadAnalyzeImage = async (
  userId: string,
  imageUri: string
): Promise<string | null> => {
  try {
    console.log('📤 Starting image upload to Supabase storage...');
    console.log('📸 Local image URI:', imageUri);

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${timestamp}_${randomId}.${fileExtension}`;

    console.log('📝 Generated filename:', fileName);

    // Read the file as base64
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      console.error('❌ Image file does not exist:', imageUri);
      return null;
    }

    console.log('📊 File size:', fileInfo.size, 'bytes');

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('🔄 Uploading to Supabase storage...');

    // For React Native, we can upload the base64 string directly
    // Convert base64 to binary data for upload
    const binaryData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('analyze-images')
      .upload(fileName, binaryData, {
        contentType: `image/${fileExtension}`,
        upsert: false,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return null;
    }

    console.log('✅ Upload successful:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('analyze-images')
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;
    console.log('🌐 Public URL:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('💥 Error uploading analyze image:', error);
    return null;
  }
};

/**
 * Delete an analyze image from Supabase storage
 * @param imagePath - Path of the image in storage (e.g., "userId/filename.jpg")
 * @returns Promise<boolean> - Success status
 */
export const deleteAnalyzeImage = async (imagePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('analyze-images')
      .remove([imagePath]);

    if (error) {
      console.error('Error deleting analyze image:', error);
      return false;
    }

    console.log('✅ Successfully deleted analyze image:', imagePath);
    return true;
  } catch (error) {
    console.error('Error in deleteAnalyzeImage:', error);
    return false;
  }
};

/**
 * Extract image path from Supabase storage URL
 * @param url - Full Supabase storage URL
 * @returns string | null - Extracted path or null if invalid
 */
export const extractImagePathFromUrl = (url: string): string | null => {
  try {
    // Example URL: https://project.supabase.co/storage/v1/object/public/analyze-images/userId/filename.jpg
    const parts = url.split('/analyze-images/');
    if (parts.length === 2) {
      return parts[1]; // Returns "userId/filename.jpg"
    }
    return null;
  } catch (error) {
    console.error('Error extracting image path from URL:', error);
    return null;
  }
};

/**
 * Enhanced save analysis function that uploads image first
 * @param userId - The user's ID
 * @param analysisData - Analysis result data
 * @param overallScore - Overall analysis score
 * @param localImageUri - Local image URI to upload
 * @returns Promise<string | null> - Analysis ID or null if failed
 */
export const saveAnalysisWithImageUpload = async (
  userId: string,
  analysisData: any,
  overallScore?: number,
  localImageUri?: string
): Promise<string | null> => {
  try {
    let cloudImageUrl: string | null = null;

    // Upload image to cloud storage if provided
    if (localImageUri) {
      console.log('📤 Uploading image before saving analysis...');
      cloudImageUrl = await uploadAnalyzeImage(userId, localImageUri);
      
      if (!cloudImageUrl) {
        console.error('❌ Failed to upload image, using local URI as fallback');
        // Use local URI as fallback - better than no image at all
        cloudImageUrl = localImageUri;
      } else {
        console.log('✅ Image uploaded successfully:', cloudImageUrl);
      }
    }

    // Save analysis with cloud image URL
    const analysisId = await saveAnalysisToDatabase(
      userId,
      analysisData,
      overallScore,
      cloudImageUrl || undefined
    );

    return analysisId;
  } catch (error) {
    console.error('Error in saveAnalysisWithImageUpload:', error);
    return null;
  }
};
