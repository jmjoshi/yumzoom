'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useEnhancedProfile } from '@/hooks/useEnhancedProfile';
import { CreateWishlist, CreateWishlistItem } from '@/types/enhanced-profile';
import { 
  Plus, 
  BookmarkPlus, 
  Users, 
  Lock, 
  Globe, 
  Star, 
  Calendar, 
  MapPin, 
  Clock,
  Edit,
  Trash2,
  Share,
  Heart,
  Target,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_LEVELS = [
  { value: 1, label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 2, label: 'Medium-Low', color: 'bg-blue-100 text-blue-800' },
  { value: 3, label: 'Medium', color: 'bg-green-100 text-green-800' },
  { value: 4, label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 5, label: 'Critical', color: 'bg-red-100 text-red-800' }
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Want to Try', color: 'bg-blue-100 text-blue-800' },
  { value: 'visited', label: 'Visited', color: 'bg-green-100 text-green-800' },
  { value: 'removed', label: 'Not Interested', color: 'bg-gray-100 text-gray-800' }
];

export default function WishlistManager() {
  const { 
    wishlists, 
    createWishlist, 
    addToWishlist, 
    refetch 
  } = useEnhancedProfile();
  
  const [showCreateWishlist, setShowCreateWishlist] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState<string | null>(null);
  const [expandedWishlist, setExpandedWishlist] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<number | null>(null);

  const [wishlistForm, setWishlistForm] = useState<CreateWishlist>({
    name: '',
    description: '',
    is_public: false,
    is_collaborative: false
  });

  const [restaurantForm, setRestaurantForm] = useState<CreateWishlistItem>({
    restaurant_id: '',
    priority_level: 3,
    notes: '',
    target_occasion: '',
    estimated_visit_date: ''
  });

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wishlistForm.name.trim()) {
      toast.error('Please enter a wishlist name');
      return;
    }

    try {
      await createWishlist(wishlistForm);
      setShowCreateWishlist(false);
      setWishlistForm({
        name: '',
        description: '',
        is_public: false,
        is_collaborative: false
      });
    } catch (error) {
      console.error('Error creating wishlist:', error);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent, wishlistId: string) => {
    e.preventDefault();
    
    if (!restaurantForm.restaurant_id) {
      toast.error('Please select a restaurant');
      return;
    }

    try {
      await addToWishlist(wishlistId, restaurantForm);
      setShowAddRestaurant(null);
      setRestaurantForm({
        restaurant_id: '',
        priority_level: 3,
        notes: '',
        target_occasion: '',
        estimated_visit_date: ''
      });
    } catch (error) {
      console.error('Error adding restaurant:', error);
    }
  };

  const getPriorityLabel = (priority: number) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[2];
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const filterWishlistItems = (items: any[]) => {
    return items.filter(item => {
      const statusMatch = filterStatus === 'all' || item.status === filterStatus;
      const priorityMatch = filterPriority === null || item.priority_level === filterPriority;
      return statusMatch && priorityMatch;
    });
  };

  const getWishlistStats = (items: any[]) => {
    const total = items.length;
    const pending = items.filter(i => i.status === 'pending').length;
    const visited = items.filter(i => i.status === 'visited').length;
    const highPriority = items.filter(i => i.priority_level >= 4).length;
    
    return { total, pending, visited, highPriority };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wishlist Manager</h2>
          <p className="text-gray-600">
            Organize restaurants you want to try and track your dining goals
          </p>
        </div>
        <Button onClick={() => setShowCreateWishlist(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Wishlist
        </Button>
      </div>

      {/* Create Wishlist Form */}
      {showCreateWishlist && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Wishlist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWishlist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wishlist Name
                </label>
                <Input
                  value={wishlistForm.name}
                  onChange={(e) => setWishlistForm(prev => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))}
                  placeholder="e.g., Date Night Spots, Family Favorites"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={wishlistForm.description || ''}
                  onChange={(e) => setWishlistForm(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="Describe what this wishlist is for..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={wishlistForm.is_public}
                    onChange={(e) => setWishlistForm(prev => ({ 
                      ...prev, 
                      is_public: e.target.checked 
                    }))}
                    className="mr-2"
                  />
                  <Globe className="h-4 w-4 mr-1" />
                  Make Public
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={wishlistForm.is_collaborative}
                    onChange={(e) => setWishlistForm(prev => ({ 
                      ...prev, 
                      is_collaborative: e.target.checked 
                    }))}
                    className="mr-2"
                  />
                  <Users className="h-4 w-4 mr-1" />
                  Allow Collaboration
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateWishlist(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Wishlist
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {wishlists.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <select
                value={filterPriority || ''}
                onChange={(e) => setFilterPriority(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">All Priorities</option>
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wishlists */}
      <div className="space-y-6">
        {wishlists.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookmarkPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No wishlists yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first wishlist to start organizing restaurants you want to try
              </p>
              <Button onClick={() => setShowCreateWishlist(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Wishlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          wishlists.map((wishlist) => {
            const items = wishlist.wishlist_items || [];
            const filteredItems = filterWishlistItems(items);
            const stats = getWishlistStats(items);
            const isExpanded = expandedWishlist === wishlist.id;

            return (
              <Card key={wishlist.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-xl">{wishlist.name}</CardTitle>
                        {wishlist.is_public && (
                          <Badge variant="outline">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        )}
                        {wishlist.is_collaborative && (
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            Collaborative
                          </Badge>
                        )}
                      </div>
                      
                      {wishlist.description && (
                        <CardDescription>{wishlist.description}</CardDescription>
                      )}

                      {/* Stats */}
                      <div className="flex space-x-4 mt-3 text-sm text-gray-600">
                        <span>{stats.total} restaurants</span>
                        <span>{stats.pending} pending</span>
                        <span>{stats.visited} visited</span>
                        <span>{stats.highPriority} high priority</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddRestaurant(wishlist.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedWishlist(
                          isExpanded ? null : wishlist.id
                        )}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Add Restaurant Form */}
                {showAddRestaurant === wishlist.id && (
                  <CardContent className="border-t">
                    <form 
                      onSubmit={(e) => handleAddRestaurant(e, wishlist.id)} 
                      className="space-y-4"
                    >
                      <h4 className="font-medium text-gray-900">Add Restaurant to Wishlist</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Restaurant
                          </label>
                          <Input
                            value={restaurantForm.restaurant_id}
                            onChange={(e) => setRestaurantForm(prev => ({ 
                              ...prev, 
                              restaurant_id: e.target.value 
                            }))}
                            placeholder="Search for a restaurant..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority Level
                          </label>
                          <select
                            value={restaurantForm.priority_level}
                            onChange={(e) => setRestaurantForm(prev => ({ 
                              ...prev, 
                              priority_level: parseInt(e.target.value) 
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {PRIORITY_LEVELS.map(level => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Occasion
                          </label>
                          <Input
                            value={restaurantForm.target_occasion || ''}
                            onChange={(e) => setRestaurantForm(prev => ({ 
                              ...prev, 
                              target_occasion: e.target.value 
                            }))}
                            placeholder="e.g., Date night, Birthday"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Visit Date
                          </label>
                          <Input
                            type="date"
                            value={restaurantForm.estimated_visit_date || ''}
                            onChange={(e) => setRestaurantForm(prev => ({ 
                              ...prev, 
                              estimated_visit_date: e.target.value 
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={restaurantForm.notes || ''}
                          onChange={(e) => setRestaurantForm(prev => ({ 
                            ...prev, 
                            notes: e.target.value 
                          }))}
                          placeholder="Why do you want to try this restaurant?"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowAddRestaurant(null)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          Add Restaurant
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                )}

                {/* Wishlist Items */}
                {isExpanded && (
                  <CardContent className="border-t">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {items.length === 0 
                          ? 'No restaurants in this wishlist yet'
                          : 'No restaurants match the current filters'
                        }
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredItems.map((item) => {
                          const priorityInfo = getPriorityLabel(item.priority_level);
                          const statusInfo = getStatusLabel(item.status);

                          return (
                            <div 
                              key={item.id} 
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-medium text-gray-900">
                                      {item.restaurant?.name || 'Unknown Restaurant'}
                                    </h4>
                                    <Badge className={statusInfo.color}>
                                      {statusInfo.label}
                                    </Badge>
                                    <Badge className={priorityInfo.color}>
                                      {priorityInfo.label}
                                    </Badge>
                                  </div>

                                  <div className="space-y-1 text-sm text-gray-600">
                                    {item.restaurant?.cuisine_type && (
                                      <div className="flex items-center">
                                        <Star className="h-4 w-4 mr-1" />
                                        {item.restaurant.cuisine_type}
                                      </div>
                                    )}
                                    
                                    {item.restaurant?.address && (
                                      <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {item.restaurant.address}
                                      </div>
                                    )}

                                    {item.target_occasion && (
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        For: {item.target_occasion}
                                      </div>
                                    )}

                                    {item.estimated_visit_date && (
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        Target: {new Date(item.estimated_visit_date).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>

                                  {item.notes && (
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                      "{item.notes}"
                                    </p>
                                  )}

                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                    <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                                    {item.votes > 0 && (
                                      <span className="flex items-center">
                                        <Heart className="h-3 w-3 mr-1" />
                                        {item.votes} votes
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex space-x-2 ml-4">
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
