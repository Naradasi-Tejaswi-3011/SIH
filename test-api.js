const http = require('http');

// Test the health endpoint
const testHealthEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Health Check Response:');
      console.log('Status:', res.statusCode);
      console.log('Data:', JSON.parse(data));
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
  });

  req.end();
};

// Test user registration
const testUserRegistration = () => {
  const postData = JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    password: 'password123',
    role: 'patient',
    dateOfBirth: '1990-01-01',
    gender: 'male'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\nUser Registration Response:');
      console.log('Status:', res.statusCode);
      try {
        console.log('Data:', JSON.parse(data));
      } catch (e) {
        console.log('Data (raw):', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
  });

  req.write(postData);
  req.end();
};

// Run tests
console.log('Testing AyurSutra API...\n');

setTimeout(() => {
  testHealthEndpoint();
  setTimeout(() => {
    testUserRegistration();
  }, 1000);
}, 1000);