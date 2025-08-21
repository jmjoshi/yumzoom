'use client';

import { PopularRestaurant } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StarRating } from '@/components/ui/Rating';
import { formatDate } from '@/lib/utils';

interface PopularRestaurantsChartProps {
  data: PopularRestaurant[];
}

export function PopularRestaurantsChart({ data }: PopularRestaurantsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No restaurant data available</p>
        <p className="text-sm text-gray-400 mt-1">
          Start rating restaurants to see your favorites!
        </p>
      </div>
    );
  }

  // Prepare data for the chart
  const chartData = data.slice(0, 8).map(restaurant => ({
    name: restaurant.restaurant_name.length > 15 
      ? restaurant.restaurant_name.substring(0, 15) + '...'
      : restaurant.restaurant_name,
    fullName: restaurant.restaurant_name,
    visits: restaurant.visit_frequency,
    rating: restaurant.average_rating,
    cuisine: restaurant.cuisine_type,
    lastVisit: restaurant.last_visit,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600">{data.cuisine}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-sm text-gray-600">Visits:</span>
            <span className="font-medium">{data.visits}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Rating:</span>
            <span className="font-medium">{data.rating.toFixed(1)}/10</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Last visit: {formatDate(data.lastVisit)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              stroke="#6b7280"
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="visits" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="Number of Visits"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Restaurant List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {data.slice(0, 5).map((restaurant, index) => (
          <div 
            key={restaurant.restaurant_id} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {restaurant.restaurant_name}
                  </h4>
                  <p className="text-xs text-gray-500">{restaurant.cuisine_type}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">{restaurant.visit_frequency}</p>
                <p className="text-xs text-gray-500">visits</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">{restaurant.average_rating.toFixed(1)}</p>
                <StarRating value={restaurant.average_rating} size="xs" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length > 5 && (
        <p className="text-xs text-gray-500 text-center">
          Showing top 5 of {data.length} restaurants
        </p>
      )}
    </div>
  );
}
