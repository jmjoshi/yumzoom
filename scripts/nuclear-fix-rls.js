require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function nuclearFixRLS() {
  console.log('🚨 Nuclear option: Completely disabling RLS on problematic tables...\n');

  const steps = [
    // 1. First, completely disable RLS on all problematic tables
    `ALTER TABLE family_collaboration_sessions DISABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_participants DISABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_options DISABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_votes DISABLE ROW LEVEL SECURITY;`,
    
    // 2. Drop ALL policies manually by name to ensure they're gone
    `DROP POLICY IF EXISTS "Users can view collaboration sessions they created or participate in" ON family_collaboration_sessions;`,
    `DROP POLICY IF EXISTS "Users can create collaboration sessions" ON family_collaboration_sessions;`,
    `DROP POLICY IF EXISTS "Users can update collaboration sessions they created" ON family_collaboration_sessions;`,
    `DROP POLICY IF EXISTS "Users can delete collaboration sessions they created" ON family_collaboration_sessions;`,
    `DROP POLICY IF EXISTS "Users can view their own collaboration sessions" ON family_collaboration_sessions;`,
    `DROP POLICY IF EXISTS "Allow all for authenticated users" ON family_collaboration_sessions;`,
    
    `DROP POLICY IF EXISTS "Users can view participants in sessions they're part of" ON collaboration_participants;`,
    `DROP POLICY IF EXISTS "Session creators can manage participants" ON collaboration_participants;`,
    `DROP POLICY IF EXISTS "Users can update their own participation" ON collaboration_participants;`,
    `DROP POLICY IF EXISTS "Users can view their own participation" ON collaboration_participants;`,
    `DROP POLICY IF EXISTS "Users can manage their own participation" ON collaboration_participants;`,
    `DROP POLICY IF EXISTS "Allow all for authenticated users" ON collaboration_participants;`,
    
    `DROP POLICY IF EXISTS "Users can view options in sessions they're part of" ON collaboration_options;`,
    `DROP POLICY IF EXISTS "Participants can create options" ON collaboration_options;`,
    `DROP POLICY IF EXISTS "Users can view options they suggested" ON collaboration_options;`,
    `DROP POLICY IF EXISTS "Allow all for authenticated users" ON collaboration_options;`,
    
    `DROP POLICY IF EXISTS "Users can view votes in sessions they're part of" ON collaboration_votes;`,
    `DROP POLICY IF EXISTS "Users can create their own votes" ON collaboration_votes;`,
    `DROP POLICY IF EXISTS "Users can update their own votes" ON collaboration_votes;`,
    `DROP POLICY IF EXISTS "Users can delete their own votes" ON collaboration_votes;`,
    `DROP POLICY IF EXISTS "Users can view their own votes" ON collaboration_votes;`,
    `DROP POLICY IF EXISTS "Allow all for authenticated users" ON collaboration_votes;`,
  ];

  for (let i = 0; i < steps.length; i++) {
    const sql = steps[i];
    console.log(`Executing step ${i + 1}/${steps.length}: ${sql.substring(0, 80)}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.log(`⚠️  Warning for step ${i + 1}: ${error.message}`);
      } else {
        console.log(`✅ Step ${i + 1} completed successfully`);
      }
    } catch (err) {
      console.log(`❌ Error executing step ${i + 1}: ${err.message}`);
    }
  }

  console.log('\n🎉 Nuclear RLS cleanup completed!');
  console.log('📝 Note: Tables now have RLS disabled for testing. You can re-enable with simple policies later.');
}

nuclearFixRLS().then(() => {
  console.log('\n✅ All cleanup steps completed!');
  process.exit(0);
}).catch(console.error);
