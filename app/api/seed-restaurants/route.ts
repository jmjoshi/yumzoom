import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Sample restaurant data with working image URLs
    const sampleRestaurants = [
      {
        name: '58 Degrees & Holding',
        description: 'New American, Cocktail Bars, Breakfast & Brunch Full Bar, Restaurant and Lounge',
        address: '1217 18th St Sacramento, CA 95811',
        phone: '(916) 442-5858',
        website: 'https://example.com',
        cuisine_type: 'American',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center'
      },
      {
        name: 'Sakura Sushi',
        description: 'Authentic Japanese cuisine and fresh sushi',
        address: '456 Oak Ave, Anytown, ST 12345',
        phone: '(555) 234-5678',
        website: 'https://example.com',
        cuisine_type: 'Japanese',
        image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&crop=center'
      },
      {
        name: 'The Gourmet Bistro',
        description: 'Fine dining with a modern twist on classic dishes',
        address: '123 Main St, Anytown, ST 12345',
        phone: '(555) 123-4567',
        website: 'https://example.com',
        cuisine_type: 'American',
        image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&crop=center'
      },
      {
        name: 'Mama Mia\'s',
        description: 'Authentic Italian cuisine with family recipes',
        address: '789 Pine St, Anytown, ST 12345',
        phone: '(555) 345-6789',
        website: 'https://example.com',
        cuisine_type: 'Italian',
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center'
      },
      {
        name: 'Spice Garden',
        description: 'Flavorful Indian dishes with traditional spices',
        address: '321 Elm Ave, Anytown, ST 12345',
        phone: '(555) 456-7890',
        website: 'https://example.com',
        cuisine_type: 'Indian',
        image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&crop=center'
      }
    ];

    // Insert the restaurants using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .insert(sampleRestaurants)
      .select();

    if (error) {
      console.error('Error inserting restaurants:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Restaurants seeded successfully',
      restaurants: data 
    });

  } catch (error) {
    console.error('Seed restaurants error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
