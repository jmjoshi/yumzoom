import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { 
  RestaurantPerformanceDashboard,
  MenuItemPerformance,
  CustomerFeedbackInsights,
  RestaurantAnalyticsTimeRange,
  UseRestaurantAnalyticsReturn,
  AnalyticsExportData
} from '@/types/restaurant-analytics';

export function useRestaurantAnalytics(): UseRestaurantAnalyticsReturn {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<RestaurantPerformanceDashboard[]>([]);
  const [menuAnalytics, setMenuAnalytics] = useState<MenuItemPerformance[]>([]);
  const [feedbackInsights, setFeedbackInsights] = useState<CustomerFeedbackInsights | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<RestaurantAnalyticsTimeRange['value']>('month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurant performance dashboard data
  const fetchPerformanceData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .rpc('get_restaurant_performance_dashboard', {
          owner_user_id: user.id,
          target_restaurant_id: selectedRestaurant,
          time_period: timeRange
        });

      if (dbError) {
        throw dbError;
      }

      setPerformanceData(data || []);
      
      // Auto-select first restaurant if none selected
      if (!selectedRestaurant && data && data.length > 0) {
        setSelectedRestaurant(data[0].restaurant_id);
      }
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, [user, selectedRestaurant, timeRange]);

  // Fetch menu item analytics
  const fetchMenuAnalytics = useCallback(async () => {
    if (!user || !selectedRestaurant) return;

    try {
      const { data, error: dbError } = await supabase
        .rpc('get_menu_item_performance', {
          owner_user_id: user.id,
          target_restaurant_id: selectedRestaurant,
          time_period: timeRange
        });

      if (dbError) {
        throw dbError;
      }

      setMenuAnalytics(data || []);
    } catch (err) {
      console.error('Error fetching menu analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch menu analytics');
    }
  }, [user, selectedRestaurant, timeRange]);

  // Fetch customer feedback insights
  const fetchFeedbackInsights = useCallback(async () => {
    if (!user || !selectedRestaurant) return;

    try {
      const { data, error: dbError } = await supabase
        .rpc('get_customer_feedback_insights', {
          owner_user_id: user.id,
          target_restaurant_id: selectedRestaurant,
          time_period: timeRange
        });

      if (dbError) {
        throw dbError;
      }

      // The function returns a single row with the insights data
      if (data && data.length > 0) {
        setFeedbackInsights(data[0]);
      } else {
        setFeedbackInsights(null);
      }
    } catch (err) {
      console.error('Error fetching feedback insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback insights');
    }
  }, [user, selectedRestaurant, timeRange]);

  // Refresh all analytics data
  const refreshAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchPerformanceData(),
        selectedRestaurant ? fetchMenuAnalytics() : Promise.resolve(),
        selectedRestaurant ? fetchFeedbackInsights() : Promise.resolve()
      ]);
    } catch (err) {
      console.error('Error refreshing analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [user, fetchPerformanceData, fetchMenuAnalytics, fetchFeedbackInsights, selectedRestaurant]);

  // Export analytics data
  const exportAnalytics = useCallback(async (format: 'csv' | 'pdf' | 'json') => {
    if (!selectedRestaurant || performanceData.length === 0) return;

    const selectedRestaurantData = performanceData.find(r => r.restaurant_id === selectedRestaurant);
    if (!selectedRestaurantData) return;

    const exportData: AnalyticsExportData = {
      restaurant_name: selectedRestaurantData.restaurant_name,
      time_period: timeRange,
      performance_dashboard: selectedRestaurantData,
      menu_performance: menuAnalytics,
      feedback_insights: feedbackInsights || {
        feedback_summary: { total_reviews: 0, average_rating: 0, review_volume_trend: 'low' },
        sentiment_breakdown: { positive: 0, neutral: 0, negative: 0, positive_percentage: 0, negative_percentage: 0 },
        common_themes: { service_mentions: 0, food_quality_mentions: 0, ambiance_mentions: 0, value_mentions: 0 },
        actionable_insights: []
      },
      export_date: new Date().toISOString()
    };

    try {
      switch (format) {
        case 'csv':
          await exportToCSV(exportData);
          break;
        case 'pdf':
          await exportToPDF(exportData);
          break;
        case 'json':
          await exportToJSON(exportData);
          break;
      }
    } catch (err) {
      console.error('Error exporting analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
    }
  }, [selectedRestaurant, performanceData, menuAnalytics, feedbackInsights, timeRange]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, timeRange, fetchPerformanceData]);

  // Effect to fetch menu and feedback data when restaurant changes
  useEffect(() => {
    if (user && selectedRestaurant) {
      fetchMenuAnalytics();
      fetchFeedbackInsights();
    } else {
      setMenuAnalytics([]);
      setFeedbackInsights(null);
    }
  }, [user, selectedRestaurant, timeRange, fetchMenuAnalytics, fetchFeedbackInsights]);

  return {
    performanceData,
    menuAnalytics,
    feedbackInsights,
    selectedRestaurant,
    timeRange,
    loading,
    error,
    setSelectedRestaurant,
    setTimeRange,
    refreshAnalytics,
    exportAnalytics
  };
}

// Export utility functions
async function exportToCSV(data: AnalyticsExportData) {
  const csvContent = generateCSVContent(data);
  downloadFile(csvContent, `${data.restaurant_name}_analytics_${data.time_period}.csv`, 'text/csv');
}

async function exportToPDF(data: AnalyticsExportData) {
  // This would typically use a library like jsPDF or Puppeteer
  // For now, we'll create a simple text-based PDF content
  const pdfContent = generatePDFContent(data);
  downloadFile(pdfContent, `${data.restaurant_name}_analytics_${data.time_period}.txt`, 'text/plain');
}

async function exportToJSON(data: AnalyticsExportData) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${data.restaurant_name}_analytics_${data.time_period}.json`, 'application/json');
}

function generateCSVContent(data: AnalyticsExportData): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`Restaurant Analytics Report - ${data.restaurant_name}`);
  lines.push(`Time Period: ${data.time_period}`);
  lines.push(`Export Date: ${new Date(data.export_date).toLocaleDateString()}`);
  lines.push('');
  
  // Performance Summary
  lines.push('Performance Summary');
  lines.push('Metric,Current Period,Previous Period,Change');
  const perf = data.performance_dashboard;
  lines.push(`Total Ratings,${perf.current_period.total_ratings},${perf.previous_period.total_ratings},${perf.period_comparison.ratings_change}`);
  lines.push(`Average Rating,${perf.current_period.average_rating},${perf.previous_period.average_rating},${perf.period_comparison.rating_change}`);
  lines.push(`Unique Customers,${perf.current_period.unique_customers},${perf.previous_period.unique_customers},${perf.period_comparison.customers_change}`);
  lines.push(`Response Rate,${perf.current_period.response_rate}%,,`);
  lines.push('');
  
  // Menu Performance
  lines.push('Menu Item Performance');
  lines.push('Item Name,Category,Average Rating,Total Ratings,Performance Score,Trend');
  data.menu_performance.forEach(item => {
    lines.push(`"${item.menu_item_name}","${item.category || ''}",${item.average_rating},${item.total_ratings},${item.performance_score},${item.rating_trend}`);
  });
  lines.push('');
  
  // Sentiment Breakdown
  if (data.feedback_insights) {
    lines.push('Customer Sentiment');
    lines.push('Sentiment,Count,Percentage');
    const sentiment = data.feedback_insights.sentiment_breakdown;
    lines.push(`Positive,${sentiment.positive},${sentiment.positive_percentage}%`);
    lines.push(`Neutral,${sentiment.neutral},${100 - sentiment.positive_percentage - sentiment.negative_percentage}%`);
    lines.push(`Negative,${sentiment.negative},${sentiment.negative_percentage}%`);
  }
  
  return lines.join('\n');
}

function generatePDFContent(data: AnalyticsExportData): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`RESTAURANT ANALYTICS REPORT`);
  lines.push(`${data.restaurant_name}`);
  lines.push(`Time Period: ${data.time_period}`);
  lines.push(`Export Date: ${new Date(data.export_date).toLocaleDateString()}`);
  lines.push('');
  lines.push('='.repeat(50));
  lines.push('');
  
  // Performance Summary
  lines.push('PERFORMANCE SUMMARY');
  lines.push('-'.repeat(30));
  const perf = data.performance_dashboard;
  lines.push(`Total Ratings: ${perf.current_period.total_ratings} (${perf.period_comparison.ratings_change > 0 ? '+' : ''}${perf.period_comparison.ratings_change})`);
  lines.push(`Average Rating: ${perf.current_period.average_rating}/10 (${perf.period_comparison.rating_change > 0 ? '+' : ''}${perf.period_comparison.rating_change})`);
  lines.push(`Unique Customers: ${perf.current_period.unique_customers} (${perf.period_comparison.customers_change > 0 ? '+' : ''}${perf.period_comparison.customers_change})`);
  lines.push(`Response Rate: ${perf.current_period.response_rate}%`);
  lines.push('');
  
  // Top Menu Items
  lines.push('TOP PERFORMING MENU ITEMS');
  lines.push('-'.repeat(30));
  data.menu_performance.slice(0, 5).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.menu_item_name}`);
    lines.push(`   Rating: ${item.average_rating}/10 (${item.total_ratings} reviews)`);
    lines.push(`   Trend: ${item.rating_trend}`);
    lines.push('');
  });
  
  // Feedback Insights
  if (data.feedback_insights) {
    lines.push('CUSTOMER FEEDBACK INSIGHTS');
    lines.push('-'.repeat(30));
    const feedback = data.feedback_insights;
    lines.push(`Total Reviews: ${feedback.feedback_summary.total_reviews}`);
    lines.push(`Average Rating: ${feedback.feedback_summary.average_rating}/10`);
    lines.push(`Positive Sentiment: ${feedback.sentiment_breakdown.positive_percentage}%`);
    lines.push(`Negative Sentiment: ${feedback.sentiment_breakdown.negative_percentage}%`);
    lines.push('');
    
    if (feedback.actionable_insights.length > 0) {
      lines.push('ACTIONABLE INSIGHTS');
      lines.push('-'.repeat(30));
      feedback.actionable_insights.forEach((insight, index) => {
        lines.push(`${index + 1}. ${insight}`);
      });
    }
  }
  
  return lines.join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
