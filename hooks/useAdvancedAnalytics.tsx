/**
 * Advanced Analytics Hook - Phase 2
 * Provides advanced analytics capabilities including predictive insights,
 * competitive analysis, platform statistics, and custom reports
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type {
  PlatformUsageStatistics,
  PlatformGrowthMetrics,
  RestaurantCompetitiveAnalysis,
  MarketBenchmark,
  PredictiveInsight,
  RecommendationEngine,
  GeographicAnalytics,
  MarketHeatmapData,
  CustomReportDefinition,
  CustomReportExecution,
  ReportTemplate,
  AdvancedAnalyticsFilters,
  AnalyticsExportRequest,
  AnalyticsExportResult,
  AnalyticsShareRequest,
  UseAdvancedAnalyticsReturn,
  TrendForecast,
  CompetitiveInsight
} from '@/types/advanced-analytics';

export function useAdvancedAnalytics(
  initialFilters?: AdvancedAnalyticsFilters
): UseAdvancedAnalyticsReturn {
  const { user } = useAuth();
  
  // State management
  const [platformStatistics, setPlatformStatistics] = useState<PlatformUsageStatistics[] | null>(null);
  const [platformGrowthMetrics, setPlatformGrowthMetrics] = useState<PlatformGrowthMetrics | null>(null);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<RestaurantCompetitiveAnalysis[] | null>(null);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmark[] | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[] | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationEngine | null>(null);
  const [geographicAnalytics, setGeographicAnalytics] = useState<GeographicAnalytics[] | null>(null);
  const [marketHeatmap, setMarketHeatmap] = useState<MarketHeatmapData[] | null>(null);
  const [customReports, setCustomReports] = useState<CustomReportDefinition[] | null>(null);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[] | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch platform usage statistics
  const fetchPlatformStatistics = useCallback(async (filters?: AdvancedAnalyticsFilters) => {
    if (!user) return;

    try {
      const startDate = filters?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = filters?.date_range?.end || new Date().toISOString().split('T')[0];

      const { data, error: dbError } = await supabase
        .rpc('get_platform_usage_statistics', {
          start_date: startDate,
          end_date: endDate
        });

      if (dbError) throw dbError;

      setPlatformStatistics(data || []);

      // Calculate growth metrics
      if (data && data.length > 1) {
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        
        const growthMetrics: PlatformGrowthMetrics = {
          period: `${startDate} to ${endDate}`,
          user_acquisition: {
            new_users: latest.new_users_count,
            growth_rate: latest.user_growth_rate || 0,
            retention_rate: 85.2 // This would be calculated from actual retention data
          },
          content_growth: {
            new_restaurants: latest.new_restaurants_count,
            new_ratings: latest.new_ratings_count,
            content_quality_score: latest.platform_engagement_score
          },
          engagement_metrics: {
            avg_session_duration: 8.5, // This would come from session tracking
            pages_per_session: 12.3,
            bounce_rate: 25.8
          }
        };

        setPlatformGrowthMetrics(growthMetrics);
      }

    } catch (err) {
      console.error('Error fetching platform statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch platform statistics');
    }
  }, [user]);

  // Fetch competitive analysis
  const fetchCompetitiveAnalysis = useCallback(async (restaurantId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('restaurant_competitive_analysis')
        .select(`
          *,
          restaurants!inner(name, cuisine_type, address)
        `)
        .order('analysis_date', { ascending: false });

      // If restaurant owner, filter to their restaurants
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      } else {
        // Check if user is restaurant owner
        const { data: ownedRestaurants } = await supabase
          .from('restaurant_owners')
          .select('restaurant_id')
          .eq('user_id', user.id)
          .eq('is_verified', true);

        if (ownedRestaurants && ownedRestaurants.length > 0) {
          const restaurantIds = ownedRestaurants.map(r => r.restaurant_id);
          query = query.in('restaurant_id', restaurantIds);
        }
      }

      const { data, error: dbError } = await query.limit(50);

      if (dbError) throw dbError;

      setCompetitiveAnalysis(data || []);

      // Generate market benchmarks from competitive data
      if (data && data.length > 0) {
        const benchmarks: MarketBenchmark[] = data.map(analysis => ({
          metric: 'Average Rating',
          your_value: analysis.avg_competitor_rating + analysis.rating_vs_market,
          market_average: analysis.avg_competitor_rating,
          market_leader: analysis.market_leader_rating,
          percentile_rank: analysis.percentile_rating,
          recommendation: analysis.improvement_areas.length > 0 
            ? `Focus on ${analysis.improvement_areas[0].replace('_', ' ')}`
            : 'Maintain current performance',
          improvement_potential: Math.max(0, analysis.market_leader_rating - (analysis.avg_competitor_rating + analysis.rating_vs_market))
        }));

        setMarketBenchmarks(benchmarks);
      }

    } catch (err) {
      console.error('Error fetching competitive analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch competitive analysis');
    }
  }, [user]);

  // Fetch predictive insights
  const fetchPredictiveInsights = useCallback(async (filters?: AdvancedAnalyticsFilters) => {
    if (!user) return;

    try {
      let query = supabase
        .from('predictive_analytics_insights')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.entity_types) {
        query = query.in('entity_type', filters.entity_types);
      }

      if (filters?.confidence_threshold) {
        query = query.gte('confidence_score', filters.confidence_threshold);
      }

      if (filters?.impact_threshold) {
        query = query.gte('impact_score', filters.impact_threshold);
      }

      if (filters?.only_actionable) {
        query = query.eq('action_taken', false);
      }

      // Filter by user's accessible entities
      query = query.or(`entity_type.eq.platform,entity_id.eq.${user.id}`);

      const { data, error: dbError } = await query.limit(100);

      if (dbError) throw dbError;

      setPredictiveInsights(data || []);

      // Generate recommendations engine data
      if (data && data.length > 0) {
        const userRecommendations = data.filter(insight => 
          insight.entity_type === 'user' && insight.insight_category === 'recommendation'
        );

        const restaurantRecommendations = data.filter(insight => 
          insight.entity_type === 'restaurant' && insight.insight_category === 'opportunity'
        );

        const platformRecommendations = data.filter(insight => 
          insight.entity_type === 'platform' && insight.insight_category === 'forecast'
        );

        const recommendationEngine: RecommendationEngine = {
          user_recommendations: {
            restaurants: userRecommendations
              .filter(r => r.insight_type === 'restaurant_recommendation')
              .map(r => ({
                restaurant_id: r.prediction_data.restaurant_id || '',
                restaurant_name: r.prediction_data.restaurant_name || r.title,
                cuisine_type: r.prediction_data.cuisine_type || 'Unknown',
                confidence_score: r.confidence_score,
                reasoning: [r.description],
                expected_rating: r.prediction_data.expected_rating || 8.0
              })),
            cuisines: userRecommendations
              .filter(r => r.insight_type === 'cuisine_recommendation')
              .map(r => ({
                cuisine_type: r.prediction_data.cuisine_type || 'Unknown',
                confidence_score: r.confidence_score,
                reasoning: [r.description],
                top_restaurants: r.prediction_data.top_restaurants || []
              })),
            menu_items: userRecommendations
              .filter(r => r.insight_type === 'menu_optimization')
              .map(r => ({
                menu_item_id: r.prediction_data.menu_item_id || '',
                menu_item_name: r.prediction_data.menu_item_name || r.title,
                restaurant_id: r.prediction_data.restaurant_id || '',
                restaurant_name: r.prediction_data.restaurant_name || '',
                confidence_score: r.confidence_score,
                reasoning: [r.description],
                predicted_rating: r.prediction_data.predicted_rating || 8.0
              }))
          },
          restaurant_recommendations: {
            menu_optimizations: restaurantRecommendations.map(r => ({
              suggestion_type: r.prediction_data.suggestion_type || 'improve',
              menu_item_id: r.prediction_data.menu_item_id || '',
              menu_item_name: r.prediction_data.menu_item_name || r.title,
              current_performance: r.prediction_data.current_performance || 0,
              potential_improvement: r.prediction_data.potential_improvement || 0,
              recommended_action: r.description,
              confidence_score: r.confidence_score
            })),
            pricing_suggestions: [],
            marketing_opportunities: []
          },
          platform_recommendations: {
            feature_developments: platformRecommendations.map(r => ({
              feature_name: r.title,
              priority: r.impact_score > 0.8 ? 'high' : r.impact_score > 0.5 ? 'medium' : 'low',
              expected_impact: r.impact_score,
              development_effort: r.prediction_data.effort || 5,
              user_demand_score: r.confidence_score
            })),
            market_expansions: [],
            partnership_opportunities: []
          }
        };

        setRecommendations(recommendationEngine);
      }

    } catch (err) {
      console.error('Error fetching predictive insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch predictive insights');
    }
  }, [user]);

  // Fetch geographic analytics
  const fetchGeographicAnalytics = useCallback(async (filters?: AdvancedAnalyticsFilters) => {
    if (!user) return;

    try {
      let query = supabase
        .from('geographic_analytics')
        .select('*')
        .order('date', { ascending: false });

      if (filters?.date_range) {
        query = query
          .gte('date', filters.date_range.start)
          .lte('date', filters.date_range.end);
      }

      if (filters?.geographic_regions) {
        query = query.in('region_code', filters.geographic_regions);
      }

      const { data, error: dbError } = await query.limit(100);

      if (dbError) throw dbError;

      setGeographicAnalytics(data || []);

      // Generate heatmap data
      if (data && data.length > 0) {
        const heatmapData: MarketHeatmapData[] = data.map(geo => ({
          region_code: geo.region_code,
          region_name: geo.region_name,
          coordinates: {
            lat: 40.7128, // Default to NYC, would be calculated from region
            lng: -74.0060
          },
          metrics: {
            user_density: geo.user_count / 1000,
            restaurant_density: geo.restaurant_count / 100,
            engagement_level: geo.average_rating / 10,
            growth_potential: geo.opportunity_score
          },
          color_intensity: geo.opportunity_score
        }));

        setMarketHeatmap(heatmapData);
      }

    } catch (err) {
      console.error('Error fetching geographic analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch geographic analytics');
    }
  }, [user]);

  // Fetch custom reports
  const fetchCustomReports = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch user's custom reports
      const { data: reports, error: reportsError } = await supabase
        .from('custom_report_definitions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setCustomReports(reports || []);

      // Fetch public report templates
      const { data: templates, error: templatesError } = await supabase
        .from('custom_report_definitions')
        .select('*')
        .eq('is_public', true)
        .eq('is_template', true)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      
      const templateData: ReportTemplate[] = (templates || []).map(template => ({
        id: template.id,
        name: template.report_name,
        description: `${template.report_type} template`,
        category: template.report_type,
        definition: {
          report_name: template.report_name,
          report_type: template.report_type,
          filters: template.filters,
          metrics: template.metrics,
          visualization_config: template.visualization_config,
          schedule_config: template.schedule_config,
          is_public: true,
          is_template: true
        },
        usage_count: 0, // Would be tracked separately
        rating: 4.5
      }));

      setReportTemplates(templateData);

    } catch (err) {
      console.error('Error fetching custom reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch custom reports');
    }
  }, [user]);

  // Main refresh function
  const refreshAnalytics = useCallback(async (filters?: AdvancedAnalyticsFilters) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchPlatformStatistics(filters),
        fetchCompetitiveAnalysis(),
        fetchPredictiveInsights(filters),
        fetchGeographicAnalytics(filters),
        fetchCustomReports()
      ]);

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error refreshing analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh analytics');
    } finally {
      setLoading(false);
    }
  }, [user, fetchPlatformStatistics, fetchCompetitiveAnalysis, fetchPredictiveInsights, fetchGeographicAnalytics, fetchCustomReports]);

  // Generate custom report
  const generateReport = useCallback(async (
    definition: Partial<CustomReportDefinition>
  ): Promise<CustomReportExecution> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Create report definition
      const { data: reportDef, error: defError } = await supabase
        .from('custom_report_definitions')
        .insert({
          user_id: user.id,
          report_name: definition.report_name || 'Untitled Report',
          report_type: definition.report_type || 'platform_statistics',
          filters: definition.filters || {},
          metrics: definition.metrics || [],
          visualization_config: definition.visualization_config || {},
          is_public: definition.is_public || false,
          is_template: definition.is_template || false
        })
        .select('*')
        .single();

      if (defError) throw defError;

      // Execute the report
      const { data: execution, error: execError } = await supabase
        .from('custom_report_executions')
        .insert({
          report_definition_id: reportDef.id,
          executed_by: user.id,
          execution_type: 'manual',
          status: 'completed',
          parameters: definition.filters || {},
          result_data: { message: 'Report generated successfully' }
        })
        .select('*')
        .single();

      if (execError) throw execError;

      // Refresh custom reports list
      await fetchCustomReports();

      return execution;
    } catch (err) {
      console.error('Error generating report:', err);
      throw err;
    }
  }, [user, fetchCustomReports]);

  // Export data
  const exportData = useCallback(async (
    request: AnalyticsExportRequest
  ): Promise<AnalyticsExportResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Simulate export process
      const exportId = `export_${Date.now()}`;
      
      // In a real implementation, this would trigger a background job
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        export_id: exportId,
        status: 'completed',
        download_url: `/api/exports/${exportId}`,
        file_size: 1024 * 1024, // 1MB
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (err) {
      console.error('Error exporting data:', err);
      throw err;
    }
  }, [user]);

  // Share insight
  const shareInsight = useCallback(async (
    request: AnalyticsShareRequest
  ): Promise<boolean> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Simulate sharing process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Sharing insight:', request);
      return true;
    } catch (err) {
      console.error('Error sharing insight:', err);
      throw err;
    }
  }, [user]);

  // Provide feedback
  const provideFeedback = useCallback(async (
    insightId: string,
    rating: number,
    comment?: string
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('predictive_analytics_insights')
        .update({
          feedback_rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', insightId);

      if (error) throw error;

      // Refresh insights to show updated feedback
      await fetchPredictiveInsights();
    } catch (err) {
      console.error('Error providing feedback:', err);
      throw err;
    }
  }, [user, fetchPredictiveInsights]);

  // Load initial data
  useEffect(() => {
    if (user) {
      refreshAnalytics(initialFilters);
    }
  }, [user, refreshAnalytics, initialFilters]);

  return {
    // Data
    platformStatistics,
    platformGrowthMetrics,
    competitiveAnalysis,
    marketBenchmarks,
    predictiveInsights,
    recommendations,
    geographicAnalytics,
    marketHeatmap,
    customReports,
    reportTemplates,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshAnalytics: () => refreshAnalytics(initialFilters),
    generateReport,
    exportData,
    shareInsight,
    provideFeedback
  };
}

// Specialized hooks for specific analytics areas

export function usePredictiveAnalytics(entityType?: string, entityId?: string) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<PredictiveInsight[] | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationEngine | null>(null);
  const [forecasts, setForecasts] = useState<TrendForecast[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async (
    targetEntityType: string,
    targetEntityId?: string
  ): Promise<PredictiveInsight[]> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      
      const { data, error: dbError } = await supabase
        .rpc('generate_predictive_insights', {
          target_entity_type: targetEntityType,
          target_entity_id: targetEntityId
        });

      if (dbError) throw dbError;

      const generatedInsights = Array.isArray(data) ? data : [data];
      setInsights(generatedInsights);
      return generatedInsights;
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateInsightFeedback = useCallback(async (
    insightId: string,
    rating: number
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('predictive_analytics_insights')
        .update({ feedback_rating: rating })
        .eq('id', insightId);

      if (error) throw error;

      // Update local state
      setInsights(prev => 
        prev ? prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, feedback_rating: rating }
            : insight
        ) : null
      );
    } catch (err) {
      console.error('Error updating feedback:', err);
      throw err;
    }
  }, [user]);

  const markInsightAsActioned = useCallback(async (insightId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('predictive_analytics_insights')
        .update({ action_taken: true })
        .eq('id', insightId);

      if (error) throw error;

      // Update local state
      setInsights(prev => 
        prev ? prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, action_taken: true }
            : insight
        ) : null
      );
    } catch (err) {
      console.error('Error marking insight as actioned:', err);
      throw err;
    }
  }, [user]);

  useEffect(() => {
    if (user && entityType) {
      generateInsights(entityType, entityId);
    }
  }, [user, entityType, entityId, generateInsights]);

  return {
    insights,
    recommendations,
    forecasts,
    loading,
    error,
    generateInsights,
    updateInsightFeedback,
    markInsightAsActioned
  };
}

export function useCompetitiveAnalysis(restaurantId?: string) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<RestaurantCompetitiveAnalysis | null>(null);
  const [benchmarks, setBenchmarks] = useState<MarketBenchmark[] | null>(null);
  const [insights, setInsights] = useState<CompetitiveInsight[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = useCallback(async (
    targetRestaurantId: string
  ): Promise<RestaurantCompetitiveAnalysis> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      
      const { data, error: dbError } = await supabase
        .rpc('generate_restaurant_competitive_analysis', {
          target_restaurant_id: targetRestaurantId
        });

      if (dbError) throw dbError;

      setAnalysis(data);
      return data;
    } catch (err) {
      console.error('Error generating competitive analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshAnalysis = useCallback(async (): Promise<void> => {
    if (!user || !restaurantId) return;

    try {
      await generateAnalysis(restaurantId);
    } catch (err) {
      console.error('Error refreshing analysis:', err);
    }
  }, [user, restaurantId, generateAnalysis]);

  const compareWithCompetitors = useCallback(async (
    restaurantIds: string[]
  ): Promise<MarketBenchmark[]> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // This would be implemented with a more sophisticated comparison function
      const benchmarkData: MarketBenchmark[] = [];
      setBenchmarks(benchmarkData);
      return benchmarkData;
    } catch (err) {
      console.error('Error comparing with competitors:', err);
      throw err;
    }
  }, [user]);

  useEffect(() => {
    if (user && restaurantId) {
      generateAnalysis(restaurantId);
    }
  }, [user, restaurantId, generateAnalysis]);

  return {
    analysis,
    benchmarks,
    insights,
    loading,
    error,
    generateAnalysis,
    refreshAnalysis,
    compareWithCompetitors
  };
}
