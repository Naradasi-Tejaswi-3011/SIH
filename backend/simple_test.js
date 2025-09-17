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
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function runSimpleTest() {
  console.log('🧪 Simple Therapy Tracking Test\n');

  // Create a therapist and patient
  console.log('1. Creating test users...');
  
  const therapist = {
    firstName: 'Dr. Test',
    lastName: 'Therapist',
    email: `therapist_${Date.now()}@test.com`,
    password: 'password123',
    role: 'therapist',
    phone: `+123456${Math.floor(Math.random() * 10000)}`
  };

  const patient = {
    firstName: 'Test',
    lastName: 'Patient',
    email: `patient_${Date.now()}@test.com`,
    password: 'password123',
    role: 'patient',
    phone: `+123456${Math.floor(Math.random() * 10000)}`,
    dateOfBirth: '1990-05-15',
    gender: 'male'
  };

  // Register therapist
  let result = await makeRequest('POST', '/api/auth/register', therapist);
  if (!result.success) {
    console.log('❌ Therapist registration failed:', result.error);
    return;
  }
  console.log('   ✓ Therapist registered');
  const therapistToken = result.data.token;
  const therapistId = result.data.user._id;

  // Register patient
  result = await makeRequest('POST', '/api/auth/register', patient);
  if (!result.success) {
    console.log('❌ Patient registration failed:', result.error);
    return;
  }
  console.log('   ✓ Patient registered');
  const patientToken = result.data.token;
  const patientId = result.data.user._id;

  // Get available therapies
  console.log('\n2. Getting available therapies...');
  result = await makeRequest('GET', '/api/therapies', null, patientToken);
  if (!result.success || !result.data.data || result.data.data.length === 0) {
    console.log('❌ No therapies available:', result.error);
    return;
  }
  console.log('   ✓ Found therapies:', result.data.data.length);
  const therapy = result.data.data[0];

  // Create an appointment
  console.log('\n3. Creating appointment...');
  const appointmentData = {
    therapyId: therapy._id,
    therapistId: therapistId,
    scheduledDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    duration: therapy.duration || 60,
    notes: 'Test appointment for therapy tracking'
  };

  result = await makeRequest('POST', '/api/appointments', appointmentData, patientToken);
  if (!result.success) {
    console.log('❌ Appointment creation failed:', result.error);
    return;
  }
  console.log('   ✓ Appointment created:', result.data.data._id);
  const appointmentId = result.data.data._id;

  // Test therapy tracking endpoints
  console.log('\n4. Testing therapy tracking...\n');

  // Start session (therapist only)
  console.log('   a. Starting therapy session...');
  result = await makeRequest('PUT', `/api/appointments/${appointmentId}/start-session`, {
    sessionNotes: 'Starting test therapy session',
    vitalSigns: {
      bloodPressure: '120/80',
      pulse: 72,
      temperature: 98.6
    }
  }, therapistToken);
  
  if (result.success) {
    console.log('      ✓ Session started successfully');
  } else {
    console.log('      ❌ Failed to start session:', result.error);
    return;
  }

  // Update progress
  console.log('   b. Updating session progress...');
  result = await makeRequest('PUT', `/api/appointments/${appointmentId}/update-progress`, {
    progressUpdate: {
      stage: 'Purvakarma',
      description: 'Preparing patient for main therapy',
      vitals: {
        bloodPressure: '118/78',
        pulse: 70
      },
      notes: 'Patient responding well to preparation'
    }
  }, therapistToken);
  
  if (result.success) {
    console.log('      ✓ Progress updated successfully');
  } else {
    console.log('      ❌ Failed to update progress:', result.error);
  }

  // Get session status
  console.log('   c. Getting session status...');
  result = await makeRequest('GET', `/api/appointments/${appointmentId}/session-status`, null, patientToken);
  
  if (result.success) {
    console.log('      ✓ Session status retrieved');
    console.log(`      Status: ${result.data.data.currentSession?.status || 'Unknown'}`);
  } else {
    console.log('      ❌ Failed to get session status:', result.error);
  }

  // Complete session
  console.log('   d. Completing therapy session...');
  result = await makeRequest('PUT', `/api/appointments/${appointmentId}/complete-session`, {
    completionNotes: 'Session completed successfully. Patient responded well.',
    finalVitals: {
      bloodPressure: '115/75',
      pulse: 65,
      temperature: 98.0
    },
    recommendations: ['Continue with prescribed diet', 'Follow-up in 1 week']
  }, therapistToken);
  
  if (result.success) {
    console.log('      ✓ Session completed successfully');
    console.log(`      Duration: ${result.data.data.currentSession?.actualDuration || 'Unknown'}`);
  } else {
    console.log('      ❌ Failed to complete session:', result.error);
  }

  // Test notification features
  console.log('\n5. Testing notifications...');
  
  result = await makeRequest('GET', '/api/notifications', null, patientToken);
  if (result.success) {
    console.log('   ✓ Retrieved notifications:', result.data.data.length);
  } else {
    console.log('   ❌ Failed to get notifications:', result.error);
  }

  console.log('\n🎉 Test completed!');
}

// Run the test
runSimpleTest().catch(console.error);