import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ReservationRequest, INTEGRATION_PROVIDERS } from '@/lib/integrations';

export async function POST(request: NextRequest) {
  try {
    const reservationData: ReservationRequest = await request.json();
    
    const {
      restaurantId,
      restaurantName,
      partySize,
      date,
      time,
      specialRequests,
      userEmail,
      userName,
      userPhone,
    } = reservationData;

    // Validate required fields
    if (!restaurantId || !partySize || !date || !time || !userEmail || !userName) {
      return NextResponse.json(
        { error: 'Missing required reservation details' },
        { status: 400 }
      );
    }

    // Get restaurant details
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Check which reservation providers are available for this restaurant
    const availableProviders = await getAvailableReservationProviders(restaurant);
    
    if (availableProviders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No reservation systems available for this restaurant',
        providers: [],
        restaurant: {
          name: restaurant.name,
          phone: restaurant.phone_number,
          website: restaurant.website,
        },
      });
    }

    // For OpenTable integration (if restaurant supports it)
    const openTableProvider = availableProviders.find(p => p.id === 'opentable');
    if (openTableProvider && openTableProvider.supportsApi) {
      try {
        const reservation = await createOpenTableReservation(reservationData, restaurant);
        if (reservation.success) {
          // Store reservation in our database
          await storeReservation(reservationData, restaurant, 'opentable', reservation.reservationId);
          return NextResponse.json(reservation);
        }
      } catch (error) {
        console.error('OpenTable reservation error:', error);
      }
    }

    // If API reservation fails or isn't available, provide manual booking options
    const manualBookingOptions = availableProviders.map(provider => ({
      provider: provider.id,
      name: provider.name,
      logo: provider.logo,
      bookingUrl: generateBookingUrl(provider, restaurant, reservationData),
      instructions: generateBookingInstructions(provider, reservationData),
    }));

    // Store reservation attempt for tracking
    await storeReservationAttempt(reservationData, restaurant);

    return NextResponse.json({
      success: true,
      reservationId: null,
      confirmationNumber: null,
      message: 'Reservation options available. Please complete booking through your preferred provider.',
      manualBooking: true,
      bookingOptions: manualBookingOptions,
      restaurant: {
        name: restaurant.name,
        phone: restaurant.phone_number,
        address: `${restaurant.address}, ${restaurant.city}, ${restaurant.state}`,
      },
    });

  } catch (error) {
    console.error('Reservation integration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get available reservation providers for a restaurant
async function getAvailableReservationProviders(restaurant: any) {
  // In a real implementation, you would check restaurant's integrated systems
  // For now, return all providers but could return empty array based on restaurant data
  const hasReservationSystem = restaurant.accepts_reservations !== false;
  return hasReservationSystem ? [...INTEGRATION_PROVIDERS.reservation] : [];
}

// Create OpenTable reservation (mock implementation)
async function createOpenTableReservation(
  reservationData: ReservationRequest,
  restaurant: any
) {
  // This would integrate with OpenTable's API
  // For demo purposes, we'll simulate a successful reservation
  
  const isWeekend = new Date(reservationData.date).getDay() >= 5;
  const isPeakTime = reservationData.time >= '18:00' && reservationData.time <= '20:00';
  
  // Simulate availability check
  if (isWeekend && isPeakTime && reservationData.partySize > 6) {
    return {
      success: false,
      message: 'No availability for requested time. Please try a different time or check alternative providers.',
    };
  }

  // Simulate successful reservation
  return {
    success: true,
    reservationId: `OT${Date.now()}`,
    confirmationNumber: `YZ${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    message: 'Reservation confirmed! You will receive a confirmation email shortly.',
  };
}

// Generate booking URL for manual reservation
function generateBookingUrl(provider: any, restaurant: any, reservationData: ReservationRequest): string {
  const restaurantName = encodeURIComponent(restaurant.name);
  const restaurantAddress = encodeURIComponent(`${restaurant.address}, ${restaurant.city}`);
  
  switch (provider.id) {
    case 'opentable':
      return `https://www.opentable.com/s/?query=${restaurantName}&covers=${reservationData.partySize}&dateTime=${reservationData.date}%20${reservationData.time}`;
    
    case 'resy':
      return `https://resy.com/find?query=${restaurantName}&date=${reservationData.date}&party=${reservationData.partySize}`;
    
    case 'yelp':
      return `https://www.yelp.com/search?find_desc=${restaurantName}&find_loc=${restaurantAddress}`;
    
    default:
      return provider.websiteUrl;
  }
}

// Generate booking instructions
function generateBookingInstructions(provider: any, reservationData: ReservationRequest): string {
  const party = reservationData.partySize;
  const date = new Date(reservationData.date).toLocaleDateString();
  const time = reservationData.time;

  switch (provider.id) {
    case 'opentable':
      return `Search for the restaurant and book a table for ${party} on ${date} at ${time}. Mention you found them through YumZoom!`;
    
    case 'resy':
      return `Find the restaurant and reserve for ${party} people on ${date} at ${time}. Special requests: "${reservationData.specialRequests || 'None'}"`;
    
    case 'yelp':
      return `Find the restaurant page and call directly or use their online reservation system for ${party} people on ${date} at ${time}.`;
    
    default:
      return `Contact the restaurant directly to make a reservation for ${party} people on ${date} at ${time}.`;
  }
}

// Store successful reservation in database
async function storeReservation(
  reservationData: ReservationRequest,
  restaurant: any,
  provider: string,
  reservationId?: string
) {
  const { error } = await supabaseAdmin
    .from('reservations')
    .insert({
      restaurant_id: restaurant.id,
      user_email: reservationData.userEmail,
      user_name: reservationData.userName,
      user_phone: reservationData.userPhone,
      party_size: reservationData.partySize,
      reservation_date: reservationData.date,
      reservation_time: reservationData.time,
      special_requests: reservationData.specialRequests,
      provider: provider,
      external_reservation_id: reservationId,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error storing reservation:', error);
  }
}

// Store reservation attempt for analytics
async function storeReservationAttempt(
  reservationData: ReservationRequest,
  restaurant: any
) {
  const { error } = await supabaseAdmin
    .from('reservation_attempts')
    .insert({
      restaurant_id: restaurant.id,
      user_email: reservationData.userEmail,
      party_size: reservationData.partySize,
      requested_date: reservationData.date,
      requested_time: reservationData.time,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error storing reservation attempt:', error);
  }
}

// Get reservation providers for a restaurant
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

    const { data: restaurant, error } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (error || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const providers = await getAvailableReservationProviders(restaurant);

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        phone: restaurant.phone_number,
        website: restaurant.website,
      },
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        logo: p.logo,
        supportsApi: p.supportsApi,
      })),
    });

  } catch (error) {
    console.error('Get reservation providers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
