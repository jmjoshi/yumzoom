'use client';

import { CuisinePreference } from '@/types/analytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CuisinePreferencesChartProps {
  data: CuisinePreference[];
}

export function CuisinePreferencesChart({ data }: CuisinePreferencesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No cuisine preference data available</p>
        <p className="text-sm text-gray-400 mt-1">
          Rate more restaurants to see your family's cuisine preferences!
        </p>
      </div>
    );
  }

  // Color palette for different cuisines
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
  ];

  // Prepare data for the chart
  const chartData = data.map((item, index) => ({
    name: item.cuisine_type,
    value: item.rating_count,
    percentage: item.percentage,
    averageRating: item.average_rating,
    fill: colors[index % colors.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-gray-600">
              Ratings: <span className="font-medium">{data.value}</span>
            </p>
            <p className="text-sm text-gray-600">
              Percentage: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </p>
            <p className="text-sm text-gray-600">
              Avg Rating: <span className="font-medium">{data.averageRating.toFixed(1)}/10</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Stats */}
      <div className="space-y-2">
        {data.slice(0, 6).map((cuisine, index) => (
          <div 
            key={cuisine.cuisine_type}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {cuisine.cuisine_type}
                </span>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{cuisine.rating_count} ratings</span>
                  <span>•</span>
                  <span>{cuisine.average_rating.toFixed(1)}/10 avg</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {cuisine.percentage.toFixed(1)}%
              </p>
              {cuisine.trend !== 'stable' && (
                <p className={`text-xs ${
                  cuisine.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {cuisine.trend === 'up' ? '↗ Trending' : '↘ Declining'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.length > 6 && (
        <p className="text-xs text-gray-500 text-center">
          Showing top 6 of {data.length} cuisine types
        </p>
      )}

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Cuisine Insights</h4>
        <div className="space-y-1 text-xs text-blue-700">
          <p>
            Most Popular: <span className="font-medium">{data[0]?.cuisine_type || 'N/A'}</span>
            {data[0] && ` (${data[0].percentage.toFixed(1)}% of ratings)`}
          </p>
          <p>
            Highest Rated: <span className="font-medium">
              {data.reduce((prev, current) => 
                prev.average_rating > current.average_rating ? prev : current
              )?.cuisine_type || 'N/A'}
            </span>
          </p>
          <p>
            Total Cuisines Tried: <span className="font-medium">{data.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
