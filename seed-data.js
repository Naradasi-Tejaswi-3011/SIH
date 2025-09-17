const mongoose = require('mongoose');
require('dotenv').config();

const Therapy = require('./backend/models/Therapy');
const User = require('./backend/models/User');

// Sample therapies data
const therapiesData = [
  {
    name: "Panchakarma Detoxification (Complete Course)",
    sanskritName: "पञ्चकर्म",
    category: "shodhana",
    description: "A comprehensive five-fold detoxification treatment that eliminates toxins from the body and restores natural balance. This complete course includes Vamana (therapeutic vomiting), Virechana (purgation), Nasya (nasal therapy), Basti (medicated enemas), and Raktamokshana (bloodletting).",
    benefits: [
      "Complete body detoxification",
      "Improved immunity",
      "Mental clarity and stress relief",
      "Better digestion",
      "Rejuvenation of tissues"
    ],
    indications: [
      "Chronic digestive disorders",
      "Respiratory problems",
      "Skin diseases",
      "Arthritis and joint pain",
      "Stress and anxiety"
    ],
    contraindications: [
      "Pregnancy",
      "Severe heart conditions",
      "Active infections",
      "Very young children",
      "Severe malnutrition"
    ],
    duration: {
      perSession: 120,
      totalCourse: 21,
      frequency: "daily"
    },
    requirements: {
      room: {
        type: "specialized",
        temperature: { min: 24, max: 28 },
        humidity: { min: 50, max: 70 }
      },
      equipment: ["Treatment table", "Steam chamber", "Oil warmer", "Herbal preparation tools"],
      materials: [
        { name: "Sesame oil", quantity: 500, unit: "ml", cost: 800 },
        { name: "Herbal medicines", quantity: 1, unit: "set", cost: 2000 },
        { name: "Ghee (clarified butter)", quantity: 200, unit: "ml", cost: 400 }
      ],
      staffRequired: {
        therapists: 2,
        assistants: 1,
        specialization: ["Panchakarma specialist", "Ayurvedic physician"]
      }
    },
    preparation: {
      preTherapy: {
        dietary: ["Light vegetarian food", "Avoid spicy and oily food", "Herbal teas"],
        lifestyle: ["Early sleep", "Light exercise", "Meditation"],
        medications: ["Preparatory herbal medicines"],
        duration: 7
      },
      postTherapy: {
        dietary: ["Easily digestible food", "Warm liquids", "Avoid cold drinks"],
        lifestyle: ["Rest", "Gentle yoga", "Oil massage"],
        medications: ["Rejuvenative tonics"],
        duration: 14
      }
    },
    vitalParameters: [
      { parameter: "blood_pressure", frequency: "before", normalRange: { min: 90, max: 140 } },
      { parameter: "pulse", frequency: "during", normalRange: { min: 60, max: 100 } },
      { parameter: "temperature", frequency: "after", normalRange: { min: 98, max: 100 } }
    ],
    scheduling: {
      preferredTimeSlots: ["morning"],
      seasonalPreferences: ["winter", "spring"],
      minRestBetweenSessions: 24,
      maxSessionsPerDay: 1
    },
    pricing: {
      basePrice: 2500,
      currency: "INR",
      packageDiscount: 15
    },
    popularityScore: 95,
    averageRating: 4.8,
    totalRatings: 156
  },
  {
    name: "Abhyanga (Full Body Oil Massage)",
    sanskritName: "अभ्यङ्ग",
    category: "shamana",
    description: "A therapeutic full-body oil massage using warm herbal oils. The massage follows specific strokes and pressure points to improve circulation, reduce stress, and nourish the skin and muscles.",
    benefits: [
      "Improved blood circulation",
      "Stress reduction",
      "Muscle relaxation",
      "Skin nourishment",
      "Better sleep quality"
    ],
    indications: [
      "Muscle tension and stiffness",
      "Stress and anxiety",
      "Insomnia",
      "Dry skin",
      "Poor circulation"
    ],
    contraindications: [
      "Fever",
      "Acute inflammation",
      "Open wounds",
      "Severe hypertension",
      "Recent surgery"
    ],
    duration: {
      perSession: 60,
      totalCourse: 7,
      frequency: "daily"
    },
    requirements: {
      room: {
        type: "standard",
        temperature: { min: 26, max: 30 },
        humidity: { min: 40, max: 60 }
      },
      equipment: ["Massage table", "Oil warmer", "Towels", "Shower facility"],
      materials: [
        { name: "Herbal massage oil", quantity: 100, unit: "ml", cost: 300 },
        { name: "Herbal powder for bath", quantity: 50, unit: "gm", cost: 150 }
      ],
      staffRequired: {
        therapists: 1,
        assistants: 0,
        specialization: ["Massage therapist", "Ayurvedic practitioner"]
      }
    },
    scheduling: {
      preferredTimeSlots: ["morning", "evening"],
      minRestBetweenSessions: 24,
      maxSessionsPerDay: 2
    },
    pricing: {
      basePrice: 800,
      currency: "INR",
      packageDiscount: 10
    },
    popularityScore: 88,
    averageRating: 4.6,
    totalRatings: 243
  },
  {
    name: "Shirodhara (Oil Pouring Therapy)",
    sanskritName: "शिरोधारा",
    category: "shamana",
    description: "A deeply relaxing treatment where warm herbal oil is continuously poured over the forehead in a steady stream. This therapy calms the nervous system and promotes mental clarity.",
    benefits: [
      "Deep relaxation",
      "Stress and anxiety relief",
      "Improved mental clarity",
      "Better sleep patterns",
      "Relief from headaches"
    ],
    indications: [
      "Stress and anxiety disorders",
      "Insomnia",
      "Headaches and migraines",
      "Mental fatigue",
      "Nervous system disorders"
    ],
    contraindications: [
      "Head injuries",
      "Severe hypertension",
      "Pregnancy (first trimester)",
      "Fever",
      "Recent head surgery"
    ],
    duration: {
      perSession: 45,
      totalCourse: 5,
      frequency: "alternate_days"
    },
    requirements: {
      room: {
        type: "specialized",
        temperature: { min: 24, max: 28 },
        humidity: { min: 45, max: 65 }
      },
      equipment: ["Shirodhara table", "Oil reservoir", "Oil warmer", "Adjustable stand"],
      materials: [
        { name: "Medicated oil", quantity: 200, unit: "ml", cost: 600 },
        { name: "Herbal decoction", quantity: 50, unit: "ml", cost: 200 }
      ],
      staffRequired: {
        therapists: 1,
        assistants: 1,
        specialization: ["Shirodhara specialist"]
      }
    },
    scheduling: {
      preferredTimeSlots: ["afternoon", "evening"],
      minRestBetweenSessions: 48,
      maxSessionsPerDay: 1
    },
    pricing: {
      basePrice: 1200,
      currency: "INR",
      packageDiscount: 12
    },
    popularityScore: 92,
    averageRating: 4.7,
    totalRatings: 189
  },
  {
    name: "Swedana (Herbal Steam Therapy)",
    sanskritName: "स्वेदन",
    category: "shodhana",
    description: "A therapeutic steam treatment using herbal decoctions. The patient sits in a specialized steam chamber while medicinal herbs create therapeutic vapors that open pores and eliminate toxins.",
    benefits: [
      "Detoxification through sweating",
      "Improved circulation",
      "Muscle relaxation",
      "Respiratory relief",
      "Skin purification"
    ],
    indications: [
      "Joint stiffness",
      "Muscle cramps",
      "Respiratory congestion",
      "Skin problems",
      "Obesity"
    ],
    contraindications: [
      "Heart disease",
      "High blood pressure",
      "Pregnancy",
      "Dehydration",
      "Open wounds"
    ],
    duration: {
      perSession: 30,
      totalCourse: 10,
      frequency: "daily"
    },
    requirements: {
      room: {
        type: "steam_room",
        temperature: { min: 40, max: 50 },
        humidity: { min: 80, max: 95 }
      },
      equipment: ["Steam chamber", "Herbal boiler", "Temperature control", "Timer"],
      materials: [
        { name: "Herbal mixture", quantity: 100, unit: "gm", cost: 250 },
        { name: "Eucalyptus oil", quantity: 10, unit: "ml", cost: 100 }
      ],
      staffRequired: {
        therapists: 1,
        assistants: 0,
        specialization: ["Steam therapy specialist"]
      }
    },
    vitalParameters: [
      { parameter: "blood_pressure", frequency: "before", normalRange: { min: 90, max: 130 } },
      { parameter: "heart_rate", frequency: "during", normalRange: { min: 70, max: 120 } }
    ],
    scheduling: {
      preferredTimeSlots: ["morning"],
      minRestBetweenSessions: 24,
      maxSessionsPerDay: 1
    },
    pricing: {
      basePrice: 600,
      currency: "INR",
      packageDiscount: 8
    },
    popularityScore: 75,
    averageRating: 4.4,
    totalRatings: 97
  },
  {
    name: "Nasya (Nasal Therapy)",
    sanskritName: "नस्य",
    category: "shodhana",
    description: "Administration of medicated oils, powders, or herbal juices through the nasal passages. This therapy cleanses and strengthens the nasal passages, sinuses, and related structures.",
    benefits: [
      "Sinus clearing",
      "Improved breathing",
      "Relief from headaches",
      "Enhanced mental clarity",
      "Prevention of respiratory disorders"
    ],
    indications: [
      "Sinusitis",
      "Allergic rhinitis",
      "Headaches",
      "Nasal congestion",
      "Loss of smell"
    ],
    contraindications: [
      "Acute fever",
      "Pregnancy",
      "Nasal injuries",
      "Recent nasal surgery",
      "Severe hypertension"
    ],
    duration: {
      perSession: 20,
      totalCourse: 7,
      frequency: "daily"
    },
    requirements: {
      room: {
        type: "standard",
        temperature: { min: 22, max: 26 },
        humidity: { min: 40, max: 60 }
      },
      equipment: ["Treatment table", "Nasal dropper", "Cotton swabs", "Basin"],
      materials: [
        { name: "Medicated oil", quantity: 25, unit: "ml", cost: 200 },
        { name: "Herbal powder", quantity: 10, unit: "gm", cost: 150 }
      ],
      staffRequired: {
        therapists: 1,
        assistants: 0,
        specialization: ["Panchakarma therapist"]
      }
    },
    scheduling: {
      preferredTimeSlots: ["morning"],
      minRestBetweenSessions: 24,
      maxSessionsPerDay: 1
    },
    pricing: {
      basePrice: 400,
      currency: "INR",
      packageDiscount: 5
    },
    popularityScore: 68,
    averageRating: 4.3,
    totalRatings: 73
  }
];

