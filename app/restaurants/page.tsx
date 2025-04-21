'use client';

import { useState } from 'react';
import { restaurants } from '@/data/restaurants';
import { Restaurant } from '@/types/restaurant';

export default function RestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<'' | '$' | '$$' | '$$$' | '$$$$'>('');

  const cuisineTypes = Array.from(new Set(restaurants.map((r: Restaurant) => r.cuisineType))) as string[];
  const priceRanges: ('$' | '$$' | '$$$' | '$$$$')[] = ['$', '$$', '$$$', '$$$$'];

  const filteredRestaurants = restaurants.filter((restaurant: Restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = !selectedCuisine || restaurant.cuisineType === selectedCuisine;
    const matchesPrice = !selectedPrice || restaurant.priceRange === selectedPrice;
    return matchesSearch && matchesCuisine && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-orange-600 mb-8">Restaurants</h1>
        
        {/* Search and Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:gap-4">
          <input
            type="text"
            placeholder="Search restaurants..."
            className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select
            className="w-full md:w-1/4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500"
            value={selectedCuisine}
            onChange={(e) => setSelectedCuisine(e.target.value)}
          >
            <option value="">All Cuisines</option>
            {cuisineTypes.map((cuisine: string) => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>

          <select
            className="w-full md:w-1/4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500"
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value as '' | '$' | '$$' | '$$$' | '$$$$')}
          >
            <option value="">All Prices</option>
            {priceRanges.map((price) => (
              <option key={price} value={price}>{price}</option>
            ))}
          </select>
        </div>

        {/* Restaurant List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant: Restaurant) => (
            <div key={restaurant.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">{restaurant.name}</h2>
              <p className="text-gray-600 mb-2">{restaurant.cuisineType} • {restaurant.priceRange} • {restaurant.location}</p>
              <p className="text-gray-500 mb-4">{restaurant.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {restaurant.tags.map((tag: string) => (
                  <span key={tag} className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-600">⭐ {restaurant.rating}</span>
                <button className="bg-orange-600 text-white px-4 py-2 rounded-full hover:bg-orange-700 transition-colors">
                  View Menu
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No restaurants found matching your criteria
          </div>
        )}
      </main>
    </div>
  );
}