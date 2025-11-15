// Quick storage verification script
// Run this with: node verify-storage.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStorage() {
  try {
    console.log('🔍 Checking storage buckets...');
    
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    // Check if analyze-images bucket exists
    const analyzeBucket = buckets.find(b => b.name === 'analyze-images');
    
    if (analyzeBucket) {
      console.log('✅ analyze-images bucket exists');
      console.log('📋 Bucket details:', {
        name: analyzeBucket.name,
        public: analyzeBucket.public,
        file_size_limit: analyzeBucket.file_size_limit,
        allowed_mime_types: analyzeBucket.allowed_mime_types
      });
    } else {
      console.log('❌ analyze-images bucket NOT found');
      console.log('📝 Please create it manually in Supabase Dashboard:');
      console.log('   1. Go to Storage in Supabase Dashboard');
      console.log('   2. Click "New Bucket"');
      console.log('   3. Name: analyze-images');
      console.log('   4. Public: YES');
      console.log('   5. File size limit: 10485760 (10MB)');
      console.log('   6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp');
    }
    
    // Check if profile-images bucket exists
    const profileBucket = buckets.find(b => b.name === 'profile-images');
    
    if (profileBucket) {
      console.log('✅ profile-images bucket exists');
    } else {
      console.log('❌ profile-images bucket NOT found');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyStorage();
