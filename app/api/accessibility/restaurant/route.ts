import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('restaurant_accessibility')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no accessibility data exists, return default values
    const accessibilityData = data || {
      wheelchair_accessible: false,
      hearing_loop: false,
      braille_menu: false,
      accessible_parking: false,
      accessible_restroom: false,
      sign_language_service: false,
      large_print_menu: false,
      service_animals_welcome: false,
      elevator_access: false,
      accessible_entrance: false,
      accessible_seating: false,
      tactile_indicators: false,
      accessibility_notes: null,
      last_verified: null,
      verified_by: null,
      verification_source: null,
    };

    return NextResponse.json({
      success: true,
      data: accessibilityData,
    });

  } catch (error) {
    console.error('Error fetching accessibility info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      restaurantId,
      wheelchairAccessible = false,
      hearingLoop = false,
      brailleMenu = false,
      accessibleParking = false,
      accessibleRestroom = false,
      signLanguageService = false,
      largePrintMenu = false,
      serviceAnimalsWelcome = false,
      elevatorAccess = false,
      accessibleEntrance = false,
      accessibleSeating = false,
      tactileIndicators = false,
      accessibilityNotes,
      verificationSource = 'customer'
    } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Get current user (if authenticated)
    const authHeader = request.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      // In a real implementation, decode JWT token to get user ID
      // For now, we'll skip user verification
    }

    const accessibilityData = {
      restaurant_id: restaurantId,
      wheelchair_accessible: wheelchairAccessible,
      hearing_loop: hearingLoop,
      braille_menu: brailleMenu,
      accessible_parking: accessibleParking,
      accessible_restroom: accessibleRestroom,
      sign_language_service: signLanguageService,
      large_print_menu: largePrintMenu,
      service_animals_welcome: serviceAnimalsWelcome,
      elevator_access: elevatorAccess,
      accessible_entrance: accessibleEntrance,
      accessible_seating: accessibleSeating,
      tactile_indicators: tactileIndicators,
      accessibility_notes: accessibilityNotes,
      last_verified: new Date().toISOString(),
      verified_by: userId,
      verification_source: verificationSource,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('restaurant_accessibility')
      .upsert(accessibilityData, { onConflict: 'restaurant_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('Error updating accessibility info:', error);
    return NextResponse.json(
      { error: 'Failed to update accessibility information' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request); // Same logic for updates
}
