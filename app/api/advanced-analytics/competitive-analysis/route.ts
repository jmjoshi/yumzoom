/**
 * Advanced Analytics API - Competitive Analysis
 * Provides restaurant competitive analysis and market insights
 */

import { NextRequest, NextResponse } from 'next/server';
import type { RestaurantCompetitiveAnalysis, AdvancedAnalyticsResponse } from '@/types/advanced-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');
    const analysisType = searchParams.get('analysis_type') || 'comprehensive';
    const timeframe = searchParams.get('timeframe') || '30d';
    
    // Mock competitive analysis data for development
    const mockAnalysis: RestaurantCompetitiveAnalysis[] = [
      {
        id: '1',
        restaurant_id: restaurantId || '1',
        restaurant_name: 'Our Restaurant',
        analysis_date: new Date().toISOString(),
        cuisine_category: 'Italian',
        geographic_region: 'Downtown',
        market_rank: 3,
        percentile_rating: 85.5,
        percentile_review_volume: 62.3,
        percentile_customer_engagement: 78.9,
        avg_competitor_rating: 4.1,
        avg_competitor_review_count: 287,
        market_leader_rating: 4.7,
        market_share_estimate: 12.5,
        rating_vs_market: 0.4,
        volume_vs_market: -0.15,
        engagement_vs_market: 0.25,
        improvement_areas: ['Review volume growth', 'Social media presence', 'Delivery partnerships'],
        competitive_advantages: ['Higher than average rating', 'Authentic cuisine', 'Prime location'],
        market_opportunities: ['Catering services', 'Weekend brunch menu', 'Wine pairing events']
      },
      {
        id: '2',
        restaurant_id: restaurantId || '1',
        restaurant_name: 'Our Restaurant',
        analysis_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        cuisine_category: 'Italian',
        geographic_region: 'Downtown',
        market_rank: 4,
        percentile_rating: 82.1,
        percentile_review_volume: 58.7,
        percentile_customer_engagement: 75.2,
        avg_competitor_rating: 4.0,
        avg_competitor_review_count: 275,
        market_leader_rating: 4.6,
        market_share_estimate: 11.8,
        rating_vs_market: 0.35,
        volume_vs_market: -0.18,
        engagement_vs_market: 0.22,
        improvement_areas: ['Online ordering optimization', 'Customer retention programs', 'Menu diversification'],
        competitive_advantages: ['Quality ingredients', 'Experienced chef', 'Customer service'],
        market_opportunities: ['Corporate lunch packages', 'Cooking classes', 'Private dining events']
      },
      {
        id: '3',
        restaurant_id: restaurantId || '1',
        restaurant_name: 'Our Restaurant',
        analysis_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        cuisine_category: 'Italian',
        geographic_region: 'Downtown',
        market_rank: 2,
        percentile_rating: 88.3,
        percentile_review_volume: 65.1,
        percentile_customer_engagement: 81.4,
        avg_competitor_rating: 4.15,
        avg_competitor_review_count: 295,
        market_leader_rating: 4.8,
        market_share_estimate: 13.2,
        rating_vs_market: 0.45,
        volume_vs_market: -0.12,
        engagement_vs_market: 0.28,
        improvement_areas: ['Digital marketing', 'Peak hour efficiency', 'Loyalty program'],
        competitive_advantages: ['Consistent quality', 'Unique recipes', 'Atmosphere'],
        market_opportunities: ['Food truck events', 'Meal kit delivery', 'Partnership with local hotels']
      },
      {
        id: '4',
        restaurant_id: restaurantId || '1',
        restaurant_name: 'Our Restaurant',
        analysis_date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        cuisine_category: 'Italian',
        geographic_region: 'Downtown',
        market_rank: 3,
        percentile_rating: 86.7,
        percentile_review_volume: 61.9,
        percentile_customer_engagement: 79.6,
        avg_competitor_rating: 4.08,
        avg_competitor_review_count: 283,
        market_leader_rating: 4.75,
        market_share_estimate: 12.8,
        rating_vs_market: 0.42,
        volume_vs_market: -0.16,
        engagement_vs_market: 0.26,
        improvement_areas: ['Weekend wait times', 'Mobile app features', 'Seasonal menu updates'],
        competitive_advantages: ['Family recipes', 'Fresh pasta', 'Wine selection'],
        market_opportunities: ['Gluten-free options', 'Vegan menu items', 'Outdoor dining expansion']
      },
      {
        id: '5',
        restaurant_id: restaurantId || '1',
        restaurant_name: 'Our Restaurant',
        analysis_date: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
        cuisine_category: 'Italian',
        geographic_region: 'Downtown',
        market_rank: 1,
        percentile_rating: 91.2,
        percentile_review_volume: 68.4,
        percentile_customer_engagement: 85.7,
        avg_competitor_rating: 4.2,
        avg_competitor_review_count: 301,
        market_leader_rating: 4.9,
        market_share_estimate: 15.1,
        rating_vs_market: 0.5,
        volume_vs_market: -0.08,
        engagement_vs_market: 0.32,
        improvement_areas: ['Delivery speed optimization', 'Social media engagement', 'Staff training programs'],
        competitive_advantages: ['Award-winning chef', 'Historic location', 'Exceptional service'],
        market_opportunities: ['Celebrity chef events', 'Wine tasting series', 'Cookbook publication']
      }
    ];

    // Apply filters
    let filteredAnalysis = mockAnalysis;
    
    if (restaurantId) {
      filteredAnalysis = filteredAnalysis.filter(analysis => analysis.restaurant_id === restaurantId);
    }
    
    // Note: analysisType filter removed as it doesn't exist in the interface
    // The interface uses analysis_date instead of analysis_type

    // Calculate competitive intelligence summary based on actual interface properties
    const competitiveIntelligence = {
      total_competitors_analyzed: filteredAnalysis.length,
      average_percentile_rating: filteredAnalysis.reduce((sum, a) => sum + a.percentile_rating, 0) / filteredAnalysis.length,
      average_market_rank: filteredAnalysis.reduce((sum, a) => sum + (a.market_rank || 0), 0) / filteredAnalysis.length,
      market_rank_distribution: {
        rank_1: filteredAnalysis.filter(a => a.market_rank === 1).length,
        rank_2: filteredAnalysis.filter(a => a.market_rank === 2).length,
        rank_3: filteredAnalysis.filter(a => a.market_rank === 3).length,
        rank_4_plus: filteredAnalysis.filter(a => a.market_rank && a.market_rank >= 4).length
      },
      performance_trends: {
        rating_improvement: filteredAnalysis.filter(a => a.rating_vs_market > 0).length,
        engagement_growth: filteredAnalysis.filter(a => a.engagement_vs_market > 0).length,
        market_share_gains: filteredAnalysis.filter(a => a.market_share_estimate > 12).length
      },
      key_insights: [
        'Rating performance consistently above market average',
        'Market position shows strong competitive standing',
        'Opportunities exist in review volume growth',
        'Customer engagement trending positively',
        'Market share positioning indicates growth potential'
      ]
    };

    const response: AdvancedAnalyticsResponse<RestaurantCompetitiveAnalysis[]> = {
      success: true,
      data: filteredAnalysis,
      metadata: {
        generated_at: new Date().toISOString(),
        data_freshness: 'demo-data',
        confidence_level: 0.85,
        processing_time_ms: 45
      }
    };

    // Add competitive analysis specific data
    (response as any).competitive_intelligence = competitiveIntelligence;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Competitive analysis API error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch competitive analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      metadata: {
        generated_at: new Date().toISOString(),
        data_freshness: 'unknown',
        confidence_level: 0,
        processing_time_ms: 0
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurant_id, competitor_ids, analysis_types } = body;

    if (!restaurant_id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'restaurant_id is required' } },
        { status: 400 }
      );
    }

    // Mock response for generating new competitive analysis
    const newAnalysis: RestaurantCompetitiveAnalysis = {
      id: `analysis_${Date.now()}`,
      restaurant_id: restaurant_id,
      restaurant_name: 'Restaurant Analysis Generated',
      analysis_date: new Date().toISOString(),
      cuisine_category: 'Various',
      geographic_region: 'Auto-detected',
      market_rank: 2,
      percentile_rating: 75.0,
      percentile_review_volume: 65.0,
      percentile_customer_engagement: 70.0,
      avg_competitor_rating: 4.0,
      avg_competitor_review_count: 250,
      market_leader_rating: 4.8,
      market_share_estimate: 10.5,
      rating_vs_market: 0.2,
      volume_vs_market: -0.1,
      engagement_vs_market: 0.15,
      improvement_areas: [
        'Analysis generated successfully',
        'Review detailed findings in the dashboard',
        'Monitor competitor changes regularly'
      ],
      competitive_advantages: [
        'Newly generated analysis',
        'Current market data',
        'Comprehensive insights'
      ],
      market_opportunities: [
        'Digital marketing expansion',
        'Customer experience enhancement',
        'Competitive positioning optimization'
      ]
    };

    return NextResponse.json({
      success: true,
      data: [newAnalysis],
      metadata: {
        generated_at: new Date().toISOString(),
        data_freshness: 'fresh',
        confidence_level: 0.80,
        processing_time_ms: 200
      }
    });

  } catch (error) {
    console.error('Competitive analysis generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate competitive analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      metadata: {
        generated_at: new Date().toISOString(),
        data_freshness: 'unknown',
        confidence_level: 0,
        processing_time_ms: 0
      }
    }, { status: 500 });
  }
}
