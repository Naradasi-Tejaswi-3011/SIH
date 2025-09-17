const mongoose = require('mongoose');

const therapySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Therapy name is required'],
    trim: true,
    unique: true
  },
  sanskritName: {
    type: String,
    required: [true, 'Sanskrit name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: [
      'shodhana', // Detoxification therapies
      'shamana',  // Palliative therapies
      'rasayana', // Rejuvenation therapies
      'satvavajaya', // Psychotherapy
      'daivavyapashraya' // Spiritual therapy
    ],
    required: [true, 'Therapy category is required']
  },
  
  // Therapy Details
  description: {
    type: String,
    required: [true, 'Therapy description is required']
  },
  benefits: [String],
  indications: [String], // Conditions it treats
  contraindications: [String], // When not to use
  
  // Technical Specifications
  duration: {
    perSession: {
      type: Number, // in minutes
      required: [true, 'Session duration is required'],
      min: [15, 'Minimum session duration is 15 minutes']
    },
    totalCourse: {
      type: Number, // total number of sessions
      required: [true, 'Total course duration is required'],
      min: [1, 'Minimum course duration is 1 session']
    },
    frequency: {
      type: String,
      enum: ['daily', 'alternate_days', 'weekly', 'bi_weekly'],
      default: 'daily'
    }
  },
  
  // Resource Requirements
  requirements: {
    room: {
      type: {
        type: String,
        enum: ['standard', 'specialized', 'steam_room', 'oil_room'],
        default: 'standard'
      },
      temperature: {
        min: Number,
        max: Number
      },
      humidity: {
        min: Number,
        max: Number
      }
    },
    equipment: [String],
    materials: [{
      name: String,
      quantity: Number,
      unit: String,
      cost: Number
    }],
    staffRequired: {
      therapists: {
        type: Number,
        default: 1,
        min: [1, 'At least one therapist is required']
      },
      assistants: {
        type: Number,
        default: 0
      },
      specialization: [String] // Required specializations
    }
  },
  
  // Preparation Guidelines
  preparation: {
    preTherapy: {
      dietary: [String], // Dietary restrictions
      lifestyle: [String], // Lifestyle modifications
      medications: [String], // Medication adjustments
      duration: Number // Days before therapy
    },
    postTherapy: {
      dietary: [String],
      lifestyle: [String],
      medications: [String],
      duration: Number // Days after therapy
    }
  },
  
  // Safety and Monitoring
  vitalParameters: [{
    parameter: {
      type: String,
      enum: ['blood_pressure', 'heart_rate', 'temperature', 'weight', 'pulse', 'respiration']
    },
    frequency: {
      type: String,
      enum: ['before', 'during', 'after', 'daily']
    },
    normalRange: {
      min: Number,
      max: Number
    }
  }],
  
  sideEffects: [{
    effect: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild'
    },
    frequency: {
      type: String,
      enum: ['rare', 'uncommon', 'common', 'very_common']
    },
    management: String
  }],
  
  // Scheduling Information
  scheduling: {
    preferredTimeSlots: [String], // e.g., ['morning', 'afternoon']
    seasonalPreferences: [String], // e.g., ['winter', 'summer']
    minRestBetweenSessions: Number, // hours
    maxSessionsPerDay: {
      type: Number,
      default: 1
    }
  },
  
  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    packageDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Quality and Compliance
  certifications: [String],
  protocols: [{
    step: Number,
    description: String,
    duration: Number, // in minutes
    criticalPoint: Boolean
  }],
  
  // Media and Documentation
  images: [String],
  videos: [String],
  documents: [String],
  
  // Analytics
  popularityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
therapySchema.index({ name: 1 });
therapySchema.index({ category: 1 });
therapySchema.index({ 'pricing.basePrice': 1 });
therapySchema.index({ isActive: 1, isAvailable: 1 });
therapySchema.index({ popularityScore: -1 });
therapySchema.index({ averageRating: -1 });

// Pre-save middleware to update timestamp
therapySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total course cost
therapySchema.virtual('totalCost').get(function() {
  const baseCost = this.pricing.basePrice * this.duration.totalCourse;
  const discount = (this.pricing.packageDiscount / 100) * baseCost;
  return baseCost - discount;
});

// Method to check if therapy can be scheduled at given time
therapySchema.methods.canScheduleAt = function(dateTime) {
  const hour = dateTime.getHours();
  const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  
  return this.scheduling.preferredTimeSlots.includes(timeSlot) ||
         this.scheduling.preferredTimeSlots.length === 0;
};

// Method to calculate estimated completion date
therapySchema.methods.getEstimatedCompletionDate = function(startDate) {
  let completionDate = new Date(startDate);
  let sessionsCompleted = 0;
  
  while (sessionsCompleted < this.duration.totalCourse) {
    if (this.duration.frequency === 'daily') {
      completionDate.setDate(completionDate.getDate() + 1);
    } else if (this.duration.frequency === 'alternate_days') {
      completionDate.setDate(completionDate.getDate() + 2);
    } else if (this.duration.frequency === 'weekly') {
      completionDate.setDate(completionDate.getDate() + 7);
    } else if (this.duration.frequency === 'bi_weekly') {
      completionDate.setDate(completionDate.getDate() + 14);
    }
    sessionsCompleted++;
  }
  
  return completionDate;
};

// Method to update rating
therapySchema.methods.updateRating = function(newRating) {
  const totalScore = this.averageRating * this.totalRatings;
  this.totalRatings += 1;
  this.averageRating = (totalScore + newRating) / this.totalRatings;
  return this.save();
};

// Static method to get popular therapies
therapySchema.statics.getPopularTherapies = function(limit = 10) {
  return this.find({ isActive: true, isAvailable: true })
    .sort({ popularityScore: -1, averageRating: -1 })
    .limit(limit);
};

// Static method to search therapies
therapySchema.statics.searchTherapies = function(query, filters = {}) {
  const searchQuery = {
    $and: [
      { isActive: true, isAvailable: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { sanskritName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { benefits: { $in: [new RegExp(query, 'i')] } },
          { indications: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  };
  
  // Apply filters
  if (filters.category) {
    searchQuery.$and.push({ category: filters.category });
  }
  
  if (filters.priceRange) {
    searchQuery.$and.push({
      'pricing.basePrice': {
        $gte: filters.priceRange.min,
        $lte: filters.priceRange.max
      }
    });
  }
  
  if (filters.duration) {
    searchQuery.$and.push({
      'duration.perSession': {
        $gte: filters.duration.min,
        $lte: filters.duration.max
      }
    });
  }
  
  return this.find(searchQuery)
    .sort({ popularityScore: -1, averageRating: -1 });
};

module.exports = mongoose.model('Therapy', therapySchema);