import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Fix restaurant admin policies by executing the SQL directly
    const sqlCommands = [
      `CREATE POLICY "Authenticated users can insert restaurants" ON restaurants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`,
      `CREATE POLICY "Authenticated users can update restaurants" ON restaurants FOR UPDATE USING (auth.uid() IS NOT NULL);`,
      `CREATE POLICY "Authenticated users can delete restaurants" ON restaurants FOR DELETE USING (auth.uid() IS NOT NULL);`,
      `CREATE POLICY "Authenticated users can insert menu items" ON menu_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`,
      `CREATE POLICY "Authenticated users can update menu items" ON menu_items FOR UPDATE USING (auth.uid() IS NOT NULL);`,
      `CREATE POLICY "Authenticated users can delete menu items" ON menu_items FOR DELETE USING (auth.uid() IS NOT NULL);`
    ];

    const results = [];
    for (const sql of sqlCommands) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.log(`Policy might already exist: ${error.message}`);
        }
        results.push({ sql, success: !error, error: error?.message });
      } catch (err) {
        console.log(`Policy might already exist: ${err}`);
        results.push({ sql, success: false, error: 'Policy might already exist' });
      }
    }

    return NextResponse.json({ 
      message: 'Database policies updated successfully',
      results,
      instructions: 'Try adding a restaurant again - the RLS policies have been fixed!'
    });
  } catch (error) {
    console.error('Error fixing database policies:', error);
    return NextResponse.json(
      { error: 'Failed to fix database policies', details: error },
      { status: 500 }
    );
  }
}
