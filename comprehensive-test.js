const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n=== Testing Health Endpoint ===');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`✅ Health Check: ${result.statusCode === 200 ? 'PASSED' : 'FAILED'}`);
    console.log(`Status: ${result.statusCode}`);
    if (result.statusCode !== 200) {
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`❌ Health Check: FAILED - ${error.message}`);
  }
}

async function testUserLogin() {
  console.log('\n=== Testing User Login ===');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify({
          email: 'admin@ayursutra.com',
          password: 'admin123'
        }))
      }
    }, {
      email: 'admin@ayursutra.com',
      password: 'admin123'
    });
    
    console.log(`✅ Admin Login: ${result.statusCode === 200 ? 'PASSED' : 'FAILED'}`);
    console.log(`Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      return result.data.token;
    } else {
      console.log('Response:', result.data);
      return null;
    }
  } catch (error) {
    console.log(`❌ Admin Login: FAILED - ${error.message}`);
    return null;
  }
}

async function testTherapiesEndpoint(token) {
  console.log('\n=== Testing Therapies Endpoint ===');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/therapies',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    console.log(`✅ Get Therapies: ${result.statusCode === 200 ? 'PASSED' : 'FAILED'}`);
    console.log(`Status: ${result.statusCode}`);
    
    if (result.statusCode === 200 && result.data.data) {
      console.log(`Found ${result.data.data.length} therapies`);
      if (result.data.data.length > 0) {
        console.log(`Sample therapy: ${result.data.data[0].name}`);
        return result.data.data[0]._id; // Return first therapy ID for testing
      }
    } else {
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`❌ Get Therapies: FAILED - ${error.message}`);
  }
  return null;
}

async function testUsersEndpoint(token) {
  console.log('\n=== Testing Users Endpoint ===');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    console.log(`✅ Get Users: ${result.statusCode === 200 ? 'PASSED' : 'FAILED'}`);
    console.log(`Status: ${result.statusCode}`);
    
    if (result.statusCode === 200 && result.data.data) {
      console.log(`Found ${result.data.data.length} users`);
      const patients = result.data.data.filter(user => user.role === 'patient');
      const therapists = result.data.data.filter(user => user.role === 'therapist');
      const doctors = result.data.data.filter(user => user.role === 'doctor');
      
      console.log(`Patients: ${patients.length}, Therapists: ${therapists.length}, Doctors: ${doctors.length}`);
      
      return {
        patientId: patients[0]?._id,
        therapistId: therapists[0]?._id,
        doctorId: doctors[0]?._id
      };
    } else {
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`❌ Get Users: FAILED - ${error.message}`);
  }
  return {};
}

async function testAppointmentCreation(token, userIds, therapyId) {
  console.log('\n=== Testing Appointment Creation ===');
  
  if (!userIds.patientId || !userIds.therapistId || !userIds.doctorId || !therapyId) {
    console.log('❌ Appointment Creation: SKIPPED - Missing required IDs');
    return null;
  }
  
  try {
    const appointmentData = {
      patient: userIds.patientId,
      doctor: userIds.doctorId,
      therapist: userIds.therapistId,
      therapy: therapyId,
      scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      estimatedDuration: 60,
      appointmentType: 'new_patient',
      priority: 'normal',
      notes: 'Test appointment created by comprehensive test'
    };
    
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/appointments',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(JSON.stringify(appointmentData))
      }
    }, appointmentData);
    
    console.log(`✅ Create Appointment: ${result.statusCode === 201 ? 'PASSED' : 'FAILED'}`);
    console.log(`Status: ${result.statusCode}`);
    
    if (result.statusCode === 201 && result.data.data) {
      console.log(`Created appointment: ${result.data.data.appointmentId}`);
      return result.data.data._id;
    } else {
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`❌ Create Appointment: FAILED - ${error.message}`);
  }
  return null;
}

async function testNotificationsEndpoint(token) {
  console.log('\n=== Testing Notifications Endpoint ===');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Get Notifications: ${result.statusCode === 200 ? 'PASSED' : 'FAILED'}`);
    console.log(`Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`Found ${result.data.notifications?.length || 0} notifications`);
    } else {
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`❌ Get Notifications: FAILED - ${error.message}`);
  }
}

async function testAnalyticsEndpoint(token) {
  console.log('\n=== Testing Analytics Endpoint ===');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics/dashboard',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Get Analytics: ${result.statusCode === 200 ? 'PASSED' : 'FAILED'}`);
    console.log(`Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log('Analytics data retrieved successfully');
      if (result.data.data?.overview) {
        console.log(`Total Users: ${result.data.data.overview.totalUsers || 0}`);
        console.log(`Total Appointments: ${result.data.data.overview.totalAppointments || 0}`);
      }
    } else {
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`❌ Get Analytics: FAILED - ${error.message}`);
  }
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive API Tests...');
  console.log('========================================');
  
  // Test health endpoint
  await testHealthEndpoint();
  
  // Test login and get admin token
  const token = await testUserLogin();
  
  if (!token) {
    console.log('\n❌ Cannot continue tests without authentication token');
    return;
  }
  
  console.log('✅ Authentication token obtained');
  
  // Test therapies endpoint
  const therapyId = await testTherapiesEndpoint(token);
  
  // Test users endpoint
  const userIds = await testUsersEndpoint(token);
  
  // Test appointment creation
  const appointmentId = await testAppointmentCreation(token, userIds, therapyId);
  
  // Test notifications endpoint
  await testNotificationsEndpoint(token);
  
  // Test analytics endpoint
  await testAnalyticsEndpoint(token);
  
  console.log('\n========================================');
  console.log('🎉 Comprehensive API Tests Completed!');
  console.log('========================================');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests()
    .then(() => {
      console.log('\n✅ All tests finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests };