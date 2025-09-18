const Joi = require('joi');

// User registration validation
const validateRegistration = (data) => {
  const schema = Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    
    phone: Joi.string()
      .pattern(/^\+?[\d\s-()]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'string.empty': 'Phone number is required'
      }),
    
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.empty': 'Password is required'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .messages({
        'any.only': 'Passwords do not match'
      }),
    
    role: Joi.string()
      .valid('patient', 'doctor', 'therapist', 'admin')
      .default('patient'),
    
    // Patient-specific fields
    dateOfBirth: Joi.when('role', {
      is: 'patient',
      then: Joi.date()
        .max('now')
        .required()
        .messages({
          'date.max': 'Date of birth cannot be in the future',
          'any.required': 'Date of birth is required for patients'
        }),
      otherwise: Joi.date().optional()
    }),
    
    gender: Joi.when('role', {
      is: 'patient',
      then: Joi.string()
        .valid('male', 'female', 'other')
        .required()
        .messages({
          'any.only': 'Gender must be male, female, or other',
          'any.required': 'Gender is required for patients'
        }),
      otherwise: Joi.string().valid('male', 'female', 'other').optional()
    }),
    
    // Address (optional)
    address: Joi.object({
      street: Joi.string().max(100),
      city: Joi.string().max(50),
      state: Joi.string().max(50),
      postalCode: Joi.string().max(20),
      country: Joi.string().max(50)
    }).optional(),
    
    // Medical history (optional for patients)
    medicalHistory: Joi.object({
      allergies: Joi.array().items(Joi.string()),
      currentMedications: Joi.array().items(Joi.string()),
      chronicConditions: Joi.array().items(Joi.string()),
      previousSurgeries: Joi.array().items(Joi.string()),
      emergencyContact: Joi.object({
        name: Joi.string().max(100),
        relationship: Joi.string().max(50),
        phone: Joi.string().pattern(/^\+?[\d\s-()]+$/)
      })
    }).optional(),
    
    // Professional info (for doctors/therapists)
    professionalInfo: Joi.object({
      licenseNumber: Joi.string().max(50),
      specialization: Joi.array().items(Joi.string()),
      experience: Joi.number().min(0).max(50),
      qualifications: Joi.array().items(Joi.string()),
      consultationFee: Joi.number().min(0),
      languages: Joi.array().items(Joi.string())
    }).optional()
  });

  return schema.validate(data);
};

// User login validation
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  });

  return schema.validate(data);
};

// Appointment validation
const validateAppointment = (data) => {
  const schema = Joi.object({
    patient: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid patient ID',
        'string.empty': 'Patient ID is required'
      }),
    
    doctor: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid doctor ID',
        'string.empty': 'Doctor ID is required'
      }),
    
    therapist: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid therapist ID',
        'string.empty': 'Therapist ID is required'
      }),
    
    therapy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid therapy ID',
        'string.empty': 'Therapy ID is required'
      }),
    
    scheduledDateTime: Joi.date()
      .min('now')
      .required()
      .messages({
        'date.min': 'Appointment date cannot be in the past',
        'any.required': 'Scheduled date and time is required'
      }),
    
    estimatedDuration: Joi.number()
      .min(15)
      .max(480)
      .required()
      .messages({
        'number.min': 'Duration must be at least 15 minutes',
        'number.max': 'Duration cannot exceed 8 hours',
        'any.required': 'Estimated duration is required'
      }),
    
    appointmentType: Joi.string()
      .valid('new_patient', 'follow_up', 'emergency', 'consultation')
      .default('follow_up'),
    
    priority: Joi.string()
      .valid('low', 'normal', 'high', 'urgent')
      .default('normal'),
    
    notes: Joi.string().max(1000),
    
    room: Joi.object({
      roomNumber: Joi.string().max(10),
      roomType: Joi.string().valid('standard', 'specialized', 'steam_room', 'oil_room'),
      floor: Joi.string().max(10),
      building: Joi.string().max(50)
    }).optional()
  });

  return schema.validate(data);
};

