import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Fix broken image URLs in sample data
    const updates = [
      // Update restaurants with working placeholder images
      {
        table: 'restaurants',
        updates: [
          { name: 'The Gourmet Bistro', image_url: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=The+Gourmet+Bistro' },
          { name: 'Sakura Sushi', image_url: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Sakura+Sushi' },
          { name: 'Mama Mia\'s', image_url: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Mama+Mias' },
          { name: 'Spice Garden', image_url: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Spice+Garden' }
        ]
      },
      // Update menu items with working placeholder images
      {
        table: 'menu_items',
        updates: [
          { name: 'Grilled Salmon', image_url: 'https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Grilled+Salmon' },
          { name: 'Caesar Salad', image_url: 'https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Caesar+Salad' },
          { name: 'Chocolate Cake', image_url: 'https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Chocolate+Cake' },
          { name: 'Dragon Roll', image_url: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Dragon+Roll' },
          { name: 'Chicken Teriyaki', image_url: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Chicken+Teriyaki' },
          { name: 'Miso Soup', image_url: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Miso+Soup' },
          { name: 'Margherita Pizza', image_url: 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Margherita+Pizza' },
          { name: 'Fettuccine Alfredo', image_url: 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Fettuccine+Alfredo' },
          { name: 'Tiramisu', image_url: 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Tiramisu' },
          { name: 'Butter Chicken', image_url: 'https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Butter+Chicken' },
          { name: 'Samosas', image_url: 'https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Samosas' },
          { name: 'Mango Lassi', image_url: 'https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Mango+Lassi' }
        ]
      }
    ];

    const results = [];

    for (const { table, updates: tableUpdates } of updates) {
      for (const update of tableUpdates) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .update({ image_url: update.image_url })
          .eq('name', update.name);

        if (error) {
          console.error(`Error updating ${table} ${update.name}:`, error);
          results.push({ table, name: update.name, success: false, error: error.message });
        } else {
          results.push({ table, name: update.name, success: true });
        }
      }
    }

    return NextResponse.json({ 
      message: 'Image URLs updated successfully',
      results: results,
      instructions: 'All broken Unsplash URLs have been replaced with working placeholder images. Refresh the page to see the changes.'
    });
  } catch (error) {
    console.error('Error fixing image URLs:', error);
    return NextResponse.json(
      { error: 'Failed to fix image URLs', details: error },
      { status: 500 }
    );
  }
}
