const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authTokenPatient, authTokenTherapist, authTokenAdmin;
let patientId, therapistId, appointmentId;

// Test data
const testPatient = {
  email: 'patient@test.com',
  password: 'password123',
  name: 'Test Patient',
  role: 'patient',
  phone: '+1234567890',
  dateOfBirth: '1990-05-15',
  address: '123 Test St, Test City'
};

const testTherapist = {
  email: 'therapist@test.com',
  password: 'password123',
  name: 'Test Therapist',
  role: 'therapist',
  phone: '+1234567891',
  specialization: 'Panchakarma',
  experience: 5,
  qualifications: ['BAMS', 'MD Ayurveda']
};

const testAdmin = {
  email: 'admin@ayursutra.com',
  password: 'admin123'
};

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

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  // Register and login test users
  console.log('1. Creating test users...');
  
  // Register patient
  let result = await makeRequest('POST', '/api/auth/register', testPatient);
  if (result.success || result.status === 400) {
    console.log('   ✓ Patient registered');
  }

  // Register therapist
  result = await makeRequest('POST', '/api/auth/register', testTherapist);
  if (result.success || result.status === 400) {
    console.log('   ✓ Therapist registered');
  }

  // Login users to get tokens
  result = await makeRequest('POST', '/api/auth/login', {
    email: testPatient.email,
    password: testPatient.password
  });
  if (result.success) {
    authTokenPatient = result.data.token;
    patientId = result.data.user.id;
    console.log('   ✓ Patient logged in');
  }

  result = await makeRequest('POST', '/api/auth/login', {
    email: testTherapist.email,
    password: testTherapist.password
  });
  if (result.success) {
    authTokenTherapist = result.data.token;
    therapistId = result.data.user.id;
    console.log('   ✓ Therapist logged in');
  }

  result = await makeRequest('POST', '/api/auth/login', {
    email: testAdmin.email,
    password: testAdmin.password
  });
  if (result.success) {
    authTokenAdmin = result.data.token;
    console.log('   ✓ Admin logged in');
  }

  // Get a therapy for booking
  result = await makeRequest('GET', '/api/therapies', null, authTokenPatient);
  const therapy = result.success ? result.data.data[0] : null;

  if (therapy) {
    // Create test appointment
    const appointmentData = {
      therapyId: therapy._id,
      therapistId: therapistId,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: therapy.duration,
      notes: 'Test appointment for therapy tracking'
    };

    result = await makeRequest('POST', '/api/appointments', appointmentData, authTokenPatient);
    if (result.success) {
      appointmentId = result.data.data._id;
      console.log('   ✓ Test appointment created');
    }
  }

  console.log('\n');
}

