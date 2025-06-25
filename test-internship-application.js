// Test script to verify internship application status updates
const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
  // You'll need to replace these with actual values from your database
  internshipId: 'test-internship-id',
  userId: 'test-user-id',
  token: 'your-jwt-token',
};

async function testInternshipApplication() {
  console.log('🧪 Testing Internship Application Flow...\n');

  try {
    // 1. Get initial stats
    console.log('1️⃣ Getting initial stats...');
    const initialStatsResponse = await fetch(
      `${API_BASE_URL}/internships/dashboard/stats`,
      {
        headers: {
          Authorization: `Bearer ${testData.token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const initialStats = await initialStatsResponse.json();
    console.log('Initial stats:', initialStats);

    // 2. Search internships to check isApplied status
    console.log('\n2️⃣ Searching internships...');
    const searchResponse = await fetch(
      `${API_BASE_URL}/internships/search?limit=5`,
      {
        headers: {
          Authorization: `Bearer ${testData.token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const searchData = await searchResponse.json();
    console.log('Found internships:', searchData.internships.length);
    console.log(
      'First internship isApplied status:',
      searchData.internships[0]?.isApplied,
    );

    // 3. Apply to an internship (if you have a valid internship ID)
    if (
      testData.internshipId &&
      testData.internshipId !== 'test-internship-id'
    ) {
      console.log('\n3️⃣ Applying to internship...');
      const applicationResponse = await fetch(
        `${API_BASE_URL}/internships/applications`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${testData.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            internshipId: testData.internshipId,
            resumeUrl: 'test-resume.pdf',
            coverLetter: 'Test cover letter',
          }),
        },
      );

      if (applicationResponse.ok) {
        const applicationData = await applicationResponse.json();
        console.log('Application submitted:', applicationData);

        // 4. Get updated stats
        console.log('\n4️⃣ Getting updated stats...');
        const updatedStatsResponse = await fetch(
          `${API_BASE_URL}/internships/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${testData.token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        const updatedStats = await updatedStatsResponse.json();
        console.log('Updated stats:', updatedStats);
        console.log(
          'Applications increased by:',
          updatedStats.appliedInternships - initialStats.appliedInternships,
        );

        // 5. Search again to verify isApplied status
        console.log('\n5️⃣ Searching internships again...');
        const searchResponse2 = await fetch(
          `${API_BASE_URL}/internships/search?limit=5`,
          {
            headers: {
              Authorization: `Bearer ${testData.token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        const searchData2 = await searchResponse2.json();
        const appliedInternship = searchData2.internships.find(
          (i) => i.id === testData.internshipId,
        );
        console.log(
          'Applied internship isApplied status:',
          appliedInternship?.isApplied,
        );
      } else {
        const errorData = await applicationResponse.json();
        console.log('Application failed:', errorData);
      }
    } else {
      console.log(
        '\n⚠️ Skipping application test - no valid internship ID provided',
      );
    }

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions for running the test
console.log(`
📋 Instructions:
1. Make sure the backend is running on port 5000
2. Update the testData object with actual values:
   - internshipId: Get from the database or API
   - userId: Your test user ID
   - token: Valid JWT token for the user
3. Run: node test-internship-application.js

🔧 To get actual values:
- Visit the internships page in the browser
- Open DevTools Network tab
- Look at the API responses for actual IDs and tokens
`);

// Uncomment the line below to run the test
// testInternshipApplication();
