'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Restaurant, MenuItem } from '@/types/restaurant';
import { MENU_CATEGORIES } from '@/lib/constants';
import { Plus, Edit, Trash2, ArrowLeft, UtensilsCrossed, DollarSign, History } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
}

const initialForm: MenuItemForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  image_url: '',
};

export default function AdminMenuItemsPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchRestaurantAndMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('category, name');

      if (menuError) throw menuError;
      setMenuItems(menuData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantAndMenuItems();
    }
  }, [restaurantId, fetchRestaurantAndMenuItems]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Menu item name is required';
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof MenuItemForm, value: string) => {
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
      const menuItemData = {
        restaurant_id: restaurantId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        category: formData.category || null,
        image_url: formData.image_url.trim() || null,
      };

      if (editingMenuItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', editingMenuItem.id);

        if (error) throw error;
        toast.success('Menu item updated successfully!');
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(menuItemData);

        if (error) throw error;
        toast.success('Menu item added successfully!');
      }

      setFormData(initialForm);
      setShowForm(false);
      setEditingMenuItem(null);
      fetchRestaurantAndMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (menuItem: MenuItem) => {
    setEditingMenuItem(menuItem);
    setFormData({
      name: menuItem.name,
      description: menuItem.description || '',
      price: menuItem.price ? menuItem.price.toString() : '',
      category: menuItem.category || '',
      image_url: menuItem.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (menuItemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item? This will also delete all ratings for this item.')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', menuItemId);

      if (error) throw error;
      toast.success('Menu item deleted successfully!');
      fetchRestaurantAndMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setShowForm(false);
    setEditingMenuItem(null);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
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
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Restaurant Not Found
          </h1>
          <Link href="/admin/restaurants">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurants
            </Button>
          </Link>
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
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/admin/restaurants">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurants
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Menu Items - {restaurant.name}
        </h1>
        <p className="text-gray-600">
          Manage menu items for {restaurant.name}. Add, edit, and organize dishes by category.
        </p>
      </div>

      {!showForm && (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      )}

      {/* Menu Item Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </CardTitle>
            <CardDescription>
              Fill in the menu item details. Item name is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Item Name *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Spaghetti Carbonara"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select category</option>
                    {MENU_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Fresh pasta with creamy sauce, pancetta, and parmesan..."
                multiline
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Price ($)"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  error={errors.price}
                  placeholder="18.99"
                />
                
                <Input
                  label="Image URL"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  placeholder="https://example.com/dish-image.jpg"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? 'Saving...' : editingMenuItem ? 'Update Menu Item' : 'Add Menu Item'}
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

      {/* Menu Items List */}
      {Object.keys(groupedMenuItems).length === 0 ? (
        <div className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No menu items yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add your first menu item to get started.
          </p>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMenuItems).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((menuItem) => (
                  <Card key={menuItem.id} className="overflow-hidden">
                    {menuItem.image_url && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={menuItem.image_url}
                          alt={menuItem.name}
                          fill
                          className="object-cover"
                          onError={() => {
                            // Handle image error
                          }}
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {menuItem.name}
                          </h3>
                          {menuItem.price && (
                            <div className="flex items-center text-green-600 font-medium">
                              <DollarSign className="h-4 w-4" />
                              <span>{menuItem.price.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {menuItem.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {menuItem.description}
                        </p>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/versioning?contentType=menu_item&contentId=${menuItem.id}`}
                          className="flex-1"
                        >
                          <History className="h-4 w-4 mr-1" />
                          Version History
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(menuItem)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(menuItem.id)}
                          className="text-red-600 hover:text-red-800 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
