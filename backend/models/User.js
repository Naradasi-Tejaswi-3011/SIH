const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Role-based access
  role: {
    type: String,
    enum: ['patient', 'doctor', 'therapist', 'admin'],
    default: 'patient'
  },
  
  // Personal Information
  dateOfBirth: {
    type: Date,
    required: function() {
      return this.role === 'patient';
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: function() {
      return this.role === 'patient';
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  // Medical Information (for patients)
  medicalHistory: {
    allergies: [String],
    currentMedications: [String],
    chronicConditions: [String],
    previousSurgeries: [String],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  
  // Professional Information (for doctors/therapists)
  professionalInfo: {
    licenseNumber: String,
    specialization: [String],
    experience: Number, // in years
    qualifications: [String],
    availability: [{
      dayOfWeek: {
        type: Number, // 0-6 (Sunday-Saturday)
        min: 0,
        max: 6
      },
      startTime: String, // Format: "HH:MM"
      endTime: String,   // Format: "HH:MM"
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    consultationFee: Number,
    languages: [String]
  },
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Notification Preferences
  notificationPreferences: {
    email: {
      appointments: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      updates: { type: Boolean, default: true }
    },
    sms: {
      appointments: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      updates: { type: Boolean, default: false }
    },
    push: {
      appointments: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      updates: { type: Boolean, default: true }
    }
  },
  
  // Activity Tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
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
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'professionalInfo.specialization': 1 });

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Pre-save middleware to update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to sign JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      email: this.email 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
};

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // if we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1,
      },
      $set: {
        loginAttempts: 1,
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // if we hit max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000, // lock for 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Method to get full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Method to check if user can perform action based on role
userSchema.methods.hasPermission = function(requiredRoles) {
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(this.role);
  }
  return this.role === requiredRoles;
};

module.exports = mongoose.model('User', userSchema);