const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');
const Therapy = require('./backend/models/Therapy');
const Appointment = require('./backend/models/Appointment');

// Extended user data
const additionalUsers = [
  {
    firstName: 'Dr. Anita',
    lastName: 'Sharma',
    email: 'dr.anita@ayursutra.com',
    phone: '+91-9876543301',
    password: 'password123',
    role: 'doctor',
    isVerified: true,
    professionalInfo: {
      licenseNumber: 'AYUR-DOC-003',
      specialization: ['Panchakarma', 'Women\'s Health'],
      experience: 12,
      qualifications: ['BAMS', 'MD(Ayu)'],
      consultationFee: 1200,
      languages: ['Hindi', 'English']
    }
  },
  {
    firstName: 'Kiran',
    lastName: 'Therapist',
    email: 'kiran.therapist@ayursutra.com',
    phone: '+91-9876543302',
    password: 'password123',
    role: 'therapist',
    isVerified: true,
    professionalInfo: {
      licenseNumber: 'AYUR-TH-003',
      specialization: ['Shirodhara', 'Panchakarma'],
      experience: 5,
      qualifications: ['Certified Panchakarma Therapist'],
      availability: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 3, startTime: '08:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 5, startTime: '08:00', endTime: '16:00', isAvailable: true }
      ],
      languages: ['Hindi', 'English', 'Gujarati']
    }
  },
  {
    firstName: 'Raj',
    lastName: 'Kumar',
    email: 'raj.patient@example.com',
    phone: '+91-9876543303',
    password: 'password123',
    role: 'patient',
    dateOfBirth: '1992-08-10',
    gender: 'male',
    isVerified: true,
    address: {
      street: '789 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India'
    },
    medicalHistory: {
      allergies: ['Dust'],
      currentMedications: [],
      chronicConditions: ['Diabetes'],
      previousSurgeries: []
    }
  },
  {
    firstName: 'Maya',
    lastName: 'Singh',
    email: 'maya.patient@example.com',
    phone: '+91-9876543304',
    password: 'password123',
    role: 'patient',
    dateOfBirth: '1988-12-05',
    gender: 'female',
    isVerified: true,
    address: {
      street: '321 Green Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600001',
      country: 'India'
    },
    medicalHistory: {
      allergies: [],
      currentMedications: [],
      chronicConditions: ['Migraine'],
      previousSurgeries: []
    }
  }
];

// Simple therapy data
const simpleTherapies = [
  {
    name: 'Basic Abhyanga',
    sanskritName: 'अभ्यङ्ग',
    category: 'shamana',
    description: 'A relaxing full-body oil massage using warm herbal oils.',
    benefits: ['Relaxation', 'Better circulation', 'Stress relief'],
    indications: ['Stress', 'Muscle tension', 'Insomnia'],
    contraindications: ['Fever', 'Open wounds'],
    duration: {
      perSession: 60,
      totalCourse: 7,
      frequency: 'daily'
    },
    pricing: {
      basePrice: 2000,
      currency: 'INR',
      packageDiscount: 10
    },
    requirements: {
      room: { type: 'standard' },
      equipment: ['Massage table', 'Oil warmer'],
      staffRequired: { therapists: 1, assistants: 0 }
    },
    scheduling: {
      preferredTimeSlots: ['morning', 'afternoon'],
      maxSessionsPerDay: 1
    },
    isActive: true,
    isAvailable: true
  },
  {
    name: 'Simple Shirodhara',
    sanskritName: 'शिरोधारा',
    category: 'shamana',
    description: 'Gentle oil pouring therapy for stress relief.',
    benefits: ['Mental calm', 'Stress relief', 'Better sleep'],
    indications: ['Anxiety', 'Stress', 'Insomnia'],
    contraindications: ['Head injury', 'Severe hypertension'],
    duration: {
      perSession: 45,
      totalCourse: 5,
      frequency: 'daily'
    },
    pricing: {
      basePrice: 2500,
      currency: 'INR',
      packageDiscount: 15
    },
    requirements: {
      room: { type: 'specialized' },
      equipment: ['Shirodhara table', 'Oil pot'],
      staffRequired: { therapists: 1, assistants: 1 }
    },
    scheduling: {
      preferredTimeSlots: ['morning', 'evening'],
      maxSessionsPerDay: 1
    },
    isActive: true,
    isAvailable: true
  }
];

async function seedExtendedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create admin user first
    let admin = await User.findOne({ email: 'admin@ayursutra.com' });
    if (!admin) {
      admin = await User.create({
        firstName: 'AyurSutra',
        lastName: 'Admin',
        email: 'admin@ayursutra.com',
        phone: '+91-9876543200',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Seed additional users
    console.log('Seeding additional users...');
    for (const userData of additionalUsers) {
      const existingUser = await User.findOne({ 
        $or: [{ email: userData.email }, { phone: userData.phone }]
      });

      if (!existingUser) {
        await User.create(userData);
        console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.role})`);
      } else {
        console.log(`⏭️ User already exists: ${userData.email}`);
      }
    }

    // Seed simple therapies
    console.log('\nSeeding simple therapies...');
    for (const therapyData of simpleTherapies) {
      const existingTherapy = await Therapy.findOne({ name: therapyData.name });

      if (!existingTherapy) {
        await Therapy.create({
          ...therapyData,
          createdBy: admin._id
        });
        console.log(`✅ Created therapy: ${therapyData.name}`);
      } else {
        console.log(`⏭️ Therapy already exists: ${therapyData.name}`);
      }
    }

    // Summary
    const userCount = await User.countDocuments();
    const therapyCount = await Therapy.countDocuments();
    const appointmentCount = await Appointment.countDocuments();

    console.log('\n📊 Database Summary:');
    console.log(`👥 Total Users: ${userCount}`);
    console.log(`🧘 Total Therapies: ${therapyCount}`);
    console.log(`📅 Total Appointments: ${appointmentCount}`);

    // Show users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n👥 Users by Role:');
    usersByRole.forEach(role => {
      console.log(`  ${role._id}: ${role.count}`);
    });

    // Show active therapies
    const activeTherapies = await Therapy.find({ isActive: true }).select('name category pricing.basePrice');
    console.log('\n🧘 Active Therapies:');
    activeTherapies.forEach(therapy => {
      console.log(`  ${therapy.name} (${therapy.category}) - ₹${therapy.pricing.basePrice}`);
    });

  } catch (error) {
    console.error('Error seeding extended data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedExtendedData();
}

module.exports = { seedExtendedData };