async function testTherapyTracking() {
  console.log('🎯 Testing Therapy Tracking System...\n');

  if (!appointmentId) {
    console.log('❌ No appointment available for testing');
    return;
  }

  // Test 1: Start therapy session (therapist only)
  console.log('1. Testing Start Therapy Session');
  
  // Should fail with patient token
  let result = await makeRequest('PUT', `/api/appointments/${appointmentId}/start-session`, {
    sessionNotes: 'Starting therapy session'
  }, authTokenPatient);
  
  if (!result.success && result.status === 403) {
    console.log('   ✓ Correctly blocked patient from starting session');
  } else {
    console.log('   ❌ Patient should not be able to start session');
  }

  // Should succeed with therapist token
  result = await makeRequest('PUT', `/api/appointments/${appointmentId}/start-session`, {
    sessionNotes: 'Starting Panchakarma therapy session',
    vitalSigns: {
      bloodPressure: '120/80',
      pulse: 72,
      temperature: 98.6
    }
  }, authTokenTherapist);
  
  if (result.success) {
    console.log('   ✓ Therapist successfully started session');
    console.log(`   Session ID: ${result.data.data.currentSession.sessionId}`);
  } else {
    console.log('   ❌ Failed to start session:', result.error);
  }

  // Test 2: Update session progress
  console.log('\n2. Testing Update Session Progress');
  
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
  }, authTokenTherapist);
  
  if (result.success) {
    console.log('   ✓ Session progress updated successfully');
  } else {
    console.log('   ❌ Failed to update progress:', result.error);
  }

  // Test 3: Get session status
  console.log('\n3. Testing Get Session Status');
  
  result = await makeRequest('GET', `/api/appointments/${appointmentId}/session-status`, null, authTokenPatient);
  
  if (result.success) {
    console.log('   ✓ Retrieved session status');
    console.log('   Current Status:', result.data.data.currentSession?.status);
    console.log('   Progress Updates:', result.data.data.currentSession?.progressUpdates?.length || 0);
  } else {
    console.log('   ❌ Failed to get session status:', result.error);
  }

  // Test 4: Get live session data
  console.log('\n4. Testing Get Live Session Data');
  
  result = await makeRequest('GET', `/api/appointments/${appointmentId}/live-data`, null, authTokenTherapist);
  
  if (result.success) {
    console.log('   ✓ Retrieved live session data');
    console.log('   Live Updates:', result.data.data.liveUpdates?.length || 0);
  } else {
    console.log('   ❌ Failed to get live data:', result.error);
  }

  // Test 5: Add more progress updates
  console.log('\n5. Testing Multiple Progress Updates');
  
  const progressUpdates = [
    {
      stage: 'Pradhankarma',
      description: 'Main therapy procedure started',
      vitals: { pulse: 68, temperature: 98.4 },
      notes: 'Beginning oil massage therapy'
    },
    {
      stage: 'Pradhankarma',
      description: 'Midway through main procedure',
      vitals: { pulse: 66, temperature: 98.2 },
      notes: 'Patient relaxed, good response'
    }
  ];

  for (let i = 0; i < progressUpdates.length; i++) {
    result = await makeRequest('PUT', `/api/appointments/${appointmentId}/update-progress`, {
      progressUpdate: progressUpdates[i]
    }, authTokenTherapist);
    
    if (result.success) {
      console.log(`   ✓ Progress update ${i + 1} added`);
    } else {
      console.log(`   ❌ Progress update ${i + 1} failed:`, result.error);
    }

    // Small delay between updates
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test 6: Complete therapy session
  console.log('\n6. Testing Complete Therapy Session');
  
  result = await makeRequest('PUT', `/api/appointments/${appointmentId}/complete-session`, {
    completionNotes: 'Session completed successfully. Patient responded well to treatment.',
    finalVitals: {
      bloodPressure: '115/75',
      pulse: 65,
      temperature: 98.0
    },
    recommendations: [
      'Continue with prescribed diet',
      'Follow-up appointment in 1 week',
      'Avoid heavy physical activity for 24 hours'
    ]
  }, authTokenTherapist);
  
  if (result.success) {
    console.log('   ✓ Session completed successfully');
    console.log('   Total Duration:', result.data.data.currentSession.actualDuration);
  } else {
    console.log('   ❌ Failed to complete session:', result.error);
  }

  // Test 7: Try to update completed session (should fail)
  console.log('\n7. Testing Updates on Completed Session');
  
  result = await makeRequest('PUT', `/api/appointments/${appointmentId}/update-progress`, {
    progressUpdate: {
      stage: 'Post-completion',
      description: 'This should fail'
    }
  }, authTokenTherapist);
  
  if (!result.success) {
    console.log('   ✓ Correctly prevented updates on completed session');
  } else {
    console.log('   ❌ Should not allow updates on completed session');
  }

  // Test 8: Final session status check
  console.log('\n8. Testing Final Session Status');
  
  result = await makeRequest('GET', `/api/appointments/${appointmentId}/session-status`, null, authTokenPatient);
  
  if (result.success) {
    console.log('   ✓ Retrieved final session status');
    console.log('   Final Status:', result.data.data.currentSession?.status);
    console.log('   Total Progress Updates:', result.data.data.currentSession?.progressUpdates?.length || 0);
    console.log('   Completion Time:', result.data.data.currentSession?.completedAt || 'Not completed');
  } else {
    console.log('   ❌ Failed to get final session status:', result.error);
  }
}

async function testNotificationSystem() {
  console.log('\n📢 Testing Notification System...\n');

  // Test 1: Get user notifications
  console.log('1. Testing Get User Notifications');
  
  let result = await makeRequest('GET', '/api/notifications', null, authTokenPatient);
  
  if (result.success) {
    console.log('   ✓ Retrieved patient notifications');
    console.log('   Total notifications:', result.data.data.length);
  } else {
    console.log('   ❌ Failed to get notifications:', result.error);
  }

  // Test 2: Mark notifications as read
  if (result.success && result.data.data.length > 0) {
    console.log('\n2. Testing Mark Notification as Read');
    
    const notificationId = result.data.data[0]._id;
    result = await makeRequest('PUT', `/api/notifications/${notificationId}/read`, {}, authTokenPatient);
    
    if (result.success) {
      console.log('   ✓ Notification marked as read');
    } else {
      console.log('   ❌ Failed to mark notification as read:', result.error);
    }
  }

  // Test 3: Send custom notification (admin only)
  console.log('\n3. Testing Send Custom Notification');
  
  result = await makeRequest('POST', '/api/notifications/send', {
    recipients: [patientId],
    title: 'Test Custom Notification',
    message: 'This is a test notification sent via API',
    type: 'info',
    channels: ['in-app', 'email']
  }, authTokenAdmin);
  
  if (result.success) {
    console.log('   ✓ Custom notification sent successfully');
  } else {
    console.log('   ❌ Failed to send custom notification:', result.error);
  }

  // Test 4: Get notification statistics (admin only)
  console.log('\n4. Testing Notification Statistics');
  
  result = await makeRequest('GET', '/api/notifications/stats', null, authTokenAdmin);
  
  if (result.success) {
    console.log('   ✓ Retrieved notification statistics');
    console.log('   Total sent:', result.data.data.totalSent);
    console.log('   Delivery rate:', result.data.data.deliveryRate + '%');
  } else {
    console.log('   ❌ Failed to get notification statistics:', result.error);
  }
}

async function runTests() {
  console.log('🚀 Starting Therapy Tracking & Notification System Tests\n');
  console.log('================================================\n');

  try {
    await setupTestData();
    await testTherapyTracking();
    await testNotificationSystem();
    
    console.log('\n================================================');
    console.log('✅ All tests completed!');
    console.log('\nIf you see mostly ✓ marks, the system is working correctly.');
    console.log('❌ marks indicate issues that need to be addressed.\n');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Run tests
runTests();