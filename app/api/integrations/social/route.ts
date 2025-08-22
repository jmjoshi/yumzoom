import { NextRequest, NextResponse } from 'next/server';
import { generateShareContent, formatShareUrl, INTEGRATION_PROVIDERS } from '@/lib/integrations';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      restaurantId,
      platform,
      rating,
      review,
      customMessage 
    } = await request.json();

    if (!restaurantId || !platform) {
      return NextResponse.json(
        { error: 'Restaurant ID and platform are required' },
        { status: 400 }
      );
    }

    // Validate platform
    const supportedPlatform = INTEGRATION_PROVIDERS.social.find(p => p.id === platform);
    if (!supportedPlatform || !supportedPlatform.isEnabled) {
      return NextResponse.json(
        { error: 'Platform not supported or disabled' },
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

    // Generate share content
    let shareContent = generateShareContent(restaurant, rating, review);
    
    // Use custom message if provided
    if (customMessage) {
      shareContent = {
        ...shareContent,
        title: customMessage,
        description: `${customMessage} - ${restaurant.name} on YumZoom`,
      };
    }

    // Format URL for the specific platform
    const shareUrl = formatShareUrl(platform, shareContent);

    // Special handling for Instagram (no direct URL sharing)
    if (platform === 'instagram') {
      return NextResponse.json({
        success: true,
        platform,
        shareMethod: 'copy',
        content: {
          text: `${shareContent.title}\n\n${shareContent.description}\n\n${shareContent.url}`,
          hashtags: shareContent.hashtags,
          imageUrl: shareContent.imageUrl,
        },
        instructions: 'Copy the text and hashtags below, then share manually on Instagram with the restaurant photo.',
      });
    }

    // Log sharing activity for analytics
    await logSharingActivity(restaurantId, platform, rating, !!review);

    return NextResponse.json({
      success: true,
      platform,
      shareMethod: 'url',
      shareUrl,
      content: shareContent,
      instructions: `Click the share URL to post about ${restaurant.name} on ${supportedPlatform.name}.`,
    });

  } catch (error) {
    console.error('Social sharing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get available social platforms
export async function GET() {
  try {
    const platforms = INTEGRATION_PROVIDERS.social
      .filter(platform => platform.isEnabled)
      .map(platform => ({
        id: platform.id,
        name: platform.name,
        icon: platform.icon,
        supportsDirectSharing: platform.id !== 'instagram',
        instructions: getInstructions(platform.id),
      }));

    return NextResponse.json({
      success: true,
      platforms,
    });

  } catch (error) {
    console.error('Get social platforms error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Log sharing activity for analytics
async function logSharingActivity(
  restaurantId: string,
  platform: string,
  rating?: number,
  hasReview?: boolean
) {
  try {
    const { error } = await supabaseAdmin
      .from('social_sharing_activity')
      .insert({
        restaurant_id: restaurantId,
        platform,
        rating,
        has_review: hasReview || false,
        shared_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging sharing activity:', error);
    }
  } catch (error) {
    console.error('Error in logSharingActivity:', error);
  }
}

// Get platform-specific instructions
function getInstructions(platform: string): string {
  const instructions = {
    facebook: 'Share your dining experience with your friends and family on Facebook.',
    twitter: 'Tweet about your restaurant experience with our suggested hashtags.',
    instagram: 'Copy the text and share manually on Instagram with your food photos.',
    whatsapp: 'Share restaurant recommendations directly with your contacts.',
    linkedin: 'Share professional dining recommendations with your network.',
  };

  return instructions[platform as keyof typeof instructions] || 'Share your dining experience on this platform.';
}
