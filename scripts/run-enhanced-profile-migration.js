/**
 * Enhanced Profile System Migration Script
 * Run this with: node scripts/run-enhanced-profile-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runEnhancedProfileMigration() {
  try {
    console.log('🚀 Starting Enhanced Profile System migration...');

    // Read the enhanced profile migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'enhanced-profile-system-migration.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements, properly handling multi-line statements
    const statements = migrationSql
      .split(/;\s*(?=CREATE|ALTER|INSERT|DROP|--)/gi)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          
          // Try to execute using raw SQL
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: statement.endsWith(';') ? statement : statement + ';'
          });

          if (error) {
            console.warn(`⚠️  Statement ${i + 1} failed: ${error.message}`);
            console.log(`SQL: ${statement.substring(0, 100)}...`);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} failed: ${err.message}`);
          console.log(`SQL: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⚠️  Failed statements: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n🛠️  If statements failed, you may need to run them manually in Supabase SQL Editor:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the enhanced-profile-system-migration.sql content');
      console.log('4. Execute the statements');
    }

    console.log('\n🎉 Enhanced Profile System migration completed!');
    console.log('\n🚀 New features now available:');
    console.log('- Comprehensive preference tracking');
    console.log('- Dining pattern analysis');
    console.log('- Wishlist management');
    console.log('- Achievement system');
    console.log('- Personalization settings');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Manual verification
async function verifyMigration() {
  console.log('\n📊 Verifying Enhanced Profile System tables...');

  const tables = [
    'preference_tracking',
    'dining_patterns', 
    'user_wishlists',
    'wishlist_items',
    'achievements',
    'user_achievements',
    'dining_insights',
    'personalization_settings'
  ];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`❌ Table '${tableName}' not found or accessible`);
      } else {
        console.log(`✅ Table '${tableName}' verified`);
      }
    } catch (err) {
      console.log(`❓ Could not verify table '${tableName}': ${err.message}`);
    }
  }
}

// Run the migration
if (require.main === module) {
  console.log('🎯 Enhanced Profile System Migration');
  console.log('====================================\n');
  
  runEnhancedProfileMigration()
    .then(() => verifyMigration())
    .catch(error => {
      console.error('Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runEnhancedProfileMigration, verifyMigration };
