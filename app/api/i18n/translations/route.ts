import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const type = searchParams.get('type'); // 'restaurant', 'cuisine', 'review'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and id' },
        { status: 400 }
      );
    }

    let tableName: string;
    let data = null;

    switch (type) {
      case 'restaurant':
        tableName = 'restaurant_translations';
        const { data: restaurantData, error: restaurantError } = await supabase
          .from(tableName)
          .select('*')
          .eq('restaurant_id', id)
          .eq('locale', locale)
          .single();

        if (restaurantError && restaurantError.code !== 'PGRST116') {
          throw restaurantError;
        }
        data = restaurantData;
        break;

      case 'cuisine':
        tableName = 'cuisine_translations';
        const { data: cuisineData, error: cuisineError } = await supabase
          .from(tableName)
          .select('*')
          .eq('cuisine_id', id)
          .eq('locale', locale)
          .single();

        if (cuisineError && cuisineError.code !== 'PGRST116') {
          throw cuisineError;
        }
        data = cuisineData;
        break;

      case 'review':
        tableName = 'review_translations';
        const { data: reviewData, error: reviewError } = await supabase
          .from(tableName)
          .select('*')
          .eq('review_id', id)
          .eq('locale', locale)
          .single();

        if (reviewError && reviewError.code !== 'PGRST116') {
          throw reviewError;
        }
        data = reviewData;
        break;

      case 'menu_item':
        tableName = 'menu_item_translations';
        const { data: menuData, error: menuError } = await supabase
          .from(tableName)
          .select('*')
          .eq('menu_item_id', id)
          .eq('locale', locale)
          .single();

        if (menuError && menuError.code !== 'PGRST116') {
          throw menuError;
        }
        data = menuData;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be restaurant, cuisine, review, or menu_item' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      locale,
      type,
      id
    });

  } catch (error) {
    console.error('Error fetching translation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, contentId, locale, translation, translatedBy = 'human' } = body;

    if (!type || !contentId || !locale || !translation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let tableName: string;
    let columnName: string;
    let insertData: any;

    switch (type) {
      case 'restaurant':
        tableName = 'restaurant_translations';
        columnName = 'restaurant_id';
        insertData = {
          restaurant_id: contentId,
          locale,
          name: translation.name,
          description: translation.description,
          address: translation.address,
        };
        break;

      case 'cuisine':
        tableName = 'cuisine_translations';
        columnName = 'cuisine_id';
        insertData = {
          cuisine_id: contentId,
          locale,
          name: translation.name,
          description: translation.description,
        };
        break;

      case 'review':
        tableName = 'review_translations';
        columnName = 'review_id';
        insertData = {
          review_id: contentId,
          locale,
          title: translation.title,
          content: translation.content,
          translated_by: translatedBy,
        };
        break;

      case 'menu_item':
        tableName = 'menu_item_translations';
        columnName = 'menu_item_id';
        insertData = {
          menu_item_id: contentId,
          locale,
          name: translation.name,
          description: translation.description,
          ingredients: translation.ingredients,
          allergen_info: translation.allergenInfo,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from(tableName)
      .upsert(insertData, { onConflict: `${columnName},locale` })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('Error creating translation:', error);
    return NextResponse.json(
      { error: 'Failed to create translation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, contentId, locale, translation } = body;

    if (!type || !contentId || !locale || !translation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let tableName: string;
    let columnName: string;
    let updateData: any;

    switch (type) {
      case 'restaurant':
        tableName = 'restaurant_translations';
        columnName = 'restaurant_id';
        updateData = {
          name: translation.name,
          description: translation.description,
          address: translation.address,
          updated_at: new Date().toISOString(),
        };
        break;

      case 'cuisine':
        tableName = 'cuisine_translations';
        columnName = 'cuisine_id';
        updateData = {
          name: translation.name,
          description: translation.description,
          updated_at: new Date().toISOString(),
        };
        break;

      case 'review':
        tableName = 'review_translations';
        columnName = 'review_id';
        updateData = {
          title: translation.title,
          content: translation.content,
        };
        break;

      case 'menu_item':
        tableName = 'menu_item_translations';
        columnName = 'menu_item_id';
        updateData = {
          name: translation.name,
          description: translation.description,
          ingredients: translation.ingredients,
          allergen_info: translation.allergenInfo,
          updated_at: new Date().toISOString(),
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq(columnName, contentId)
      .eq('locale', locale)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('Error updating translation:', error);
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    );
  }
}
