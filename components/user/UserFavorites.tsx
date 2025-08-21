'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  UserFavoriteRestaurant, 
  CreateUserFavoriteRestaurant, 
  EnhancedFamilyMember 
} from '@/types/user';
import { PRIORITY_LEVELS, RESTAURANT_TAGS, DINING_OCCASIONS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  Heart, 
  Star, 
  Clock, 
  MapPin, 
  Edit, 
  Trash2, 
  Plus, 
  BookmarkPlus,
  User,
  Tag
} from 'lucide-react';

interface UserFavoritesProps {
  showWishlist?: boolean;
}

export default function UserFavorites({ showWishlist = false }: UserFavoritesProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<UserFavoriteRestaurant[]>([]);
  const [familyMembers, setFamilyMembers] = useState<EnhancedFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<UserFavoriteRestaurant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByMember, setFilterByMember] = useState<string>('all');
  const [filterByPriority, setFilterByPriority] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateUserFavoriteRestaurant>({
    restaurant_id: '',
    family_member_id: '',
    notes: '',
    tags: [],
    is_wishlist: showWishlist,
    priority_level: 3,
    occasion_suitable: [],
  });

  const fetchFavorites = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          restaurant:restaurants (
            id,
            name,
            cuisine_type,
            image_url,
            address
          ),
          family_member:family_members (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_wishlist', showWishlist)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error(`Failed to load ${showWishlist ? 'wishlist' : 'favorites'}`);
    } finally {
      setLoading(false);
    }
  }, [user, showWishlist]);

  const fetchFamilyMembers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchFamilyMembers();
    }
  }, [user, fetchFavorites, fetchFamilyMembers]);

  const handleAddToFavorites = async (restaurantId: string) => {
    if (!user) return;

    try {
      const favoriteData: CreateUserFavoriteRestaurant = {
        ...formData,
        restaurant_id: restaurantId,
      };

      const { error } = await supabase
        .from('user_favorites')
        .insert({
          ...favoriteData,
          user_id: user.id,
          family_member_id: favoriteData.family_member_id || null,
        });

      if (error) throw error;

      toast.success(`Restaurant added to ${showWishlist ? 'wishlist' : 'favorites'}!`);
      fetchFavorites();
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error(`Failed to add to ${showWishlist ? 'wishlist' : 'favorites'}`);
    }
  };

  const handleUpdateFavorite = async (favorite: UserFavoriteRestaurant) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .update({
          notes: formData.notes,
          tags: formData.tags,
          priority_level: formData.priority_level,
          occasion_suitable: formData.occasion_suitable,
        })
        .eq('id', favorite.id);

      if (error) throw error;

      toast.success('Favorite updated successfully!');
      fetchFavorites();
      setEditingFavorite(null);
      resetForm();
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const handleDeleteFavorite = async (favoriteId: string) => {
    if (!confirm(`Are you sure you want to remove this from your ${showWishlist ? 'wishlist' : 'favorites'}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      toast.success(`Removed from ${showWishlist ? 'wishlist' : 'favorites'}!`);
      fetchFavorites();
    } catch (error) {
      console.error('Error deleting favorite:', error);
      toast.error(`Failed to remove from ${showWishlist ? 'wishlist' : 'favorites'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      restaurant_id: '',
      family_member_id: '',
      notes: '',
      tags: [],
      is_wishlist: showWishlist,
      priority_level: 3,
      occasion_suitable: [],
    });
  };

  const handleEditFavorite = (favorite: UserFavoriteRestaurant) => {
    setEditingFavorite(favorite);
    setFormData({
      restaurant_id: favorite.restaurant_id,
      family_member_id: favorite.family_member_id || '',
      notes: favorite.notes || '',
      tags: favorite.tags || [],
      is_wishlist: favorite.is_wishlist,
      priority_level: favorite.priority_level,
      occasion_suitable: favorite.occasion_suitable || [],
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = formData.tags || [];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    setFormData(prev => ({ ...prev, tags: updatedTags }));
  };

  const handleOccasionToggle = (occasion: string) => {
    const currentOccasions = formData.occasion_suitable || [];
    const updatedOccasions = currentOccasions.includes(occasion)
      ? currentOccasions.filter(o => o !== occasion)
      : [...currentOccasions, occasion];
    
    setFormData(prev => ({ ...prev, occasion_suitable: updatedOccasions }));
  };

  const filteredFavorites = favorites.filter(favorite => {
    const matchesSearch = favorite.restaurant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMember = filterByMember === 'all' || favorite.family_member_id === filterByMember;
    const matchesPriority = filterByPriority === null || favorite.priority_level === filterByPriority;
    
    return matchesSearch && matchesMember && matchesPriority;
  });

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-gray-500';
      case 2: return 'text-blue-500';
      case 3: return 'text-green-500';
      case 4: return 'text-orange-500';
      case 5: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityLabel = (priority: number) => {
    return PRIORITY_LEVELS.find(p => p.value === priority)?.label || 'Medium';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {showWishlist ? (
            <>
              <BookmarkPlus className="inline h-8 w-8 mr-2" />
              Restaurant Wishlist
            </>
          ) : (
            <>
              <Heart className="inline h-8 w-8 mr-2" />
              Favorite Restaurants
            </>
          )}
        </h1>
        <p className="text-lg text-gray-600">
          {showWishlist 
            ? 'Track restaurants you want to try and plan future dining experiences.'
            : 'Your saved favorite restaurants for easy access and sharing.'
          }
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={filterByMember}
          onChange={(e) => setFilterByMember(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Family Members</option>
          <option value="">Personal Favorites</option>
          {familyMembers.map(member => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>

        <select
          value={filterByPriority || ''}
          onChange={(e) => setFilterByPriority(e.target.value ? parseInt(e.target.value) : null)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Priorities</option>
          {PRIORITY_LEVELS.map(level => (
            <option key={level.value} value={level.value}>{level.label}</option>
          ))}
        </select>

        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add {showWishlist ? 'to Wishlist' : 'Favorite'}
        </Button>
      </div>

      {/* Favorites List */}
      <div className="space-y-4">
        {filteredFavorites.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              {showWishlist ? (
                <BookmarkPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              ) : (
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {showWishlist ? 'wishlist items' : 'favorites'} yet
              </h3>
              <p className="text-gray-500 mb-4">
                {showWishlist 
                  ? 'Add restaurants you want to try to your wishlist.'
                  : 'Save your favorite restaurants for easy access.'
                }
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First {showWishlist ? 'Wishlist Item' : 'Favorite'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredFavorites.map((favorite) => (
            <Card key={favorite.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {favorite.restaurant?.image_url && (
                        <img
                          src={favorite.restaurant.image_url}
                          alt={favorite.restaurant.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {favorite.restaurant?.name}
                        </h3>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>{favorite.restaurant?.cuisine_type}</span>
                          {favorite.restaurant?.address && (
                            <>
                              <span>•</span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {favorite.restaurant.address}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 mt-2">
                          <div className={`flex items-center ${getPriorityColor(favorite.priority_level)}`}>
                            <Star className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">
                              {getPriorityLabel(favorite.priority_level)} Priority
                            </span>
                          </div>

                          {favorite.family_member && (
                            <div className="flex items-center text-gray-600">
                              <User className="h-4 w-4 mr-1" />
                              <span className="text-sm">{favorite.family_member.name}</span>
                            </div>
                          )}
                        </div>

                        {favorite.tags && favorite.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {favorite.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {favorite.notes && (
                          <p className="text-gray-600 mt-2 text-sm">{favorite.notes}</p>
                        )}

                        {favorite.occasion_suitable && favorite.occasion_suitable.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Good for: </span>
                            <span className="text-xs text-gray-700">
                              {favorite.occasion_suitable.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFavorite(favorite)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFavorite(favorite.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
