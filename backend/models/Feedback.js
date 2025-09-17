const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Basic Information
  feedbackId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Feedback Source and Target
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Feedback submitter is required']
  },
  submitterRole: {
    type: String,
    enum: ['patient', 'doctor', 'therapist', 'admin'],
    required: true
  },
  
  // Related Entities
  relatedTo: {
    entityType: {
      type: String,
      enum: ['appointment', 'therapy', 'therapist', 'doctor', 'center', 'system'],
      required: [true, 'Related entity type is required']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Related entity ID is required']
    },
    entityName: String // For display purposes
  },
  
  // Feedback Type and Category
  feedbackType: {
    type: String,
    enum: [
      'session_feedback',     // Post-therapy session feedback
      'therapy_completion',   // Overall therapy course feedback
      'service_quality',      // Service quality feedback
      'facility_feedback',    // Facility and amenities feedback
      'staff_feedback',       // Staff behavior and professionalism
      'system_feedback',      // System/app feedback
      'complaint',            // Complaint or issue
      'suggestion',           // Improvement suggestion
      'testimonial'           // Positive testimonial
    ],
    required: [true, 'Feedback type is required']
  },
  
  category: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'complaint', 'suggestion'],
    required: [true, 'Feedback category is required']
  },
  
  // Rating System
  ratings: {
    overall: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      required: [true, 'Overall rating is required']
    },
    
    // Specific rating categories for therapy sessions
    effectiveness: {
      type: Number,
      min: 1,
      max: 5
    },
    comfort: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    facilities: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Detailed Feedback
  feedback: {
    title: {
      type: String,
      maxLength: [200, 'Feedback title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Feedback description is required'],
      maxLength: [2000, 'Feedback description cannot exceed 2000 characters']
    },
    
    // Structured feedback questions
    responses: [{
      question: {
        type: String,
        required: true
      },
      questionType: {
        type: String,
        enum: ['text', 'rating', 'multiple_choice', 'yes_no', 'scale'],
        default: 'text'
      },
      answer: mongoose.Schema.Types.Mixed,
      required: {
        type: Boolean,
        default: false
      }
    }],
    
    // What went well
    positiveAspects: [String],
    
    // Areas for improvement
    improvementAreas: [String],
    
    // Specific complaints or issues
    issues: [{
      issue: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      resolved: {
        type: Boolean,
        default: false
      }
    }],
    
    // Suggestions
    suggestions: [String]
  },
  
  // Symptom and Outcome Tracking (for patients)
  healthOutcomes: {
    symptomsBeforeTherapy: [{
      symptom: String,
      severity: {
        type: Number,
        min: 1,
        max: 10
      },
      frequency: {
        type: String,
        enum: ['never', 'rarely', 'sometimes', 'often', 'always']
      }
    }],
    
    symptomsAfterTherapy: [{
      symptom: String,
      severity: {
        type: Number,
        min: 1,
        max: 10
      },
      frequency: {
        type: String,
        enum: ['never', 'rarely', 'sometimes', 'often', 'always']
      },
      improvement: {
        type: String,
        enum: ['much_worse', 'worse', 'no_change', 'better', 'much_better']
      }
    }],
    
    overallImprovement: {
      type: String,
      enum: ['much_worse', 'worse', 'no_change', 'better', 'much_better']
    },
    
    sideEffects: [{
      effect: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
      duration: String,
      resolved: Boolean
    }],
    
    wouldRecommend: {
      type: Boolean
    },
    
    recommendationScore: {
      type: Number,
      min: 0,
      max: 10 // Net Promoter Score
    }
  },
  
  // Therapist Feedback (from therapists about patients or sessions)
  therapistObservations: {
    patientCooperation: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    treatmentAdherence: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    responseToTreatment: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    complications: [String],
    observations: String,
    recommendations: [String]
  },
  
  // Media Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'audio']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String,
    description: String
  }],
  
  // Sentiment Analysis (AI-generated)
  sentimentAnalysis: {
    score: {
      type: Number,
      min: -1,
      max: 1 // -1 (negative) to 1 (positive)
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    keywords: [String],
    emotions: [{
      emotion: String,
      intensity: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    analyzedAt: Date
  },
  
  // Action Items and Follow-up
  actionItems: [{
    action: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    completedAt: Date
  }],
  
  // Response and Resolution
  response: {
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responseText: String,
    responseDate: Date,
    actionTaken: String,
    resolved: {
      type: Boolean,
      default: false
    },
    resolutionDate: Date,
    satisfaction: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Privacy and Anonymity
  isAnonymous: {
    type: Boolean,
    default: false
  },
  consentForSharing: {
    type: Boolean,
    default: false
  },
  consentForTestimonial: {
    type: Boolean,
    default: false
  },
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'responded', 'resolved', 'closed'],
    default: 'submitted'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Review and Moderation
  moderation: {
    reviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    approved: {
      type: Boolean,
      default: true
    },
    moderationNotes: String,
    flagged: {
      type: Boolean,
      default: false
    },
    flagReason: String
  },
  
  // Public Display
  displayOnWebsite: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Analytics and Metrics
  helpfulVotes: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  
  // Tags and Classification
  tags: [String],
  department: String,
  location: String,
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  
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
feedbackSchema.index({ feedbackId: 1 });
feedbackSchema.index({ submittedBy: 1, createdAt: -1 });
feedbackSchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });
feedbackSchema.index({ feedbackType: 1, category: 1 });
feedbackSchema.index({ status: 1, priority: -1 });
feedbackSchema.index({ 'ratings.overall': -1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ displayOnWebsite: 1, featured: -1 });

// Pre-save middleware
feedbackSchema.pre('save', function(next) {
  // Generate feedback ID if not exists
  if (!this.feedbackId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.feedbackId = `FDB${date}${random}`;
  }
  
  this.updatedAt = Date.now();
  this.lastModified = Date.now();
  
  // Auto-determine priority based on rating
  if (this.ratings && this.ratings.overall) {
    if (this.ratings.overall <= 2) {
      this.priority = 'high';
    } else if (this.ratings.overall === 3) {
      this.priority = 'normal';
    } else {
      this.priority = 'low';
    }
  }
  
  next();
});

// Virtual for average rating across all categories
feedbackSchema.virtual('averageRating').get(function() {
  const ratings = this.ratings;
  if (!ratings) return 0;
  
  const ratingValues = [];
  Object.keys(ratings).forEach(key => {
    if (key !== 'overall' && ratings[key] && typeof ratings[key] === 'number') {
      ratingValues.push(ratings[key]);
    }
  });
  
  if (ratingValues.length === 0) return ratings.overall || 0;
  
  const sum = ratingValues.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / ratingValues.length) * 100) / 100;
});

