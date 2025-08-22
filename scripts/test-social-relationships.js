require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRelationships() {
  console.log('Testing social feature relationships...\n');

  try {
    // Test 1: Check if family_collaboration_sessions can join with user_profiles
    console.log('🔍 Testing family_collaboration_sessions -> user_profiles relationship...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('family_collaboration_sessions')
      .select(`
        id,
        title,
        creator_user_id,
        creator_profile:user_profiles!creator_user_id(first_name, last_name, avatar_url)
      `)
      .limit(1);

    if (sessionsError) {
      console.log('❌ Error with family_collaboration_sessions relationship:', sessionsError.message);
    } else {
      console.log('✅ family_collaboration_sessions -> user_profiles relationship works!');
      console.log('   Sample data:', sessions?.[0] || 'No data found');
    }

    // Test 2: Check if family_connections can join with user_profiles
    console.log('\n🔍 Testing family_connections -> user_profiles relationship...');
    const { data: connections, error: connectionsError } = await supabase
      .from('family_connections')
      .select(`
        id,
        follower_user_id,
        following_user_id,
        follower_profile:user_profiles!follower_user_id(first_name, last_name, avatar_url),
        following_profile:user_profiles!following_user_id(first_name, last_name, avatar_url)
      `)
      .limit(1);

    if (connectionsError) {
      console.log('❌ Error with family_connections relationship:', connectionsError.message);
    } else {
      console.log('✅ family_connections -> user_profiles relationship works!');
      console.log('   Sample data:', connections?.[0] || 'No data found');
    }

    // Test 3: Check table structures
    console.log('\n🔍 Checking table structures...');
    
    // Check foreign key constraints
    const { data: fkConstraints, error: fkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name IN ('family_collaboration_sessions', 'family_connections')
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
      `
    });

    if (fkError) {
      console.log('❌ Error checking foreign keys:', fkError.message);
    } else {
      console.log('✅ Foreign key constraints:');
      fkConstraints?.forEach(fk => {
        console.log(`   ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testRelationships().then(() => {
  console.log('\n✅ Relationship testing completed!');
  process.exit(0);
}).catch(console.error);
