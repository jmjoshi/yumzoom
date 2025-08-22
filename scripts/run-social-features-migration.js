const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please check your .env.local file for:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting Social Features migration...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', 'social-features-schema.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📖 Executing SQL migration...');
    
    // Split SQL into individual statements and execute each one
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });
        
        if (error) {
          console.error(`❌ Failed at statement ${i + 1}:`, error);
          console.error(`Statement: ${statement}`);
          throw error;
        }
      }
    }
    
    console.log('✅ Social Features migration completed successfully!');
    
    // Verify that tables were created
    console.log('🔍 Verifying tables...');
    
    const tablesToCheck = [
      'family_connections',
      'user_activities', 
      'friend_recommendations',
      'family_collaboration_sessions',
      'collaboration_participants',
      'collaboration_options',
      'collaboration_votes',
      'social_discovery_settings'
    ];
    
    for (const tableName of tablesToCheck) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.error(`❌ Error checking table ${tableName}:`, error.message);
      } else {
        console.log(`✅ Table ${tableName} exists and is accessible`);
      }
    }
    
    console.log('🎉 Social Features are now ready to use!');
    console.log('');
    console.log('You can now:');
    console.log('- Connect with other families');
    console.log('- Share restaurant recommendations');
    console.log('- Create collaboration sessions for group dining decisions');
    console.log('- View activity feeds from connected families');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
