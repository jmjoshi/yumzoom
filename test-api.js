// Test script to check the restaurant characteristics API
const restaurantId = '190c3017-c74e-4a77-801e-4a69104496ad';

async function testAPI() {
  try {
    console.log('Testing GET API...');
    const response = await fetch(`http://localhost:3003/api/restaurants/${restaurantId}/characteristics`);
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.restaurant) {
      console.log('Restaurant characteristics:', data.restaurant.characteristics);
      console.log('User ratings count:', data.user_ratings?.length || 0);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();
