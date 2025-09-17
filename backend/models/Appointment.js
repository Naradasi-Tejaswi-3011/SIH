const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Basic Appointment Information
  appointmentId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Participants
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Therapist is required']
  },
  
  // Therapy Information
  therapy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapy',
    required: [true, 'Therapy is required']
  },
  
  // Course Information
  courseInfo: {
    totalSessions: {
      type: Number,
      required: true
    },
    currentSession: {
      type: Number,
      default: 1
    },
    sessionType: {
      type: String,
      enum: ['consultation', 'therapy_session', 'follow_up', 'assessment'],
      default: 'therapy_session'
    }
  },
  
  // Scheduling Information
  scheduledDateTime: {
    type: Date,
    required: [true, 'Scheduled date and time is required']
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  actualStartTime: Date,
  actualEndTime: Date,
  
  // Room and Resource Allocation
  room: {
    roomNumber: String,
    roomType: {
      type: String,
      enum: ['standard', 'specialized', 'steam_room', 'oil_room']
    },
    floor: String,
    building: String
  },
  allocatedResources: [{
    resourceType: String,
    resourceId: String,
    quantity: Number
  }],
  
  // Status Management
  status: {
    type: String,
    enum: [
      'scheduled',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'rescheduled',
      'no_show',
      'postponed'
    ],
    default: 'scheduled'
  },
  
  // Priority and Classification
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  appointmentType: {
    type: String,
    enum: ['new_patient', 'follow_up', 'emergency', 'consultation'],
    default: 'follow_up'
  },
  
  // Pre-therapy Preparation Status
  preparationStatus: {
    dietaryCompliance: {
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'partial'],
        default: 'pending'
      },
      notes: String,
      checkedAt: Date,
      checkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    medicationAdjustments: {
      status: {
        type: String,
        enum: ['pending', 'completed', 'not_required'],
        default: 'pending'
      },
      adjustments: [String],
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approvedAt: Date
    },
    vitalParameters: [{
      parameter: String,
      value: Number,
      unit: String,
      recordedAt: Date,
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isNormal: Boolean,
      notes: String
    }]
  },
  
  // Session Progress Tracking
  sessionProgress: {
    checkInTime: Date,
    checkOutTime: Date,
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestones: [{
      milestone: String,
      completedAt: Date,
      notes: String
    }],
    observations: String,
    complications: String,
    patientResponse: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },
  
  // Rescheduling Information
  reschedulingInfo: {
    originalDateTime: Date,
    rescheduleCount: {
      type: Number,
      default: 0
    },
    rescheduleReason: String,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rescheduledAt: Date,
    maxReschedulesAllowed: {
      type: Number,
      default: 3
    }
  },
  
  // Cancellation Information
  cancellationInfo: {
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'not_applicable'],
      default: 'not_applicable'
    }
  },
  
  // Payment Information
  payment: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'cancelled'],
      default: 'pending'
    },
    paymentMethod: String,
    transactionId: String,
    paidAt: Date
  },
  
  // Communication Log
  communications: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'phone', 'in_app']
    },
    message: String,
    sentAt: Date,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed']
    }
  }],
  
  // Notes and Instructions
  doctorNotes: String,
  therapistNotes: String,
  patientInstructions: String,
  internalNotes: String,
  
  // Follow-up Information
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    scheduledFor: Date,
    type: {
      type: String,
      enum: ['phone_call', 'video_call', 'in_person', 'message']
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: String
  },
  
  // Quality Metrics
  qualityMetrics: {
    punctuality: {
      patientOnTime: Boolean,
      therapistOnTime: Boolean,
      delayMinutes: Number
    },
    satisfaction: {
      patientSatisfaction: {
        type: Number,
        min: 1,
        max: 5
      },
      therapistFeedback: {
        type: Number,
        min: 1,
        max: 5
      },
      overallRating: {
        type: Number,
        min: 1,
        max: 5
      }
    }
  },
  
  // Integration Data
  externalReferences: [{
    system: String,
    reference: String,
    type: String
  }],
  
  // Audit Trail
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
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patient: 1, scheduledDateTime: 1 });
appointmentSchema.index({ doctor: 1, scheduledDateTime: 1 });
appointmentSchema.index({ therapist: 1, scheduledDateTime: 1 });
appointmentSchema.index({ status: 1, scheduledDateTime: 1 });
appointmentSchema.index({ 'room.roomNumber': 1, scheduledDateTime: 1 });

// Pre-save middleware
appointmentSchema.pre('save', function(next) {
  // Generate appointment ID if not exists
  if (!this.appointmentId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.appointmentId = `APT${date}${random}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Virtual for appointment duration
appointmentSchema.virtual('actualDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for delay information
appointmentSchema.virtual('delayInfo').get(function() {
  if (this.scheduledDateTime && this.actualStartTime) {
    const delayMinutes = Math.round((this.actualStartTime - this.scheduledDateTime) / (1000 * 60));
    return {
      isDelayed: delayMinutes > 0,
      delayMinutes: Math.abs(delayMinutes),
      isEarly: delayMinutes < 0
    };
  }
  return null;
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentTime = new Date(this.scheduledDateTime);
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  return hoursUntilAppointment >= 24 && 
         ['scheduled', 'confirmed'].includes(this.status);
};

// Method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function() {
  return this.reschedulingInfo.rescheduleCount < this.reschedulingInfo.maxReschedulesAllowed &&
         ['scheduled', 'confirmed'].includes(this.status);
};

// Method to calculate total cost
appointmentSchema.methods.calculateTotalCost = function() {
  // This would typically fetch the therapy price and apply any discounts
  return this.payment.amount || 0;
};

// Method to check if patient preparation is complete
appointmentSchema.methods.isPreparationComplete = function() {
  const dietary = this.preparationStatus.dietaryCompliance.status === 'completed';
  const medication = this.preparationStatus.medicationAdjustments.status === 'completed' || 
                    this.preparationStatus.medicationAdjustments.status === 'not_required';
  
  return dietary && medication;
};

// Method to update session progress
appointmentSchema.methods.updateProgress = function(progressData) {
  this.sessionProgress = { ...this.sessionProgress, ...progressData };
  this.updatedAt = Date.now();
  return this.save();
};

// Static method to find conflicting appointments
appointmentSchema.statics.findConflicts = function(therapistId, startTime, endTime, excludeId = null) {
  const query = {
    therapist: therapistId,
    status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
    $or: [
      {
        scheduledDateTime: {
          $gte: startTime,
          $lt: endTime
        }
      },
      {
        $expr: {
          $lt: [
            '$scheduledDateTime',
            endTime
          ]
        },
        $expr: {
          $gt: [
            { $add: ['$scheduledDateTime', { $multiply: ['$estimatedDuration', 60000] }] },
            startTime
          ]
        }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Static method to get availability
appointmentSchema.statics.getAvailability = function(therapistId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    therapist: therapistId,
    scheduledDateTime: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
  }).sort({ scheduledDateTime: 1 });
};

module.exports = mongoose.model('Appointment', appointmentSchema);