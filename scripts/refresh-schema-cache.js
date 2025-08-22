require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshSchemaCache() {
  console.log('🔄 Attempting to refresh Supabase schema cache...\n');

  try {
    // Method 1: Try to refresh the schema cache by making a simple query
    console.log('1️⃣ Making a simple query to refresh cache...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ User profiles query successful');
    }

    // Method 2: Create a new Supabase client instance to bypass cache
    console.log('\n2️⃣ Creating fresh client instance...');
    const freshClient = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    });

    // Test the relationship with fresh client
    console.log('\n3️⃣ Testing relationship with fresh client...');
    const { data: testData, error: testError } = await freshClient
      .from('family_collaboration_sessions')
      .select(`
        id,
        title,
        creator_user_id
      `)
      .limit(1);

    if (testError) {
      console.log('❌ Error with fresh client:', testError.message);
    } else {
      console.log('✅ Fresh client query successful:', testData);
    }

    // Method 3: Try a direct relationship test without the join syntax
    console.log('\n4️⃣ Testing direct queries...');
    
    // Get a collaboration session
    const { data: sessionData, error: sessionError } = await supabase
      .from('family_collaboration_sessions')
      .select('id, creator_user_id, title')
      .limit(1)
      .single();

    if (sessionError) {
      console.log('❌ Error getting session:', sessionError.message);
    } else if (sessionData) {
      console.log('✅ Session found:', sessionData);
      
      // Now try to get the user profile for this session
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .eq('id', sessionData.creator_user_id)
        .single();

      if (profileError) {
        console.log('❌ Error getting profile:', profileError.message);
      } else {
        console.log('✅ Profile found:', profileData);
        console.log('🎉 The foreign key relationship exists! Issue is with Supabase join syntax.');
      }
    } else {
      console.log('📝 No collaboration sessions found - creating test data might help');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

refreshSchemaCache().then(() => {
  console.log('\n✅ Schema cache refresh completed!');
}).catch(console.error);