// Therapy validation
const validateTherapy = (data) => {
  const schema = Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.empty': 'Therapy name is required',
        'string.min': 'Therapy name must be at least 2 characters',
        'string.max': 'Therapy name cannot exceed 200 characters'
      }),
    
    sanskritName: Joi.string()
      .trim()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.empty': 'Sanskrit name is required',
        'string.min': 'Sanskrit name must be at least 2 characters',
        'string.max': 'Sanskrit name cannot exceed 200 characters'
      }),
    
    category: Joi.string()
      .valid('shodhana', 'shamana', 'rasayana', 'satvavajaya', 'daivavyapashraya')
      .required()
      .messages({
        'any.only': 'Category must be one of: shodhana, shamana, rasayana, satvavajaya, daivavyapashraya',
        'any.required': 'Therapy category is required'
      }),
    
    description: Joi.string()
      .min(10)
      .max(2000)
      .required()
      .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 2000 characters',
        'any.required': 'Therapy description is required'
      }),
    
    benefits: Joi.array().items(Joi.string().max(200)),
    indications: Joi.array().items(Joi.string().max(200)),
    contraindications: Joi.array().items(Joi.string().max(200)),
    
    duration: Joi.object({
      perSession: Joi.number()
        .min(15)
        .max(480)
        .required()
        .messages({
          'number.min': 'Session duration must be at least 15 minutes',
          'number.max': 'Session duration cannot exceed 8 hours',
          'any.required': 'Session duration is required'
        }),
      
      totalCourse: Joi.number()
        .min(1)
        .max(100)
        .required()
        .messages({
          'number.min': 'Total course must be at least 1 session',
          'number.max': 'Total course cannot exceed 100 sessions',
          'any.required': 'Total course duration is required'
        }),
      
      frequency: Joi.string()
        .valid('daily', 'alternate_days', 'weekly', 'bi_weekly')
        .default('daily')
    }).required(),
    
    pricing: Joi.object({
      basePrice: Joi.number()
        .min(0)
        .required()
        .messages({
          'number.min': 'Price cannot be negative',
          'any.required': 'Base price is required'
        }),
      
      currency: Joi.string()
        .valid('INR', 'USD', 'EUR', 'GBP')
        .default('INR'),
      
      packageDiscount: Joi.number()
        .min(0)
        .max(100)
        .default(0)
    }).required(),
    
    requirements: Joi.object({
      room: Joi.object({
        type: Joi.string()
          .valid('standard', 'specialized', 'steam_room', 'oil_room')
          .default('standard'),
        temperature: Joi.object({
          min: Joi.number().min(-10).max(50),
          max: Joi.number().min(-10).max(50)
        }),
        humidity: Joi.object({
          min: Joi.number().min(0).max(100),
          max: Joi.number().min(0).max(100)
        })
      }),
      equipment: Joi.array().items(Joi.string().max(100)),
      materials: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().min(0),
        unit: Joi.string().max(20),
        cost: Joi.number().min(0)
      })),
      staffRequired: Joi.object({
        therapists: Joi.number().min(1).default(1),
        assistants: Joi.number().min(0).default(0),
        specialization: Joi.array().items(Joi.string())
      })
    }).optional()
  });

  return schema.validate(data);
};

// Feedback validation
const validateFeedback = (data) => {
  const schema = Joi.object({
    relatedTo: Joi.object({
      entityType: Joi.string()
        .valid('appointment', 'therapy', 'therapist', 'doctor', 'center', 'system')
        .required(),
      entityId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
      entityName: Joi.string().max(200)
    }).required(),
    
    feedbackType: Joi.string()
      .valid(
        'session_feedback',
        'therapy_completion',
        'service_quality',
        'facility_feedback',
        'staff_feedback',
        'system_feedback',
        'complaint',
        'suggestion',
        'testimonial'
      )
      .required(),
    
    category: Joi.string()
      .valid('positive', 'neutral', 'negative', 'complaint', 'suggestion')
      .required(),
    
    ratings: Joi.object({
      overall: Joi.number()
        .min(1)
        .max(5)
        .required()
        .messages({
          'number.min': 'Rating must be at least 1',
          'number.max': 'Rating cannot exceed 5',
          'any.required': 'Overall rating is required'
        }),
      
      effectiveness: Joi.number().min(1).max(5),
      comfort: Joi.number().min(1).max(5),
      professionalism: Joi.number().min(1).max(5),
      cleanliness: Joi.number().min(1).max(5),
      punctuality: Joi.number().min(1).max(5),
      communication: Joi.number().min(1).max(5),
      facilities: Joi.number().min(1).max(5),
      valueForMoney: Joi.number().min(1).max(5)
    }).required(),
    
    feedback: Joi.object({
      title: Joi.string().max(200),
      description: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .messages({
          'string.min': 'Feedback description must be at least 10 characters',
          'string.max': 'Feedback description cannot exceed 2000 characters',
          'any.required': 'Feedback description is required'
        }),
      
      positiveAspects: Joi.array().items(Joi.string().max(500)),
      improvementAreas: Joi.array().items(Joi.string().max(500)),
      suggestions: Joi.array().items(Joi.string().max(500))
    }).required(),
    
    healthOutcomes: Joi.object({
      overallImprovement: Joi.string()
        .valid('much_worse', 'worse', 'no_change', 'better', 'much_better'),
      
      wouldRecommend: Joi.boolean(),
      
      recommendationScore: Joi.number()
        .min(0)
        .max(10),
      
      sideEffects: Joi.array().items(Joi.object({
        effect: Joi.string().required(),
        severity: Joi.string().valid('mild', 'moderate', 'severe'),
        duration: Joi.string(),
        resolved: Joi.boolean()
      }))
    }).optional(),
    
    isAnonymous: Joi.boolean().default(false),
    consentForSharing: Joi.boolean().default(false),
    consentForTestimonial: Joi.boolean().default(false)
  });

  return schema.validate(data);
};

