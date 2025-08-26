'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { MenuItemCard } from '@/components/restaurant/MenuItemCard';
import { MenuSearch, type MenuFilters } from '@/components/restaurant/MenuSearch';
import RestaurantCharacteristics from '@/components/restaurant/RestaurantCharacteristics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Restaurant, MenuItemWithRatings, UserRating, CreateRating } from '@/types/restaurant';
import { FamilyMember } from '@/types/user';
import { MapPin, Phone, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemWithRatings[]>([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItemWithRatings[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, UserRating[]>>({});
  const [allReviews, setAllReviews] = useState<Record<string, UserRating[]>>({});
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [menuFilters, setMenuFilters] = useState<MenuFilters>({
    searchQuery: '',
    category: 'All Categories',
    sortBy: 'name',
    sortOrder: 'asc',
    priceRange: null
  });

  // Apply menu item filtering
  useEffect(() => {
    let filtered = [...menuItems];

    // Apply search query
    if (menuFilters.searchQuery.trim()) {
      const query = menuFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (menuFilters.category !== 'All Categories') {
      filtered = filtered.filter(item => item.category === menuFilters.category);
    }

    // Apply price range filter
    if (menuFilters.priceRange) {
      filtered = filtered.filter(item => {
        if (!item.price) return false;
        return item.price >= menuFilters.priceRange!.min && item.price <= menuFilters.priceRange!.max;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (menuFilters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'rating':
          // Calculate average rating for sorting
          const aRatings = userRatings[a.id] || [];
          const bRatings = userRatings[b.id] || [];
          aValue = aRatings.length > 0 ? aRatings.reduce((sum, r) => sum + r.rating, 0) / aRatings.length : 0;
          bValue = bRatings.length > 0 ? bRatings.reduce((sum, r) => sum + r.rating, 0) / bRatings.length : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (menuFilters.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    setFilteredMenuItems(filtered);
  }, [menuItems, menuFilters, userRatings]);

  const handleMenuSearch = (query: string) => {
    setMenuFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const handleMenuFilterChange = (newFilters: MenuFilters) => {
    setMenuFilters(newFilters);
  };

  const fetchUserData = useCallback(async (currentMenuItems: MenuItemWithRatings[]) => {
    if (!user) return;

    try {
      // Fetch user's ratings for this restaurant
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          *,
          family_members (
            id,
            name,
            relationship
          )
        `)
        .eq('user_id', user.id)
        .in('menu_item_id', currentMenuItems.map(item => item.id));

      if (ratingsError) throw ratingsError;

      // Group ratings by menu item
      const groupedRatings: Record<string, UserRating[]> = {};
      ratingsData.forEach((rating: any) => {
        if (!groupedRatings[rating.menu_item_id]) {
          groupedRatings[rating.menu_item_id] = [];
        }
        groupedRatings[rating.menu_item_id].push({
          ...rating,
          family_member: rating.family_members,
        });
      });

      setUserRatings(groupedRatings);

      // Fetch family members
      const { data: familyData, error: familyError } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (familyError) throw familyError;
      setFamilyMembers(familyData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [user]);

  const fetchAllReviews = useCallback(async (currentMenuItems: MenuItemWithRatings[]) => {
    try {
      // Fetch ALL reviews for this restaurant from ALL users
      const { data: allReviewsData, error: allReviewsError } = await supabase
        .from('ratings')
        .select(`
          *,
          family_members (
            id,
            name,
            relationship
          ),
          review_photos (
            id,
            photo_url,
            photo_filename,
            photo_size,
            upload_order
          )
        `)
        .in('menu_item_id', currentMenuItems.map(item => item.id))
        .order('created_at', { ascending: false });

      if (allReviewsError) throw allReviewsError;

      // Group all reviews by menu item
      const groupedAllReviews: Record<string, UserRating[]> = {};
      allReviewsData.forEach((review: any) => {
        if (!groupedAllReviews[review.menu_item_id]) {
          groupedAllReviews[review.menu_item_id] = [];
        }
        groupedAllReviews[review.menu_item_id].push({
          ...review,
          family_member: review.family_members,
          photos: review.review_photos,
        });
      });

      setAllReviews(groupedAllReviews);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
    }
  }, []);

  const fetchRestaurantData = useCallback(async () => {
    try {
      console.log('Fetching restaurant data for ID:', params.id);
      setLoading(true);

      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', params.id)
        .single();

      console.log('Restaurant data:', restaurantData);
      console.log('Restaurant error:', restaurantError);

      if (restaurantError) {
        console.error('Restaurant fetch error:', restaurantError);
        throw restaurantError;
      }
      
      if (!restaurantData) {
        console.log('No restaurant found with ID:', params.id);
        setRestaurant(null);
        setLoading(false);
        return;
      }
      
      setRestaurant(restaurantData);

      // Fetch menu items with ratings
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select(`
          *,
          ratings (
            id,
            user_id,
            rating,
            family_member_id,
            notes,
            created_at,
            updated_at
          )
        `)
        .eq('restaurant_id', params.id)
        .order('category, name');

      console.log('Menu data:', menuData);
      console.log('Menu error:', menuError);

      if (menuError) {
        console.error('Menu fetch error:', menuError);
        throw menuError;
      }

      // Calculate average ratings for each menu item
      const menuItemsWithAverage = (menuData || []).map((item: any) => ({
        ...item,
        average_rating: item.ratings.length > 0
          ? item.ratings.reduce((sum: number, rating: any) => sum + rating.rating, 0) / item.ratings.length
          : 0,
      }));

      setMenuItems(menuItemsWithAverage);

      // Fetch all reviews for all menu items (from all users)
      await fetchAllReviews(menuItemsWithAverage);

      // If user is logged in, fetch their ratings and family members
      if (user) {
        await fetchUserData(menuItemsWithAverage);
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  }, [params.id, user]);

  useEffect(() => {
    fetchRestaurantData();
  }, [fetchRestaurantData]);

  const handleRate = async (ratingData: CreateRating) => {
    if (!user) {
      toast.error('Please sign in to rate items');
      return;
    }

    try {
      // Handle photo uploads first if any
      // Note: In a real implementation, you'd upload to cloud storage
      // For now, we'll skip photos and just handle the basic rating
      
      const { error } = await supabase
        .from('ratings')
        .insert({
          user_id: user.id,
          menu_item_id: ratingData.menu_item_id,
          rating: ratingData.rating,
          family_member_id: ratingData.family_member_id || null,
          notes: ratingData.notes || null,
          review_text: ratingData.review_text || null,
        });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      fetchRestaurantData(); // Refresh data
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit review');
    }
  };

  const handleUpdateRating = async (ratingId: string, newRating: number, reviewText?: string) => {
    try {
      const updateData: any = { rating: newRating };
      if (reviewText !== undefined) {
        updateData.review_text = reviewText;
      }

      const { error } = await supabase
        .from('ratings')
        .update(updateData)
        .eq('id', ratingId);

      if (error) throw error;

      toast.success('Rating updated successfully!');
      fetchRestaurantData(); // Refresh data
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating');
    }
  };

  const handleDeleteRating = async (ratingId: string) => {
    try {
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('id', ratingId);

      if (error) throw error;

      toast.success('Rating deleted successfully!');
      fetchRestaurantData(); // Refresh data
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('Failed to delete rating');
    }
  };

  const handleHelpfulVote = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast.error('Please sign in to vote on reviews');
      return;
    }

    try {
      // For now, just show a message. In a real implementation, 
      // this would call the /api/reviews/vote endpoint
      toast.success(`Marked review as ${isHelpful ? 'helpful' : 'not helpful'}`);
      console.log('Vote on review:', reviewId, isHelpful);
    } catch (error) {
      console.error('Error voting on review:', error);
      toast.error('Failed to vote on review');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant not found</h1>
          <p className="text-gray-600">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Group menu items by category
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItemWithRatings[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Restaurant Header */}
      <Card className="mb-8">
        <div className="relative h-64 w-full">
          {!imageError ? (
            <Image
              src={restaurant.image_url || '/placeholder-restaurant.jpg'}
              alt={restaurant.name}
              fill
              className="object-cover rounded-t-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-lg">
              <span className="text-gray-500">Image not available</span>
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
          {restaurant.description && (
            <p className="text-gray-600">{restaurant.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {restaurant.address && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span>{restaurant.address}</span>
              </div>
            )}
            
            {restaurant.phone && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-5 w-5" />
                <span>{restaurant.phone}</span>
              </div>
            )}
            
            {restaurant.website && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Globe className="h-5 w-5" />
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>
          
          {restaurant.cuisine_type && (
            <div className="mt-4">
              <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                {restaurant.cuisine_type}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restaurant Characteristics */}
      <RestaurantCharacteristics 
        restaurantId={restaurant.id}
        onRatingSubmitted={fetchRestaurantData}
      />

      {/* Menu Items */}
      <div className="space-y-8">
        {/* Menu Search and Filters */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>
          <MenuSearch
            onSearch={handleMenuSearch}
            onFilterChange={handleMenuFilterChange}
            filters={menuFilters}
          />
        </div>

        {filteredMenuItems.length === 0 && menuItems.length > 0 ? (
          <div className="text-center py-8 text-gray-500">
            {menuFilters.searchQuery.trim() || menuFilters.category !== 'All Categories' ? (
              <div>
                <p className="text-lg">No menu items match your current filters.</p>
                <button
                  onClick={() => setMenuFilters({
                    searchQuery: '',
                    category: 'All Categories',
                    sortBy: 'name',
                    sortOrder: 'asc',
                    priceRange: null
                  })}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <p className="text-lg">No menu items found.</p>
            )}
          </div>
        ) : (
          // Group filtered menu items by category
          Object.entries(
            filteredMenuItems.reduce((acc, item) => {
              const category = item.category || 'Other';
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push(item);
              return acc;
            }, {} as Record<string, MenuItemWithRatings[]>)
          ).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    menuItem={item}
                    userRatings={userRatings[item.id] || []}
                    allReviews={allReviews[item.id] || []}
                    familyMembers={familyMembers}
                    onRate={handleRate}
                    onUpdateRating={handleUpdateRating}
                    onDeleteRating={handleDeleteRating}
                    onFamilyMemberAdded={fetchRestaurantData}
                    onHelpfulVote={handleHelpfulVote}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No menu items found
          </h3>
          <p className="text-gray-600">
            This restaurant hasn't added their menu yet.
          </p>
        </div>
      )}
    </div>
  );
}