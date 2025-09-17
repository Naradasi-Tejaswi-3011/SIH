const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function makeRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function debugAuth() {
  console.log('🔍 Debug Authentication Flow\n');

  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  let result = await makeRequest('GET', '/api/health');
  console.log('Health:', result.success ? '✓' : '❌', result.success ? result.data.status : result.error);

  // Test 2: Login with admin
  console.log('\n2. Testing admin login...');
  result = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@ayursutra.com',
    password: 'admin123'
  });
  console.log('Admin login:', result.success ? '✓' : '❌');
  if (result.success) {
    console.log('Token received:', !!result.data.token);
    console.log('User ID:', result.data.user.id);
    console.log('User name:', result.data.user.name);
    
    const adminToken = result.data.token;
    
    // Test 3: Get therapies with admin token
    console.log('\n3. Testing therapies endpoint...');
    result = await makeRequest('GET', '/api/therapies', null, adminToken);
    console.log('Therapies:', result.success ? '✓' : '❌');
    if (result.success) {
      console.log('Number of therapies:', result.data.data?.length || 0);
      if (result.data.data?.length > 0) {
        console.log('First therapy:', result.data.data[0].name);
      }
    } else {
      console.log('Error:', result.error);
    }

    // Test 4: Register a new patient
    console.log('\n4. Testing patient registration...');
    const testPatient = {
      email: 'testpatient@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Patient',
      role: 'patient',
      phone: '+1234567890'
    };
    
    result = await makeRequest('POST', '/api/auth/register', testPatient);
    console.log('Patient registration:', result.success ? '✓' : '❌', result.success ? 'Success' : result.error);
    
    // Test 5: Login as patient
    console.log('\n5. Testing patient login...');
    result = await makeRequest('POST', '/api/auth/login', {
      email: testPatient.email,
      password: testPatient.password
    });
    console.log('Patient login:', result.success ? '✓' : '❌');
    if (result.success) {
      const patientToken = result.data.token;
      const patientId = result.data.user.id;
      console.log('Patient ID:', patientId);
      
      // Test 6: Create appointment
      console.log('\n6. Testing appointment creation...');
      result = await makeRequest('GET', '/api/therapies', null, patientToken);
      
      if (result.success && result.data.data && result.data.data.length > 0) {
        const therapy = result.data.data[0];
        console.log('Using therapy:', therapy.name);
        
        const appointmentData = {
          therapyId: therapy._id,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: therapy.duration || 60,
          notes: 'Test appointment'
        };
        
        result = await makeRequest('POST', '/api/appointments', appointmentData, patientToken);
        console.log('Appointment creation:', result.success ? '✓' : '❌');
        if (result.success) {
          console.log('Appointment ID:', result.data.data._id);
        } else {
          console.log('Appointment error:', result.error);
        }
      } else {
        console.log('No therapies available for appointment');
      }
    }
  } else {
    console.log('Admin login error:', result.error);
  }
}

debugAuth().catch(console.error);