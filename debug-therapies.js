const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function testTherapiesEndpoint() {
  try {
    console.log('🧘 Testing Therapies Endpoint...\n');

    // Test 1: Get all therapies (default parameters)
    console.log('1. Testing GET /api/therapies (default parameters)');
    const response1 = await axios.get(`${BASE_URL}/therapies`);
    console.log(`Status: ${response1.status}`);
    console.log(`Total therapies: ${response1.data.total}`);
    console.log(`Count returned: ${response1.data.count}`);
    console.log(`Data length: ${response1.data.data ? response1.data.data.length : 0}`);
    if (response1.data.data && response1.data.data.length > 0) {
      console.log('First therapy:', JSON.stringify(response1.data.data[0], null, 2));
    }
    console.log('Filters:', JSON.stringify(response1.data.filters, null, 2));
    console.log();

    // Test 2: Get therapies with isActive=false
    console.log('2. Testing GET /api/therapies?isActive=false');
    try {
      const response2 = await axios.get(`${BASE_URL}/therapies?isActive=false`);
      console.log(`Status: ${response2.status}`);
      console.log(`Inactive therapies count: ${response2.data.count}`);
    } catch (error) {
      console.log('Error with inactive filter:', error.response?.status || error.message);
    }
    console.log();

    // Test 3: Get therapies without isActive filter
    console.log('3. Testing GET /api/therapies (no isActive filter)');
    try {
      const response3 = await axios.get(`${BASE_URL}/therapies`, {
        params: { }  // No query parameters
      });
      console.log(`Status: ${response3.status}`);
      console.log(`Total therapies: ${response3.data.total}`);
      console.log(`Count returned: ${response3.data.count}`);
      console.log(`Query used: ${JSON.stringify(response3.config.url)}`);
    } catch (error) {
      console.log('Error without filters:', error.response?.status || error.message);
    }
    console.log();

    // Test 4: Test different categories
    const categories = ['shamana', 'shodhana'];
    for (const category of categories) {
      console.log(`4. Testing GET /api/therapies?category=${category}`);
      try {
        const response = await axios.get(`${BASE_URL}/therapies?category=${category}`);
        console.log(`Status: ${response.status}`);
        console.log(`${category} therapies count: ${response.data.count}`);
        if (response.data.data && response.data.data.length > 0) {
          response.data.data.forEach((therapy, index) => {
            console.log(`  ${index + 1}. ${therapy.name} (${therapy.category})`);
          });
        }
      } catch (error) {
        console.log(`Error with category ${category}:`, error.response?.status || error.message);
      }
      console.log();
    }

    // Test 5: Test search functionality
    console.log('5. Testing search functionality');
    const searchTerms = ['Abhyanga', 'Shirodhara', 'Panchakarma'];
    for (const term of searchTerms) {
      try {
        const response = await axios.get(`${BASE_URL}/therapies?search=${term}`);
        console.log(`Search for "${term}": ${response.data.count} results`);
      } catch (error) {
        console.log(`Error searching for "${term}":`, error.response?.status || error.message);
      }
    }
    console.log();

    // Test 6: Manual direct check with raw parameters
    console.log('6. Testing with manual query construction');
    try {
      const manualResponse = await axios({
        method: 'GET',
        url: `${BASE_URL}/therapies`,
        params: {
          page: 1,
          limit: 50,
          isActive: 'true'
        }
      });
      console.log(`Manual request status: ${manualResponse.status}`);
      console.log(`Manual request total: ${manualResponse.data.total}`);
      console.log(`Manual request count: ${manualResponse.data.count}`);
    } catch (error) {
      console.log('Manual request error:', error.response?.status || error.message);
    }

  } catch (error) {
    console.error('❌ Main test error:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testTherapiesEndpoint();
}

module.exports = { testTherapiesEndpoint };