// Virtual for helpfulness ratio
feedbackSchema.virtual('helpfulnessRatio').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.helpfulVotes / this.totalVotes) * 100) / 100;
});

// Method to calculate improvement score
feedbackSchema.methods.calculateImprovementScore = function() {
  if (!this.healthOutcomes || !this.healthOutcomes.symptomsBeforeTherapy || !this.healthOutcomes.symptomsAfterTherapy) {
    return 0;
  }
  
  let totalImprovement = 0;
  let count = 0;
  
  this.healthOutcomes.symptomsAfterTherapy.forEach(afterSymptom => {
    const beforeSymptom = this.healthOutcomes.symptomsBeforeTherapy.find(
      before => before.symptom === afterSymptom.symptom
    );
    
    if (beforeSymptom) {
      const improvement = beforeSymptom.severity - afterSymptom.severity;
      totalImprovement += improvement;
      count++;
    }
  });
  
  return count > 0 ? Math.round((totalImprovement / count) * 100) / 100 : 0;
};

// Method to mark as helpful
feedbackSchema.methods.markAsHelpful = function(wasHelpful = true) {
  this.totalVotes += 1;
  if (wasHelpful) {
    this.helpfulVotes += 1;
  }
  return this.save();
};

// Method to respond to feedback
feedbackSchema.methods.respond = function(response, responderId) {
  this.response = {
    respondedBy: responderId,
    responseText: response.text,
    responseDate: new Date(),
    actionTaken: response.actionTaken,
    resolved: response.resolved || false
  };
  
  this.status = 'responded';
  if (response.resolved) {
    this.response.resolutionDate = new Date();
    this.status = 'resolved';
  }
  
  return this.save();
};

// Method to update sentiment analysis
feedbackSchema.methods.updateSentimentAnalysis = function(analysis) {
  this.sentimentAnalysis = {
    ...analysis,
    analyzedAt: new Date()
  };
  return this.save();
};

// Static method to get feedback statistics
feedbackSchema.statics.getStatistics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$ratings.overall' },
        positiveCount: {
          $sum: {
            $cond: [{ $gte: ['$ratings.overall', 4] }, 1, 0]
          }
        },
        negativeCount: {
          $sum: {
            $cond: [{ $lte: ['$ratings.overall', 2] }, 1, 0]
          }
        },
        neutralCount: {
          $sum: {
            $cond: [{ $eq: ['$ratings.overall', 3] }, 1, 0]
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get trending feedback topics
feedbackSchema.statics.getTrendingTopics = function(timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        averageRating: { $avg: '$ratings.overall' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get feedback for entity
feedbackSchema.statics.getFeedbackForEntity = function(entityType, entityId, options = {}) {
  const query = {
    'relatedTo.entityType': entityType,
    'relatedTo.entityId': entityId
  };
  
  if (options.approved !== undefined) {
    query['moderation.approved'] = options.approved;
  }
  
  if (options.displayOnWebsite !== undefined) {
    query.displayOnWebsite = options.displayOnWebsite;
  }
  
  return this.find(query)
    .sort({ featured: -1, createdAt: -1 })
    .limit(options.limit || 50)
    .populate('submittedBy', 'firstName lastName profileImage')
    .populate('response.respondedBy', 'firstName lastName');
};

module.exports = mongoose.model('Feedback', feedbackSchema);