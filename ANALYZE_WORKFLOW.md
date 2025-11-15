# Analyze Feature Workflow

## Overview
The Analyze feature uses Fireworks AI vision models to analyze muscle development from photos.

## Models Used
1. **Primary Model**: `accounts/fireworks/models/qwen2p5-vl-3b-instruct` (3B parameters - fastest, efficient)
2. **Fallback Model**: `accounts/fireworks/models/qwen2p5-vl-32b-instruct` (32B parameters - more accurate)

**Important**: The 7B version does NOT exist on Fireworks. Available sizes are 3B, 32B, and 72B only.

If the primary model fails, the system automatically retries with the fallback model.

## Workflow Steps

### 1. Image Capture/Selection
- User selects an image from camera or gallery via `AnalyzeScreen.tsx`
- Image is validated for format (JPEG/PNG)

### 2. Image Processing (`ImageProcessor.ts`)
- **Resize**: Images are resized to max 1024x1024 while maintaining aspect ratio
- **Compress**: Quality is adjusted to meet size requirements (<1MB)
- **Convert to Base64**: Image is encoded for API transmission
- **Generate Hash**: For caching purposes

### 3. API Request (`FireworksAIService.ts`)
- Prepare request with:
  - Model selection (primary or fallback)
  - Image as base64 data URL
  - Analysis prompt with structured JSON schema
  - Max tokens, temperature, and other parameters

### 4. AI Analysis
- API processes the image and analyzes:
  - Visible muscle groups
  - Development scores (1-10 scale)
  - Symmetry and proportions
  - Recommendations for improvement

### 5. Response Parsing
- Extract JSON from AI response
- Validate structure and required fields
- Handle truncated responses with auto-fix

### 6. Data Transformation & Storage
- Parse analysis into `MuscleAnalysisResponse` format
- Cache result for performance
- Save to Supabase database with user ID

### 7. Results Display (`ResultsScreen.tsx`)
- Show overall scores and metrics
- Display muscle-by-muscle breakdown
- Present recommendations
- Generate progress graphs

## Error Handling

### Fixed Issues
- ✅ **Deprecated FileSystem API**: Migrated to `expo-file-system/legacy` to avoid deprecation warnings
- ✅ **Model Fallback**: Automatic retry with secondary model if primary fails
- ✅ **TypeScript Errors**: Proper error typing and null checks

### Retry Strategy
- Max 3 retries per request
- Exponential backoff with jitter
- Automatic fallback to secondary model
- User-friendly error messages

## Testing Checklist
- [ ] Take photo with camera
- [ ] Select image from gallery
- [ ] Verify image processing completes
- [ ] Confirm API request succeeds
- [ ] Check analysis results display correctly
- [ ] Verify results save to database
- [ ] Test cache functionality
- [ ] Navigate to History and view past results

## Environment Variables
```bash
# Correct model configuration (7B does NOT exist!)
EXPO_PUBLIC_FIREWORKS_MODEL=accounts/fireworks/models/qwen2p5-vl-3b-instruct
EXPO_PUBLIC_FIREWORKS_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREWORKS_API_URL=https://api.fireworks.ai/inference/v1/chat/completions
```

## Key Files
- `src/screens/AnalyzeScreen.tsx` - UI for image selection and analysis
- `src/services/image/ImageProcessor.ts` - Image processing and optimization
- `src/services/api/FireworksAIService.ts` - API communication
- `src/hooks/useAPIAnalysis.ts` - React hook for state management
- `src/config/constants.ts` - Configuration and prompts
