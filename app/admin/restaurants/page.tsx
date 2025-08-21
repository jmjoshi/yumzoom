'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Restaurant } from '@/types/restaurant';
import { CUISINE_TYPES } from '@/lib/constants';
import { Plus, Edit, Trash2, Building, MapPin, Phone, Globe, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface RestaurantForm {
  name: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  cuisine_type: string;
  image_url: string;
}

const initialForm: RestaurantForm = {
  name: '',
  description: '',
  address: '',
  phone: '',
  website: '',
  cuisine_type: '',
  image_url: '',
};

export default function AdminRestaurantsPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<RestaurantForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (restaurantId: string) => {
    setImageErrors(prev => new Set([...prev, restaurantId]));
  };

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Restaurant name is required';
    }

    if (!formData.cuisine_type) {
      newErrors.cuisine_type = 'Cuisine type is required';
    }

    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof RestaurantForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const restaurantData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        cuisine_type: formData.cuisine_type,
        image_url: formData.image_url.trim() || null,
      };

      if (editingRestaurant) {
        const { error } = await supabase
          .from('restaurants')
          .update(restaurantData)
          .eq('id', editingRestaurant.id);

        if (error) throw error;
        toast.success('Restaurant updated successfully!');
      } else {
        const { error } = await supabase
          .from('restaurants')
          .insert(restaurantData);

        if (error) throw error;
        toast.success('Restaurant added successfully!');
      }

      setFormData(initialForm);
      setShowForm(false);
      setEditingRestaurant(null);
      fetchRestaurants();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error('Failed to save restaurant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      description: restaurant.description || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      website: restaurant.website || '',
      cuisine_type: restaurant.cuisine_type || '',
      image_url: restaurant.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (restaurantId: string) => {
    if (!confirm('Are you sure you want to delete this restaurant? This will also delete all its menu items and ratings.')) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;
      toast.success('Restaurant deleted successfully!');
      fetchRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Failed to delete restaurant');
    }
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setShowForm(false);
    setEditingRestaurant(null);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Restaurant Management
        </h1>
        <p className="text-gray-600">
          Add, edit, and manage restaurants in the YumZoom platform.
        </p>
      </div>

      {!showForm && (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Restaurant
          </Button>
        </div>
      )}

      {/* Restaurant Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
            </CardTitle>
            <CardDescription>
              Fill in the restaurant details. Name and cuisine type are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Restaurant Name *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Mario's Italian Restaurant"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine Type *
                  </label>
                  <select
                    value={formData.cuisine_type}
                    onChange={(e) => handleChange('cuisine_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select cuisine type</option>
                    {CUISINE_TYPES.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                  {errors.cuisine_type && (
                    <p className="text-red-500 text-sm mt-1">{errors.cuisine_type}</p>
                  )}
                </div>
              </div>

              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Authentic Italian cuisine with fresh ingredients..."
                multiline
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Main Street, Downtown"
                />
                
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  error={errors.website}
                  placeholder="https://restaurant-website.com"
                />
                
                <Input
                  label="Image URL"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  placeholder="https://example.com/restaurant-image.jpg"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? 'Saving...' : editingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Restaurants List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No restaurants yet
            </h3>
            <p className="text-gray-500 mb-4">
              Add your first restaurant to get started.
            </p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            )}
          </div>
        ) : (
          restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden">
              {restaurant.image_url && !imageErrors.has(restaurant.id) ? (
                <div className="relative h-48 w-full">
                  <Image
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(restaurant.id)}
                  />
                </div>
              ) : (
                <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">No Image Available</p>
                  </div>
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {restaurant.name}
                    </h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      {restaurant.cuisine_type}
                    </span>
                  </div>
                </div>

                {restaurant.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {restaurant.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {restaurant.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 truncate"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/admin/restaurants/${restaurant.id}/menu-items`}
                    className="flex-1"
                  >
                    <UtensilsCrossed className="h-4 w-4 mr-1" />
                    Menu Items
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(restaurant)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(restaurant.id)}
                    className="text-red-600 hover:text-red-800 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
