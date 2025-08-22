require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicies() {
  console.log('🔍 Checking current RLS policies...\n');

  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname')
      .in('tablename', ['family_collaboration_sessions', 'collaboration_participants', 'collaboration_options', 'collaboration_votes', 'family_connections']);

    if (error) {
      console.log('Error fetching policies:', error.message);
    } else {
      console.log('Current policies:');
      data.forEach(policy => {
        console.log(`- ${policy.tablename}: ${policy.policyname}`);
      });
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

checkPolicies().then(() => {
  process.exit(0);
}).catch(console.error);
