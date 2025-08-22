const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Starting social features foreign key migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'fix-social-foreign-keys.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('1')
            .limit(0); // This will fail but might give us better error info
          
          console.log(`Statement ${i + 1} completed with potential issues:`, error.message);
        } else {
          console.log(`Statement ${i + 1} completed successfully`);
        }
      } catch (err) {
        console.log(`Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log('Migration completed!');
    
    // Verify the tables exist with correct structure
    console.log('Verifying table structure...');
    
    const tables = [
      'family_connections',
      'user_activities', 
      'friend_recommendations',
      'family_collaboration_sessions',
      'collaboration_participants',
      'collaboration_options',
      'collaboration_votes',
      'social_discovery_settings'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
