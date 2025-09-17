const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Recipients
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notification Type and Category
  type: {
    type: String,
    enum: [
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
    ],
    required: [true, 'Notification type is required']
  },
  category: {
    type: String,
    enum: ['urgent', 'important', 'normal', 'low'],
    default: 'normal'
  },
  
  // Content and Templates
  template: {
    name: String,
    version: String,
    variables: mongoose.Schema.Types.Mixed // Dynamic template variables
  },
  
  // Delivery Channels
  channels: {
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date,
      emailId: String,
      errorMessage: String
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date,
      messageId: String,
      errorMessage: String
    },
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date,
      notificationId: String,
      errorMessage: String
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'read', 'deleted'],
        default: 'sent'
      },
      readAt: Date
    }
  },
  
  // Scheduling and Timing
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  isImmediate: {
    type: Boolean,
    default: false
  },
  
  // Related Entities
  relatedTo: {
    entityType: {
      type: String,
      enum: ['appointment', 'therapy', 'user', 'payment', 'feedback'],
    },
    entityId: mongoose.Schema.Types.ObjectId
  },
  
  // Action Items
  actionRequired: {
    type: Boolean,
    default: false
  },
  actions: [{
    label: String,
    type: {
      type: String,
      enum: ['url', 'deeplink', 'function', 'call']
    },
    value: String,
    primary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Personalization
  personalization: {
    recipientName: String,
    customFields: mongoose.Schema.Types.Mixed
  },
  
  // Delivery Preferences
  deliveryPreferences: {
    respectQuietHours: {
      type: Boolean,
      default: true
    },
    quietHours: {
      start: {
        type: String,
        default: '22:00'
      },
      end: {
        type: String,
        default: '08:00'
      }
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    retryInterval: {
      type: Number,
      default: 5 // minutes
    }
  },
  
  // Tracking and Analytics
  tracking: {
    opened: {
      count: {
        type: Number,
        default: 0
      },
      firstOpenedAt: Date,
      lastOpenedAt: Date
    },
    clicked: {
      count: {
        type: Number,
        default: 0
      },
      firstClickedAt: Date,
      lastClickedAt: Date,
      clickedActions: [String]
    },
    interactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'draft'
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  // Retry Logic
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: Date,
  nextRetryAt: Date,
  
  // Expiration
  expiresAt: Date,
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  tags: [String],
  
  // Campaign Information (for bulk notifications)
  campaign: {
    id: String,
    name: String,
    type: String
  },
  
  // Localization
  language: {
    type: String,
    default: 'en'
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, scheduledFor: 1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'channels.email.status': 1 });
notificationSchema.index({ 'channels.sms.status': 1 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set expiration if not set (default 30 days from creation)
  if (!this.expiresAt) {
    const expirationDate = new Date(this.createdAt || Date.now());
    expirationDate.setDate(expirationDate.getDate() + 30);
    this.expiresAt = expirationDate;
  }
  
  // Check if expired
  this.isExpired = this.expiresAt <= Date.now();
  
  next();
});

// Virtual for overall delivery status
notificationSchema.virtual('overallStatus').get(function() {
  const channels = this.channels;
  let hasSuccess = false;
  let hasPending = false;
  let hasFailed = false;
  
  ['email', 'sms', 'push', 'inApp'].forEach(channel => {
    if (channels[channel].enabled) {
      const status = channels[channel].status;
      if (['delivered', 'read'].includes(status)) {
        hasSuccess = true;
      } else if (status === 'pending') {
        hasPending = true;
      } else if (['failed', 'bounced'].includes(status)) {
        hasFailed = true;
      }
    }
  });
  
  if (hasSuccess) return 'delivered';
  if (hasPending) return 'pending';
  if (hasFailed) return 'failed';
  return 'unknown';
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (this.channels.inApp.enabled) {
    this.channels.inApp.status = 'read';
    this.channels.inApp.readAt = new Date();
  }
  
  // Update tracking
  if (this.tracking.opened.count === 0) {
    this.tracking.opened.firstOpenedAt = new Date();
  }
  this.tracking.opened.count += 1;
  this.tracking.opened.lastOpenedAt = new Date();
  
  return this.save();
};

// Method to track click
notificationSchema.methods.trackClick = function(action) {
  // Update tracking
  if (this.tracking.clicked.count === 0) {
    this.tracking.clicked.firstClickedAt = new Date();
  }
  this.tracking.clicked.count += 1;
  this.tracking.clicked.lastClickedAt = new Date();
  
  if (action && !this.tracking.clicked.clickedActions.includes(action)) {
    this.tracking.clicked.clickedActions.push(action);
  }
  
  // Update interaction score
  this.tracking.interactionScore = Math.min(100, this.tracking.interactionScore + 10);
  
  return this.save();
};

// Method to check if notification is in quiet hours
notificationSchema.methods.isInQuietHours = function(timezone = null) {
  if (!this.deliveryPreferences.respectQuietHours) {
    return false;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;
  
  const [startHour, startMin] = this.deliveryPreferences.quietHours.start.split(':');
  const [endHour, endMin] = this.deliveryPreferences.quietHours.end.split(':');
  
  const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
  const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentTimeMinutes >= startMinutes || currentTimeMinutes <= endMinutes;
  }
  
  return currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
};

// Method to update channel status
notificationSchema.methods.updateChannelStatus = function(channel, status, metadata = {}) {
  if (this.channels[channel]) {
    this.channels[channel].status = status;
    
    if (status === 'sent') {
      this.channels[channel].sentAt = new Date();
      if (metadata.messageId) this.channels[channel].messageId = metadata.messageId;
      if (metadata.emailId) this.channels[channel].emailId = metadata.emailId;
      if (metadata.notificationId) this.channels[channel].notificationId = metadata.notificationId;
    } else if (status === 'delivered') {
      this.channels[channel].deliveredAt = new Date();
    } else if (status === 'failed') {
      if (metadata.errorMessage) {
        this.channels[channel].errorMessage = metadata.errorMessage;
      }
    }
    
    this.updatedAt = Date.now();
  }
  
  return this.save();
};

// Static method to get pending notifications
notificationSchema.statics.getPendingNotifications = function() {
  return this.find({
    scheduledFor: { $lte: new Date() },
    status: 'scheduled',
    isExpired: false,
    $or: [
      { 'channels.email.enabled': true, 'channels.email.status': 'pending' },
      { 'channels.sms.enabled': true, 'channels.sms.status': 'pending' },
      { 'channels.push.enabled': true, 'channels.push.status': 'pending' }
    ]
  }).sort({ priority: -1, scheduledFor: 1 });
};

// Static method to get retry notifications
notificationSchema.statics.getRetryNotifications = function() {
  return this.find({
    nextRetryAt: { $lte: new Date() },
    retryCount: { $lt: { $expr: '$deliveryPreferences.maxRetries' } },
    isExpired: false,
    $or: [
      { 'channels.email.status': 'failed' },
      { 'channels.sms.status': 'failed' },
      { 'channels.push.status': 'failed' }
    ]
  });
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { expiresAt: { $lte: new Date() }, isExpired: false },
    { $set: { isExpired: true } }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);