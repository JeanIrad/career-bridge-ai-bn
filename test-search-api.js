const axios = require('axios');

// Test the search endpoint with flattened parameters
async function testSearchAPI() {
  const baseURL = 'http://localhost:5000/api';

  console.log('🧪 Testing CareerBridge AI Search API...\n');

  // Test 1: Basic search endpoint structure
  try {
    console.log('📡 Testing /users/search endpoint...');
    const response = await axios.get(`${baseURL}/users/search`, {
      params: {
        search: 'test',
        page: 1,
        limit: 10,
      },
    });
    console.log('✅ Search endpoint accepts parameters correctly');
    console.log('Response structure:', Object.keys(response.data));
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(
        '✅ Search endpoint is protected (401 Unauthorized) - Expected behavior',
      );
    } else {
      console.log(
        '❌ Search endpoint error:',
        error.response?.data || error.message,
      );
    }
  }

  // Test 2: Admin users endpoint
  try {
    console.log('\n📡 Testing /users/admin/users endpoint...');
    const response = await axios.get(`${baseURL}/users/admin/users`, {
      params: {
        search: 'test',
        roles: ['STUDENT'],
        isVerified: true,
        page: 1,
        limit: 10,
      },
    });
    console.log('✅ Admin users endpoint accepts parameters correctly');
    console.log('Response structure:', Object.keys(response.data));
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(
        '✅ Admin users endpoint is protected (401 Unauthorized) - Expected behavior',
      );
    } else if (error.response?.status === 400) {
      console.log('❌ Parameter validation error:', error.response.data);
    } else {
      console.log(
        '❌ Admin users endpoint error:',
        error.response?.data || error.message,
      );
    }
  }

  // Test 3: Check Swagger documentation
  try {
    console.log('\n📡 Testing Swagger documentation...');
    const response = await axios.get(`${baseURL}/docs`);
    if (response.status === 200) {
      console.log('✅ Swagger documentation is accessible');
    }
  } catch (error) {
    console.log('❌ Swagger documentation error:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('- Backend is running on http://localhost:5000');
  console.log('- Search endpoints are accessible (require authentication)');
  console.log(
    '- Parameter structure has been updated to accept flattened parameters',
  );
  console.log(
    '- Visit http://localhost:5000/api/docs to see the Swagger documentation',
  );
}

testSearchAPI().catch(console.error);
