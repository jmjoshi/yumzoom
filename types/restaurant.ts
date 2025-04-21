export type Restaurant = {
  id: string;
  name: string;
  cuisineType: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  location: string;
  image?: string;
  description: string;
  tags: string[];
};