// Image Processing Service - Handles image optimization and preparation

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { IMAGE_CONFIG } from '../../config/constants';
import { ImageProcessingOptions } from '../../types/api.types';

export interface ProcessedImage {
  uri: string;
  base64: string;
  width: number;
  height: number;
  size: number;
  format: string;
  hash: string;
}

export class ImageProcessor {
  private static readonly DEFAULT_OPTIONS: ImageProcessingOptions = {
    maxWidth: IMAGE_CONFIG.MAX_WIDTH,
    maxHeight: IMAGE_CONFIG.MAX_HEIGHT,
    quality: IMAGE_CONFIG.COMPRESSION_QUALITY,
    format: IMAGE_CONFIG.DEFAULT_FORMAT,
    maxFileSize: IMAGE_CONFIG.MAX_FILE_SIZE,
  };

  /**
   * Process image for API submission
   */
  public static async processImage(
    imageUri: string,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImage> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Validate image format
      await this.validateImageFormat(imageUri);

      // Get original image info
      const originalInfo = await this.getImageInfo(imageUri);
      console.log('Original image:', originalInfo);

      // Calculate optimal dimensions
      const dimensions = this.calculateOptimalDimensions(
        originalInfo.width,
        originalInfo.height,
        config.maxWidth,
        config.maxHeight
      );

      // Resize and compress image
      const manipulatedImage = await this.resizeAndCompress(
        imageUri,
        dimensions,
        config.quality,
        config.format
      );

      // Convert to base64
      const base64 = await this.convertToBase64(manipulatedImage.uri);

      // Check file size
      const fileSize = this.getBase64Size(base64);
      if (fileSize > config.maxFileSize) {
        // Further compress if needed
        return await this.furtherCompress(
          imageUri,
          dimensions,
          config
        );
      }

      // Generate hash for caching
      const hash = await this.generateImageHash(base64);

      return {
        uri: manipulatedImage.uri,
        base64,
        width: dimensions.width,
        height: dimensions.height,
        size: fileSize,
        format: config.format,
        hash,
      };

    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error(`Failed to process image: ${(error as Error).message}`);
    }
  }

  /**
   * Validate image format
   */
  private static async validateImageFormat(imageUri: string): Promise<void> {
    const extension = imageUri.split('.').pop()?.toLowerCase();
    
    if (!extension || !IMAGE_CONFIG.SUPPORTED_FORMATS.includes(extension)) {
      throw new Error(
        `Unsupported image format. Please use: ${IMAGE_CONFIG.SUPPORTED_FORMATS.join(', ')}`
      );
    }

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }
  }

  /**
   * Get image information
   */
  private static async getImageInfo(imageUri: string): Promise<{
    width: number;
    height: number;
    size: number;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri) as any;
      
      // Get image dimensions using ImageManipulator
      const imageAsset = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      return {
        width: imageAsset.width,
        height: imageAsset.height,
        size: (fileInfo.exists && fileInfo.size) ? fileInfo.size : 0,
      };
    } catch (error) {
      throw new Error('Failed to get image information');
    }
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private static calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if needed
    if (width > maxWidth || height > maxHeight) {
      if (width / maxWidth > height / maxHeight) {
        width = maxWidth;
        height = Math.round(maxWidth / aspectRatio);
      } else {
        height = maxHeight;
        width = Math.round(maxHeight * aspectRatio);
      }
    }

    return { width, height };
  }

  /**
   * Resize and compress image
   */
  private static async resizeAndCompress(
    imageUri: string,
    dimensions: { width: number; height: number },
    quality: number,
    format: 'jpeg' | 'png'
  ): Promise<ImageManipulator.ImageResult> {
    const actions: ImageManipulator.Action[] = [
      {
        resize: dimensions,
      },
    ];

    const saveFormat = format === 'png' 
      ? ImageManipulator.SaveFormat.PNG 
      : ImageManipulator.SaveFormat.JPEG;

    return await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      {
        compress: quality,
        format: saveFormat,
      }
    );
  }

  /**
   * Convert image to base64
   */
  private static async convertToBase64(imageUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Calculate base64 string size in bytes
   */
  private static getBase64Size(base64: string): number {
    // Base64 encoding increases size by ~33%
    const padding = (base64.match(/=/g) || []).length;
    return Math.floor((base64.length * 3) / 4) - padding;
  }

  /**
   * Further compress image if it exceeds max size
   */
  private static async furtherCompress(
    imageUri: string,
    dimensions: { width: number; height: number },
    config: ImageProcessingOptions
  ): Promise<ProcessedImage> {
    let quality = config.quality;
    let currentDimensions = { ...dimensions };
    let processedImage: ProcessedImage | null = null;

    // Try progressive compression
    while (quality > 0.3) {
      quality -= 0.1;
      
      const manipulated = await this.resizeAndCompress(
        imageUri,
        currentDimensions,
        quality,
        config.format
      );

      const base64 = await this.convertToBase64(manipulated.uri);
      const size = this.getBase64Size(base64);

      if (size <= config.maxFileSize) {
        const hash = await this.generateImageHash(base64);
        processedImage = {
          uri: manipulated.uri,
          base64,
          width: currentDimensions.width,
          height: currentDimensions.height,
          size,
          format: config.format,
          hash,
        };
        break;
      }

      // If still too large, reduce dimensions
      if (quality <= 0.4) {
        currentDimensions.width = Math.floor(currentDimensions.width * 0.8);
        currentDimensions.height = Math.floor(currentDimensions.height * 0.8);
        quality = config.quality; // Reset quality for new dimensions
      }
    }

    if (!processedImage) {
      throw new Error('Unable to compress image to acceptable size');
    }

    return processedImage;
  }

  /**
   * Generate hash for image caching
   */
  private static async generateImageHash(base64: string): Promise<string> {
    // Simple hash function for caching purposes
    let hash = 0;
    const sample = base64.substring(0, 1000); // Use first 1000 chars for performance
    
    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Extract EXIF data and handle orientation
   */
  public static async handleImageOrientation(imageUri: string): Promise<string> {
    try {
      // Auto-rotate based on EXIF orientation
      const rotated = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return rotated.uri;
    } catch (error) {
      console.warn('Failed to handle image orientation:', error);
      return imageUri; // Return original if rotation fails
    }
  }

  /**
   * Validate image content for muscle analysis
   */
  public static async validateMusclePhoto(base64: string): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    // Basic validation - can be enhanced with ML model
    const size = this.getBase64Size(base64);
    
    if (size < 10000) { // Less than 10KB
      return {
        isValid: false,
        reason: 'Image is too small. Please upload a higher quality photo.',
      };
    }

    // Additional validations can be added here
    // - Check for human presence using ML
    // - Check for appropriate lighting
    // - Check for muscle visibility

    return { isValid: true };
  }

  /**
   * Create thumbnail for preview
   */
  public static async createThumbnail(
    imageUri: string,
    size: number = 150
  ): Promise<string> {
    try {
      const thumbnail = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: size, height: size } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return thumbnail.uri;
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
      return imageUri;
    }
  }
}