// Create admin user for therapy creation
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@ayursutra.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return adminExists;
    }

    const admin = await User.create({
      firstName: 'AyurSutra',
      lastName: 'Admin',
      email: 'admin@ayursutra.com',
      phone: '+91-9876543210',
      password: 'admin123',
      role: 'admin',
      isVerified: true
    });

    console.log('Admin user created successfully');
    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    return null;
  }
};

// Seed therapies
const seedTherapies = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create admin user
    const admin = await createAdminUser();
    
    if (!admin) {
      console.error('Failed to create admin user. Exiting...');
      process.exit(1);
    }

    // Check if therapies already exist
    const existingTherapies = await Therapy.countDocuments();
    if (existingTherapies > 0) {
      console.log(`Found ${existingTherapies} existing therapies. Skipping seed...`);
      process.exit(0);
    }

    console.log('Seeding therapies...');

    // Add creator info to therapies
    const therapiesWithCreator = therapiesData.map(therapy => ({
      ...therapy,
      createdBy: admin._id,
      isActive: true,
      isAvailable: true
    }));

    const createdTherapies = await Therapy.insertMany(therapiesWithCreator);
    
    console.log(`Successfully seeded ${createdTherapies.length} therapies:`);
    createdTherapies.forEach(therapy => {
      console.log(`- ${therapy.name} (${therapy.sanskritName})`);
    });

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedTherapies();
}

module.exports = { seedTherapies, therapiesData };