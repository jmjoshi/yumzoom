import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CuisineTranslation {
  id: string;
  cuisine_id: string;
  locale: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTranslation {
  id: string;
  restaurant_id: string;
  locale: string;
  name: string;
  description?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewTranslation {
  id: string;
  review_id: string;
  locale: string;
  title?: string;
  content: string;
  translated_by: 'auto' | 'human';
  created_at: string;
}

/**
 * Get cuisine translation for a specific locale
 */
export async function getCuisineTranslation(
  cuisineId: string,
  locale: string
): Promise<CuisineTranslation | null> {
  try {
    const { data, error } = await supabase
      .from('cuisine_translations')
      .select('*')
      .eq('cuisine_id', cuisineId)
      .eq('locale', locale)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching cuisine translation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCuisineTranslation:', error);
    return null;
  }
}

/**
 * Get restaurant translation for a specific locale
 */
export async function getRestaurantTranslation(
  restaurantId: string,
  locale: string
): Promise<RestaurantTranslation | null> {
  try {
    const { data, error } = await supabase
      .from('restaurant_translations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('locale', locale)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching restaurant translation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getRestaurantTranslation:', error);
    return null;
  }
}

/**
 * Get review translation for a specific locale
 */
export async function getReviewTranslation(
  reviewId: string,
  locale: string
): Promise<ReviewTranslation | null> {
  try {
    const { data, error } = await supabase
      .from('review_translations')
      .select('*')
      .eq('review_id', reviewId)
      .eq('locale', locale)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching review translation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getReviewTranslation:', error);
    return null;
  }
}

/**
 * Create or update cuisine translation
 */
export async function upsertCuisineTranslation(
  translation: Omit<CuisineTranslation, 'id' | 'created_at' | 'updated_at'>
): Promise<CuisineTranslation | null> {
  try {
    const { data, error } = await supabase
      .from('cuisine_translations')
      .upsert(
        {
          ...translation,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'cuisine_id,locale',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting cuisine translation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertCuisineTranslation:', error);
    return null;
  }
}

/**
 * Create or update restaurant translation
 */
export async function upsertRestaurantTranslation(
  translation: Omit<RestaurantTranslation, 'id' | 'created_at' | 'updated_at'>
): Promise<RestaurantTranslation | null> {
  try {
    const { data, error } = await supabase
      .from('restaurant_translations')
      .upsert(
        {
          ...translation,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'restaurant_id,locale',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting restaurant translation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertRestaurantTranslation:', error);
    return null;
  }
}

/**
 * Create review translation
 */
export async function createReviewTranslation(
  translation: Omit<ReviewTranslation, 'id' | 'created_at'>
): Promise<ReviewTranslation | null> {
  try {
    const { data, error } = await supabase
      .from('review_translations')
      .insert({
        ...translation,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review translation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createReviewTranslation:', error);
    return null;
  }
}

/**
 * Auto-translate text using browser's translation API or external service
 */
export async function autoTranslateText(
  text: string,
  fromLocale: string,
  toLocale: string
): Promise<string | null> {
  // For demo purposes, we'll simulate translation
  // In production, integrate with Google Translate API, AWS Translate, or similar
  
  try {
    // This is a placeholder for actual translation service
    // You would implement actual translation logic here
    console.log(`Translating from ${fromLocale} to ${toLocale}:`, text);
    
    // Return original text for now - implement actual translation service
    return text;
  } catch (error) {
    console.error('Error in autoTranslateText:', error);
    return null;
  }
}

/**
 * Get all available translations for a restaurant
 */
export async function getRestaurantTranslations(
  restaurantId: string
): Promise<RestaurantTranslation[]> {
  try {
    const { data, error } = await supabase
      .from('restaurant_translations')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Error fetching restaurant translations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRestaurantTranslations:', error);
    return [];
  }
}

/**
 * Get all available translations for a review
 */
export async function getReviewTranslations(
  reviewId: string
): Promise<ReviewTranslation[]> {
  try {
    const { data, error } = await supabase
      .from('review_translations')
      .select('*')
      .eq('review_id', reviewId);

    if (error) {
      console.error('Error fetching review translations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReviewTranslations:', error);
    return [];
  }
}
