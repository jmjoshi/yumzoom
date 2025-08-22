require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableAndReenableRLS() {
  console.log('🔧 Temporarily disabling RLS to clear cache...\n');

  const steps = [
    // 1. Disable RLS temporarily
    `ALTER TABLE family_collaboration_sessions DISABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_participants DISABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_options DISABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_votes DISABLE ROW LEVEL SECURITY;`,
    
    // 2. Re-enable RLS
    `ALTER TABLE family_collaboration_sessions ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_options ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE collaboration_votes ENABLE ROW LEVEL SECURITY;`,
    
    // 3. Create simple policies
    `CREATE POLICY "Allow all for authenticated users" ON family_collaboration_sessions FOR ALL USING (auth.uid() IS NOT NULL);`,
    `CREATE POLICY "Allow all for authenticated users" ON collaboration_participants FOR ALL USING (auth.uid() IS NOT NULL);`,
    `CREATE POLICY "Allow all for authenticated users" ON collaboration_options FOR ALL USING (auth.uid() IS NOT NULL);`,
    `CREATE POLICY "Allow all for authenticated users" ON collaboration_votes FOR ALL USING (auth.uid() IS NOT NULL);`,
  ];

  for (let i = 0; i < steps.length; i++) {
    const sql = steps[i];
    console.log(`Executing step ${i + 1}/${steps.length}: ${sql.substring(0, 50)}...`);
    
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

  console.log('\n🎉 RLS reset completed!');
}

disableAndReenableRLS().then(() => {
  console.log('\n✅ All steps completed!');
  process.exit(0);
}).catch(console.error);
