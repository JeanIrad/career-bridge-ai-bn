const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test token (you might need to get a real one)
const TEST_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQwYTAwY2VlLWM5NGEtNDk0Yi1iNjYzLTI2MjZkZDFkMTAxZiIsImVtYWlsIjoiVHJlOTdAZ21haWwuY29tIiwicm9sZSI6IkVNUExPWUVSIiwiaWF0IjoxNzUwODI1MzI4LCJleHAiOjE3NTA4Mjg5MjgsImF1ZCI6IkNhcmVlckJyaWRnZS1Vc2VycyIsImlzcyI6IkNhcmVlckJyaWRnZSJ9.ixdnyiRl8ttAq2mjv443NFO7MDFGdfj0o_GLabIUYCU';

async function testInternshipsAPI() {
  console.log('🧪 Testing Internships API...\n');

  try {
    // Test 1: Search internships (public endpoint)
    console.log('1. Testing internships search...');
    const searchResponse = await axios.get(
      `${API_BASE_URL}/internships/search`,
      {
        params: {
          limit: 3,
          search: 'Software',
        },
      },
    );
    console.log(`✅ Found ${searchResponse.data.total} internships`);
    console.log(
      `   First internship: ${searchResponse.data.internships[0]?.title}\n`,
    );

    // Test 2: Get popular companies
    console.log('2. Testing popular companies...');
    const companiesResponse = await axios.get(
      `${API_BASE_URL}/internships/popular-companies?limit=5`,
    );
    console.log(`✅ Found ${companiesResponse.data.length} popular companies`);
    console.log(`   Top company: ${companiesResponse.data[0]?.name}\n`);

    // Test 3: Get internship types
    console.log('3. Testing internship types...');
    const typesResponse = await axios.get(`${API_BASE_URL}/internships/types`);
    console.log(`✅ Found ${typesResponse.data.length} internship types`);
    console.log(
      `   Types: ${typesResponse.data.map((t) => t.name).join(', ')}\n`,
    );

    // Test 4: Get internship locations
    console.log('4. Testing internship locations...');
    const locationsResponse = await axios.get(
      `${API_BASE_URL}/internships/locations`,
    );
    console.log(`✅ Found ${locationsResponse.data.length} locations`);
    console.log(
      `   Top locations: ${locationsResponse.data
        .slice(0, 3)
        .map((l) => l.name)
        .join(', ')}\n`,
    );

    // Test 5: Get specific internship
    if (searchResponse.data.internships.length > 0) {
      const internshipId = searchResponse.data.internships[0].id;
      console.log('5. Testing get internship by ID...');
      const internshipResponse = await axios.get(
        `${API_BASE_URL}/internships/${internshipId}`,
      );
      console.log(`✅ Retrieved internship: ${internshipResponse.data.title}`);
      console.log(`   Company: ${internshipResponse.data.company.name}\n`);
    }

    // Test 6: Get dashboard stats (requires auth)
    console.log('6. Testing dashboard stats (authenticated)...');
    try {
      const statsResponse = await axios.get(
        `${API_BASE_URL}/internships/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
        },
      );
      console.log(`✅ Dashboard stats retrieved`);
      console.log(
        `   Total internships: ${statsResponse.data.totalInternships}`,
      );
      console.log(`   Applied: ${statsResponse.data.appliedInternships}`);
      console.log(`   Saved: ${statsResponse.data.savedInternships}\n`);
    } catch (error) {
      console.log(
        `⚠️  Dashboard stats failed (might need valid token): ${error.response?.status}\n`,
      );
    }

    // Test 7: Get user applications (requires auth)
    console.log('7. Testing user applications (authenticated)...');
    try {
      const applicationsResponse = await axios.get(
        `${API_BASE_URL}/internships/applications/my`,
        {
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
        },
      );
      console.log(
        `✅ User applications retrieved: ${applicationsResponse.data.length} applications\n`,
      );
    } catch (error) {
      console.log(
        `⚠️  User applications failed (might need valid token): ${error.response?.status}\n`,
      );
    }

    // Test 8: Get saved internships (requires auth)
    console.log('8. Testing saved internships (authenticated)...');
    try {
      const savedResponse = await axios.get(
        `${API_BASE_URL}/internships/saved/my`,
        {
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
        },
      );
      console.log(
        `✅ Saved internships retrieved: ${savedResponse.data.length} saved\n`,
      );
    } catch (error) {
      console.log(
        `⚠️  Saved internships failed (might need valid token): ${error.response?.status}\n`,
      );
    }

    console.log('🎉 All public API tests completed successfully!');
    console.log(
      'ℹ️  Authenticated endpoints may require a valid token for full testing.',
    );
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testInternshipsAPI();
