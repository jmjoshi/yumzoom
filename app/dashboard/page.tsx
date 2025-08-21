'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Star, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface DashboardStats {
  totalRatings: number;
  averageRating: number;
  restaurantsRated: number;
  familyMembers: number;
}

interface RecentRating {
  id: string;
  rating: number;
  created_at: string;
  menu_items: {
    name: string;
    restaurants: {
      name: string;
    }[];
  }[];
  family_members: {
    name: string;
  }[];
}

// Helper type for transformed data
interface RestaurantRatingGroup {
  restaurantName: string;
  restaurantAddress: string;
  menuItems: {
    [menuItemName: string]: {
      ratings: {
        id: string;
        rating: number;
        familyMemberName?: string;
        created_at: string;
      }[];
    }
  };
  latestDate: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRatings: 0,
    averageRating: 0,
    restaurantsRated: 0,
    familyMembers: 0,
  });
  const [recentRatings, setRecentRatings] = useState<RestaurantRatingGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's ratings with menu item and restaurant info
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          created_at,
          menu_items!inner (
            name,
            restaurants!inner (
              name,
              address
            )
          ),
          family_members (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      console.log('Raw ratings data:', ratingsData);

      // Calculate stats from raw data
      const totalRatings = ratingsData?.length || 0;
      const averageRating = totalRatings > 0
        ? ratingsData.reduce((sum: number, rating: any) => sum + rating.rating, 0) / totalRatings
        : 0;

      // Get unique restaurants from raw data
      const uniqueRestaurants = new Set(
        ratingsData?.map((rating: any) => rating.menu_items?.restaurants?.name) || []
      );
      const restaurantsRated = uniqueRestaurants.size;

      // Group ratings by restaurant and menu item
      const ratingGroups: { [key: string]: RestaurantRatingGroup } = {};
      
      (ratingsData || []).forEach((rating: any) => {
        const restaurantName = rating.menu_items?.restaurants?.name || 'Unknown Restaurant';
        const restaurantAddress = rating.menu_items?.restaurants?.address || '';
        const menuItemName = rating.menu_items?.name || 'Unknown Item';
        
        if (!ratingGroups[restaurantName]) {
          ratingGroups[restaurantName] = {
            restaurantName,
            restaurantAddress,
            menuItems: {},
            latestDate: rating.created_at
          };
        }
        
        if (!ratingGroups[restaurantName].menuItems[menuItemName]) {
          ratingGroups[restaurantName].menuItems[menuItemName] = {
            ratings: []
          };
        }
        
        ratingGroups[restaurantName].menuItems[menuItemName].ratings.push({
          id: rating.id,
          rating: rating.rating,
          familyMemberName: rating.family_members?.name,
          created_at: rating.created_at
        });
        
        // Update latest date if this rating is more recent
        if (rating.created_at > ratingGroups[restaurantName].latestDate) {
          ratingGroups[restaurantName].latestDate = rating.created_at;
        }
      });

      // Convert to array and sort by latest date
      const groupedRatings = Object.values(ratingGroups)
        .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
        .slice(0, 5); // Take top 5 most recent restaurant visits

      // Fetch family members count
      const { data: familyData, error: familyError } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', user.id);

      if (familyError) throw familyError;
      const familyMembers = familyData.length;

      setStats({
        totalRatings,
        averageRating,
        restaurantsRated,
        familyMembers,
      });

      // Set recent ratings (top 5 restaurant groups)
      setRecentRatings(groupedRatings);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Ratings',
      value: stats.totalRatings,
      description: "Items you've rated",
      icon: Star,
      color: 'text-yellow-600',
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      description: 'Your average score',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Restaurants',
      value: stats.restaurantsRated,
      description: "Places you've visited",
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      title: 'Family Members',
      value: stats.familyMembers,
      description: 'Added to your account',
      icon: Users,
      color: 'text-purple-600',
      action: stats.familyMembers === 0 ? 'Add family members' : 'Manage family',
      href: ROUTES.FAMILY,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome back, {user?.user_metadata?.first_name || user?.email}!
            </h1>
            <p className="text-lg text-gray-600">
              Here's an overview of your dining experiences
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href={ROUTES.ANALYTICS}>
              <Button variant="outline" className="inline-flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600 mb-2">
                {stat.description}
              </p>
              {stat.action && stat.href && (
                <Link href={stat.href}>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    {stat.action}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Ratings</CardTitle>
          <CardDescription>
            Your latest dining experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentRatings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No ratings yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start by visiting a restaurant and rating some dishes!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {recentRatings.map((restaurantGroup, index) => (
                <Card key={`${restaurantGroup.restaurantName}-${index}`} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {restaurantGroup.restaurantName}
                      </h3>
                      {restaurantGroup.restaurantAddress && (
                        <p className="text-sm text-gray-600">
                          📍 {restaurantGroup.restaurantAddress}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Latest visit: {formatDate(restaurantGroup.latestDate)}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {Object.entries(restaurantGroup.menuItems).map(([menuItemName, menuItemData]) => (
                        <div key={menuItemName} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">
                            {menuItemName}
                          </h4>
                          
                          <div className="space-y-2">
                            {menuItemData.ratings.map((rating) => (
                              <div key={rating.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                                <div className="flex-1">
                                  <span className="text-sm text-gray-700">
                                    {rating.familyMemberName ? `${rating.familyMemberName}'s rating` : 'Your rating'}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {formatDate(rating.created_at)}
                                  </span>
                                </div>
                                <StarRating value={rating.rating} size="sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