// Notification validation
const validateNotification = (data) => {
  const schema = Joi.object({
    title: Joi.string()
      .trim()
      .min(1)
      .max(200)
      .required(),
    
    message: Joi.string()
      .trim()
      .min(1)
      .max(1000)
      .required(),
    
    recipient: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
    
    type: Joi.string()
      .valid(
        'appointment_reminder',
        'appointment_confirmation',
        'appointment_cancellation',
        'appointment_rescheduled',
        'preparation_reminder',
        'dietary_instruction',
        'medication_reminder',
        'session_followup',
        'therapy_completion',
        'feedback_request',
        'payment_reminder',
        'system_alert',
        'promotional',
        'educational'
      )
      .required(),
    
    category: Joi.string()
      .valid('urgent', 'important', 'normal', 'low')
      .default('normal'),
    
    channels: Joi.object({
      email: Joi.object({
        enabled: Joi.boolean().default(false)
      }),
      sms: Joi.object({
        enabled: Joi.boolean().default(false)
      }),
      push: Joi.object({
        enabled: Joi.boolean().default(false)
      }),
      inApp: Joi.object({
        enabled: Joi.boolean().default(true)
      })
    }).default({}),
    
    scheduledFor: Joi.date().default(() => new Date()),
    
    relatedTo: Joi.object({
      entityType: Joi.string()
        .valid('appointment', 'therapy', 'user', 'payment', 'feedback'),
      entityId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
    }).optional(),
    
    actionRequired: Joi.boolean().default(false),
    
    actions: Joi.array().items(Joi.object({
      label: Joi.string().required(),
      type: Joi.string().valid('url', 'deeplink', 'function', 'call').required(),
      value: Joi.string().required(),
      primary: Joi.boolean().default(false)
    })).optional()
  });

  return schema.validate(data);
};

// Generic ObjectId validation
const validateObjectId = (id) => {
  const schema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
  return schema.validate(id);
};

// Pagination validation
const validatePagination = (data) => {
  const schema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  });

  return schema.validate(data);
};

// User update validation
const validateUserUpdate = (data) => {
  const schema = Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .optional(),
    
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .optional(),
    
    phone: Joi.string()
      .pattern(/^\+?[\d\s-()]+$/)
      .optional(),
    
    address: Joi.object({
      street: Joi.string().max(100),
      city: Joi.string().max(50),
      state: Joi.string().max(50),
      postalCode: Joi.string().max(20),
      country: Joi.string().max(50)
    }).optional(),
    
    medicalHistory: Joi.object({
      allergies: Joi.array().items(Joi.string()),
      currentMedications: Joi.array().items(Joi.string()),
      chronicConditions: Joi.array().items(Joi.string()),
      previousSurgeries: Joi.array().items(Joi.string()),
      emergencyContact: Joi.object({
        name: Joi.string().max(100),
        relationship: Joi.string().max(50),
        phone: Joi.string().pattern(/^\+?[\d\s-()]+$/)
      })
    }).optional(),
    
    professionalInfo: Joi.object({
      licenseNumber: Joi.string().max(50),
      specialization: Joi.array().items(Joi.string()),
      experience: Joi.number().min(0).max(50),
      qualifications: Joi.array().items(Joi.string()),
      availability: Joi.array().items(Joi.object({
        dayOfWeek: Joi.number().min(0).max(6),
        startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        isAvailable: Joi.boolean().default(true)
      })),
      consultationFee: Joi.number().min(0),
      languages: Joi.array().items(Joi.string())
    }).optional(),
    
    notificationPreferences: Joi.object({
      email: Joi.object({
        appointments: Joi.boolean(),
        reminders: Joi.boolean(),
        updates: Joi.boolean()
      }),
      sms: Joi.object({
        appointments: Joi.boolean(),
        reminders: Joi.boolean(),
        updates: Joi.boolean()
      }),
      push: Joi.object({
        appointments: Joi.boolean(),
        reminders: Joi.boolean(),
        updates: Joi.boolean()
      })
    }).optional(),
    
    // Admin only fields
    isActive: Joi.boolean().optional(),
    role: Joi.string().valid('patient', 'doctor', 'therapist', 'admin').optional()
  });

  return schema.validate(data);
};

