import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildDeliveryDeepLink, INTEGRATION_PROVIDERS } from '@/lib/integrations';

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, providers = [] } = await request.json();

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
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

    // Get delivery options for the restaurant
    const deliveryOptions = INTEGRATION_PROVIDERS.delivery
      .filter(provider => provider.isActive)
      .filter(provider => providers.length === 0 || providers.includes(provider.id))
      .map(provider => ({
        provider: provider.id,
        providerName: provider.name,
        logo: provider.logo,
        deliveryTime: getEstimatedDeliveryTime(provider.id),
        deliveryFee: getEstimatedDeliveryFee(provider.id),
        minimumOrder: getMinimumOrder(provider.id),
        isAvailable: isDeliveryAvailable(provider.id, restaurant),
        deepLink: buildDeliveryDeepLink(provider.id, restaurant),
      }));

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        city: restaurant.city,
      },
      deliveryOptions,
    });

  } catch (error) {
    console.error('Delivery integration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for delivery provider data
function getEstimatedDeliveryTime(provider: string): string {
  const times = {
    doordash: '25-40 min',
    ubereats: '20-35 min',
    grubhub: '30-45 min',
  };
  return times[provider as keyof typeof times] || '30-45 min';
}

function getEstimatedDeliveryFee(provider: string): number {
  const fees = {
    doordash: 2.99,
    ubereats: 3.49,
    grubhub: 2.49,
  };
  return fees[provider as keyof typeof fees] || 2.99;
}

function getMinimumOrder(provider: string): number {
  const minimums = {
    doordash: 12.00,
    ubereats: 15.00,
    grubhub: 10.00,
  };
  return minimums[provider as keyof typeof minimums] || 12.00;
}

function isDeliveryAvailable(provider: string, restaurant: any): boolean {
  // In a real implementation, you would check against provider APIs
  // For now, we'll assume availability based on restaurant type and location
  return true; // Simplified for demo
}

// Get available delivery providers for a specific location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would call delivery provider APIs
    // to check availability in the specific area
    const availableProviders = INTEGRATION_PROVIDERS.delivery
      .filter(provider => provider.isActive)
      .map(provider => ({
        id: provider.id,
        name: provider.name,
        logo: provider.logo,
        isAvailable: true, // Simplified for demo
        serviceArea: 'Available in your area',
      }));

    return NextResponse.json({
      success: true,
      location: { lat: parseFloat(lat), lng: parseFloat(lng), address },
      providers: availableProviders,
    });

  } catch (error) {
    console.error('Delivery providers check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
