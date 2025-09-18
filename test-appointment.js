const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function testAppointmentCreation() {
  try {
    console.log('🩺 Testing Appointment Creation...\n');

    // Step 1: Login as admin to get auth token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@ayursutra.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Get available users for appointment
    console.log('\n2. Fetching users by role...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const users = usersResponse.data.data;
    const patients = users.filter(user => user.role === 'patient');
    const doctors = users.filter(user => user.role === 'doctor');
    const therapists = users.filter(user => user.role === 'therapist');

    console.log(`Found ${patients.length} patients, ${doctors.length} doctors, ${therapists.length} therapists`);

    if (patients.length === 0 || doctors.length === 0 || therapists.length === 0) {
      console.log('❌ Missing required user roles for appointment creation');
      return;
    }

    // Step 3: Get available therapies
    console.log('\n3. Fetching available therapies...');
    const therapiesResponse = await axios.get(`${BASE_URL}/therapies`);
    const therapies = therapiesResponse.data.data;

    if (therapies.length === 0) {
      console.log('❌ No therapies available');
      return;
    }

    console.log(`Found ${therapies.length} available therapies`);

    // Step 4: Create appointment with valid data
    console.log('\n4. Creating appointment...');
    
    const appointmentData = {
      patient: patients[0]._id,
      doctor: doctors[0]._id,
      therapist: therapists[0]._id,
      therapy: therapies[0]._id,
      scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      notes: 'Test appointment creation from automated script'
    };

    console.log('Appointment data:', JSON.stringify(appointmentData, null, 2));

    try {
      const appointmentResponse = await axios.post(`${BASE_URL}/appointments`, appointmentData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Appointment created successfully!');
      console.log('Appointment ID:', appointmentResponse.data.data.appointmentId);
      console.log('Status:', appointmentResponse.data.data.status);
      console.log('Scheduled for:', appointmentResponse.data.data.scheduledDateTime);
      
    } catch (appointmentError) {
      console.log('❌ Appointment creation failed:');
      console.log('Status:', appointmentError.response?.status);
      console.log('Error:', appointmentError.response?.data);
      
      // Try with minimal data
      console.log('\n5. Retrying with minimal data...');
      const minimalData = {
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        therapist: therapists[0]._id,
        therapy: therapies[0]._id,
        scheduledDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
      };

      try {
        const minimalResponse = await axios.post(`${BASE_URL}/appointments`, minimalData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Minimal appointment created successfully!');
        console.log('Appointment ID:', minimalResponse.data.data.appointmentId);
        
      } catch (minimalError) {
        console.log('❌ Minimal appointment also failed:');
        console.log('Status:', minimalError.response?.status);
        console.log('Error:', minimalError.response?.data);
        
        // Debug: Check validation requirements
        console.log('\n6. Checking validation requirements...');
        try {
          const validationTest = await axios.post(`${BASE_URL}/appointments`, {}, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (validationError) {
          console.log('Validation error details:', validationError.response?.data);
        }
      }
    }

    // Step 5: List appointments to see if any were created
    console.log('\n7. Checking current appointments...');
    try {
      const appointmentsResponse = await axios.get(`${BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Total appointments: ${appointmentsResponse.data.total}`);
      if (appointmentsResponse.data.data.length > 0) {
        appointmentsResponse.data.data.forEach((apt, index) => {
          console.log(`  ${index + 1}. ${apt.appointmentId} - ${apt.status} - ${apt.scheduledDateTime}`);
        });
      }
    } catch (error) {
      console.log('Error fetching appointments:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Main test error:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testAppointmentCreation();
}

module.exports = { testAppointmentCreation };