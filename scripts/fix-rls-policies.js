require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies to prevent infinite recursion...\n');

  const fixes = [
    // 1. Drop all existing policies that might cause recursion
    `DROP POLICY IF EXISTS "Users can view collaboration sessions they created or participate in" ON family_collaboration_sessions;`,
    `DROP POLICY IF EXISTS "Users can view participants in sessions they're part of" ON collaboration_participants;`,
    `DROP POLICY IF EXISTS "Session creators can manage participants" ON collaboration_participants;`,
    `DROP POLICY IF EXISTS "Users can view options in sessions they're part of" ON collaboration_options;`,
    `DROP POLICY IF EXISTS "Users can view votes in sessions they're part of" ON collaboration_votes;`,
    
    // 2. Create simple, non-recursive policies
    `CREATE POLICY "Users can view their own collaboration sessions" ON family_collaboration_sessions
     FOR SELECT USING (auth.uid() = creator_user_id);`,
    
    `CREATE POLICY "Users can view their own participation" ON collaboration_participants
     FOR SELECT USING (auth.uid() = user_id);`,
    
    `CREATE POLICY "Users can manage their own participation" ON collaboration_participants
     FOR ALL USING (auth.uid() = user_id);`,
     
    `CREATE POLICY "Users can view options they suggested" ON collaboration_options
     FOR SELECT USING (auth.uid() = suggested_by_user_id);`,
     
    `CREATE POLICY "Users can view their own votes" ON collaboration_votes
     FOR SELECT USING (auth.uid() = voter_user_id);`,
  ];

  for (let i = 0; i < fixes.length; i++) {
    const sql = fixes[i];
    console.log(`Executing fix ${i + 1}/${fixes.length}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.log(`⚠️  Warning for statement ${i + 1}: ${error.message}`);
      } else {
        console.log(`✅ Statement ${i + 1} completed successfully`);
      }
    } catch (err) {
      console.log(`❌ Error executing statement ${i + 1}: ${err.message}`);
    }
  }

  console.log('\n🎉 RLS policy fixes completed!');
}

fixRLSPolicies().then(() => {
  console.log('\n✅ All fixes applied!');
  process.exit(0);
}).catch(console.error);
