const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Test user credentials - using Jennifer Smith test account
const testUser = {
  email: 'jennifer.smith@techcorp.com',
  password: 'password123',
};

async function testSavedJobs() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(
      `${API_BASE}/auth/test-login`,
      testUser,
    );
    const token = loginResponse.data.access_token;

    console.log('✅ Login successful');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Get all jobs first
    console.log('\n📋 Fetching all jobs...');
    const jobsResponse = await axios.get(`${API_BASE}/jobs`, { headers });
    const jobs = jobsResponse.data.data;
    console.log(`Found ${jobs.length} jobs`);

    if (jobs.length > 0) {
      const firstJob = jobs[0];
      console.log(`\n💾 Trying to save job: ${firstJob.title}`);

      // Save a job
      try {
        const saveResponse = await axios.post(
          `${API_BASE}/jobs/${firstJob.id}/save`,
          {},
          { headers },
        );
        console.log('✅ Job saved successfully:', saveResponse.data);
      } catch (saveError) {
        console.log(
          '❌ Error saving job:',
          saveError.response?.data || saveError.message,
        );
      }

      // Get saved jobs
      console.log('\n📚 Fetching saved jobs...');
      try {
        const savedJobsResponse = await axios.get(`${API_BASE}/jobs/saved`, {
          headers,
        });
        console.log('✅ Saved jobs:', savedJobsResponse.data);
      } catch (savedError) {
        console.log(
          '❌ Error fetching saved jobs:',
          savedError.response?.data || savedError.message,
        );
      }

      // Get job stats
      console.log('\n📊 Fetching job stats...');
      try {
        const statsResponse = await axios.get(`${API_BASE}/jobs/stats`, {
          headers,
        });
        console.log('✅ Job stats:', statsResponse.data);
      } catch (statsError) {
        console.log(
          '❌ Error fetching job stats:',
          statsError.response?.data || statsError.message,
        );
      }

      // Test applications endpoint
      console.log('\n📝 Testing applications endpoint...');
      try {
        const applicationsResponse = await axios.get(
          `${API_BASE}/applications/my-applications`,
          { headers },
        );
        console.log('✅ My applications:', applicationsResponse.data);
      } catch (appError) {
        console.log(
          '❌ Error fetching applications:',
          appError.response?.data || appError.message,
        );
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSavedJobs();
