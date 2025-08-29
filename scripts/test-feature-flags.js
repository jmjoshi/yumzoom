#!/usr/bin/env node

/**
 * Feature Flags System Test Script
 * Tests the feature flags functionality
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFeatureFlags() {
  console.log('🧪 Testing Feature Flags System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking database tables...');
    const tables = [
      'feature_flags',
      'feature_flag_overrides',
      'feature_flag_usage',
      'feature_flag_audit_log'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.error(`❌ Table ${table} not accessible:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists`);
        }
      } catch (err) {
        console.error(`❌ Error checking table ${table}:`, err.message);
      }
    }

    // Test 2: Check if functions exist
    console.log('\n🔧 Test 2: Checking database functions...');
    const functions = [
      'is_feature_enabled',
      'get_enabled_features',
      'create_feature_flag',
      'update_feature_flag'
    ];

    for (const func of functions) {
      try {
        // Try to call function (will fail but we can check if it exists)
        const { error } = await supabase.rpc(func);
        if (error && !error.message.includes('invalid input syntax')) {
          console.error(`❌ Function ${func} error:`, error.message);
        } else {
          console.log(`✅ Function ${func} exists`);
        }
      } catch (err) {
        console.error(`❌ Error checking function ${func}:`, err.message);
      }
    }

    // Test 3: Check default features
    console.log('\n🎯 Test 3: Checking default features...');
    const { data: features, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching features:', error.message);
    } else {
      console.log(`✅ Found ${features.length} feature flags:`);
      features.forEach(feature => {
        console.log(`   - ${feature.name}: ${feature.is_enabled ? '✅' : '❌'} (${feature.rollout_percentage}%)`);
      });
    }

    // Test 4: Test feature checking function
    console.log('\n🔍 Test 4: Testing feature checking...');
    if (features && features.length > 0) {
      const testFeature = features[0];
      const { data: isEnabled, error: checkError } = await supabase.rpc('is_feature_enabled', {
        p_feature_name: testFeature.name,
        p_user_id: null
      });

      if (checkError) {
        console.error(`❌ Error checking feature ${testFeature.name}:`, checkError.message);
      } else {
        console.log(`✅ Feature ${testFeature.name} check: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
      }
    }

    // Test 5: Test API endpoints (if server is running)
    console.log('\n🌐 Test 5: Testing API endpoints...');
    try {
      const response = await fetch('http://localhost:3000/api/feature-flags');
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API endpoint accessible, found ${data.featureFlags?.length || 0} features`);
      } else {
        console.log('⚠️  API endpoint not accessible (server may not be running)');
      }
    } catch (err) {
      console.log('⚠️  API endpoint not accessible (server may not be running)');
    }

    console.log('\n✅ Feature Flags System test completed!');
    console.log('\n📝 Summary:');
    console.log('- Database schema: Check above for table/function status');
    console.log('- Default features: Should have 8 pre-configured features');
    console.log('- API endpoints: Test with running development server');
    console.log('- Admin dashboard: Visit /admin/feature-flags when server is running');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if this is being run directly
if (require.main === module) {
  testFeatureFlags();
}

module.exports = { testFeatureFlags };
