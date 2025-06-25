const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test user credentials (you'll need to use actual user credentials)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    authToken = response.data.access_token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error(
      '❌ Login failed:',
      error.response?.data?.message || error.message,
    );
    return false;
  }
}

async function testMentorshipEndpoints() {
  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  console.log('\n📊 Testing Mentorship Endpoints...\n');

  // Test 1: Get mentee dashboard
  try {
    console.log('1. Testing mentee dashboard...');
    const response = await axios.get(
      `${API_BASE}/mentorship/mentee/dashboard`,
      { headers },
    );
    console.log('✅ Mentee dashboard:', response.data);
  } catch (error) {
    console.error(
      '❌ Mentee dashboard failed:',
      error.response?.data?.message || error.message,
    );
  }

  // Test 2: Search mentors
  try {
    console.log('\n2. Testing mentor search...');
    const response = await axios.get(
      `${API_BASE}/mentorship/mentors/search?limit=5`,
      { headers },
    );
    console.log('✅ Found mentors:', response.data.mentors?.length || 0);
    if (response.data.mentors?.length > 0) {
      console.log(
        '   First mentor:',
        response.data.mentors[0].user.firstName,
        response.data.mentors[0].user.lastName,
      );
    }
  } catch (error) {
    console.error(
      '❌ Mentor search failed:',
      error.response?.data?.message || error.message,
    );
  }

  // Test 3: Get sent requests
  try {
    console.log('\n3. Testing sent mentorship requests...');
    const response = await axios.get(`${API_BASE}/mentorship/requests/sent`, {
      headers,
    });
    console.log('✅ Sent requests:', response.data?.length || 0);
  } catch (error) {
    console.error(
      '❌ Sent requests failed:',
      error.response?.data?.message || error.message,
    );
  }

  // Test 4: Get sessions
  try {
    console.log('\n4. Testing mentorship sessions...');
    const response = await axios.get(`${API_BASE}/mentorship/sessions`, {
      headers,
    });
    console.log('✅ Sessions found:', response.data.sessions?.length || 0);
  } catch (error) {
    console.error(
      '❌ Sessions failed:',
      error.response?.data?.message || error.message,
    );
  }

  // Test 5: Get upcoming sessions
  try {
    console.log('\n5. Testing upcoming sessions...');
    const response = await axios.get(
      `${API_BASE}/mentorship/sessions/upcoming`,
      { headers },
    );
    console.log('✅ Upcoming sessions:', response.data?.length || 0);
  } catch (error) {
    console.error(
      '❌ Upcoming sessions failed:',
      error.response?.data?.message || error.message,
    );
  }

  // Test 6: Public mentor search (no auth)
  try {
    console.log('\n6. Testing public mentor search...');
    const response = await axios.get(
      `${API_BASE}/mentorship/public/mentors?limit=3`,
    );
    console.log('✅ Public mentors found:', response.data.mentors?.length || 0);
  } catch (error) {
    console.error(
      '❌ Public mentor search failed:',
      error.response?.data?.message || error.message,
    );
  }

  console.log('\n🎉 Mentorship API testing completed!');
}

async function main() {
  console.log('🧪 Starting Mentorship API Tests...\n');

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log(
      '\n❌ Cannot proceed without authentication. Please check your credentials.',
    );
    return;
  }

  await testMentorshipEndpoints();
}

main().catch(console.error);