// Therapy update validation (more lenient than create)
const validateTherapyUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(200)
      .optional(),
    
    sanskritName: Joi.string()
      .trim()
      .min(2)
      .max(200)
      .optional(),
    
    category: Joi.string()
      .valid('shodhana', 'shamana', 'rasayana', 'satvavajaya', 'daivavyapashraya')
      .optional(),
    
    description: Joi.string()
      .min(10)
      .max(2000)
      .optional(),
    
    benefits: Joi.array().items(Joi.string().max(200)),
    indications: Joi.array().items(Joi.string().max(200)),
    contraindications: Joi.array().items(Joi.string().max(200)),
    
    duration: Joi.object({
      perSession: Joi.number().min(15).max(480),
      totalCourse: Joi.number().min(1).max(100),
      frequency: Joi.string().valid('daily', 'alternate_days', 'weekly', 'bi_weekly')
    }).optional(),
    
    pricing: Joi.object({
      basePrice: Joi.number().min(0),
      currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP'),
      packageDiscount: Joi.number().min(0).max(100)
    }).optional(),
    
    requirements: Joi.object({
      room: Joi.object({
        type: Joi.string().valid('standard', 'specialized', 'steam_room', 'oil_room'),
        temperature: Joi.object({
          min: Joi.number().min(-10).max(50),
          max: Joi.number().min(-10).max(50)
        }),
        humidity: Joi.object({
          min: Joi.number().min(0).max(100),
          max: Joi.number().min(0).max(100)
        })
      }),
      equipment: Joi.array().items(Joi.string().max(100)),
      materials: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().min(0),
        unit: Joi.string().max(20),
        cost: Joi.number().min(0)
      })),
      staffRequired: Joi.object({
        therapists: Joi.number().min(1),
        assistants: Joi.number().min(0),
        specialization: Joi.array().items(Joi.string())
      })
    }).optional(),
    
    scheduling: Joi.object({
      preferredTimeSlots: Joi.array().items(Joi.string()),
      seasonalPreferences: Joi.array().items(Joi.string()),
      minRestBetweenSessions: Joi.number().min(0),
      maxSessionsPerDay: Joi.number().min(1)
    }).optional(),
    
    safety: Joi.object({
      contraindications: Joi.array().items(Joi.string()),
      sideEffects: Joi.array().items(Joi.string()),
      precautions: Joi.array().items(Joi.string())
    }).optional(),
    
    isActive: Joi.boolean().optional(),
    isAvailable: Joi.boolean().optional()
  });

  return schema.validate(data);
};

// Simplified feedback validation for new API structure
const validateSimpleFeedback = (data) => {
  const schema = Joi.object({
    appointment: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
    
    rating: Joi.number()
      .min(1)
      .max(5)
      .required(),
    
    comment: Joi.string()
      .min(10)
      .max(2000)
      .optional(),
    
    type: Joi.string()
      .valid('general', 'therapy', 'service', 'staff', 'facility')
      .default('general'),
    
    categories: Joi.array()
      .items(Joi.string().max(100))
      .default(['general']),
    
    tags: Joi.array()
      .items(Joi.string().max(50))
      .optional(),
    
    isAnonymous: Joi.boolean().default(false)
  });

  return schema.validate(data);
};

// Feedback response validation
const validateFeedbackResponse = (data) => {
  const schema = Joi.object({
    response: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Response must be at least 10 characters',
        'string.max': 'Response cannot exceed 1000 characters',
        'any.required': 'Response text is required'
      }),
    
    isPublic: Joi.boolean().default(true)
  });

  return schema.validate(data);
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateAppointment,
  validateTherapy,
  validateTherapyUpdate,
  validateUserUpdate,
  validateFeedback,
  validateSimpleFeedback,
  validateFeedbackResponse,
  validateNotification,
  validateObjectId,
  validatePagination
};
