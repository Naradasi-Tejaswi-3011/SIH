const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const cron = require('cron');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.initializeEmailService();
    this.startNotificationCron();
  }

  // Initialize email service
  initializeEmailService() {
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Verify connection
      this.emailTransporter.verify((error, success) => {
        if (error) {
          logger.warn('Email service initialization failed:', error.message);
        } else {
          logger.info('Email service initialized successfully');
        }
      });
    } catch (error) {
      logger.error('Email transporter setup error:', error);
    }
  }

  // Create and send notification
  async createNotification(data) {
    try {
      // Validate recipient exists
      const recipient = await User.findById(data.recipient);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Apply user's notification preferences
      const channels = this.applyUserPreferences(data.channels || {}, recipient.notificationPreferences);

      // Create notification record
      const notification = await Notification.create({
        ...data,
        channels,
        personalization: {
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          ...data.personalization
        },
        status: 'scheduled'
      });

      // Send immediately if marked as immediate or scheduled for now
      if (data.isImmediate || new Date(data.scheduledFor || Date.now()) <= new Date()) {
        await this.processNotification(notification);
      }

      return notification;
    } catch (error) {
      logger.error('Create notification error:', error);
      throw error;
    }
  }

  // Apply user notification preferences
  applyUserPreferences(requestedChannels, userPreferences) {
    const channels = {
      email: {
        enabled: requestedChannels.email?.enabled && userPreferences?.email?.appointments !== false
      },
      sms: {
        enabled: requestedChannels.sms?.enabled && userPreferences?.sms?.appointments !== false
      },
      push: {
        enabled: requestedChannels.push?.enabled && userPreferences?.push?.appointments !== false
      },
      inApp: {
        enabled: requestedChannels.inApp?.enabled !== false // Default to true
      }
    };

    return channels;
  }

  // Process individual notification
  async processNotification(notification) {
    try {
      notification.status = 'sending';
      await notification.save();

      const recipient = await User.findById(notification.recipient);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Check quiet hours
      if (notification.isInQuietHours()) {
        logger.info(`Notification ${notification._id} delayed due to quiet hours`);
        return;
      }

      const promises = [];

      // Send via enabled channels
      if (notification.channels.email.enabled) {
        promises.push(this.sendEmail(notification, recipient));
      }

      if (notification.channels.sms.enabled) {
        promises.push(this.sendSMS(notification, recipient));
      }

      if (notification.channels.push.enabled) {
        promises.push(this.sendPushNotification(notification, recipient));
      }

      // In-app notifications are always stored
      if (notification.channels.inApp.enabled) {
        await notification.updateChannelStatus('inApp', 'sent');
      }

      // Wait for all channels to complete
      await Promise.allSettled(promises);

      notification.status = 'sent';
      await notification.save();

      logger.info(`Notification ${notification._id} processed successfully`);
    } catch (error) {
      logger.error(`Process notification ${notification._id} error:`, error);
      notification.status = 'failed';
      await notification.save();
    }
  }

  // Send email notification
  async sendEmail(notification, recipient) {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: `"AyurSutra" <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject: notification.title,
        html: this.generateEmailTemplate(notification, recipient),
        text: notification.message
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      await notification.updateChannelStatus('email', 'sent', {
        emailId: info.messageId
      });

      logger.info(`Email sent to ${recipient.email} for notification ${notification._id}`);
    } catch (error) {
      logger.error(`Email send error for notification ${notification._id}:`, error);
      await notification.updateChannelStatus('email', 'failed', {
        errorMessage: error.message
      });
    }
  }

  // Send SMS notification
  async sendSMS(notification, recipient) {
    try {
      // SMS implementation would go here using a service like Twilio, TextLocal, etc.
      // For now, we'll simulate the SMS sending

      if (!process.env.SMS_API_KEY) {
        throw new Error('SMS service not configured');
      }

      // Simulate SMS API call
      const smsMessage = this.formatSMSMessage(notification);
      
      // In a real implementation, you would call the SMS API here
      // const response = await this.smsProvider.send(recipient.phone, smsMessage);

      // For simulation, we'll just log and mark as sent
      logger.info(`SMS would be sent to ${recipient.phone}: ${smsMessage}`);

      await notification.updateChannelStatus('sms', 'sent', {
        messageId: `sms_${Date.now()}`
      });

    } catch (error) {
      logger.error(`SMS send error for notification ${notification._id}:`, error);
      await notification.updateChannelStatus('sms', 'failed', {
        errorMessage: error.message
      });
    }
  }

  // Send push notification
  async sendPushNotification(notification, recipient) {
    try {
      // Push notification implementation would go here using Firebase, OneSignal, etc.
      // For now, we'll simulate the push notification

      const pushPayload = {
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification._id,
          type: notification.type,
          ...(notification.relatedTo && {
            entityType: notification.relatedTo.entityType,
            entityId: notification.relatedTo.entityId
          })
        }
      };

      // Simulate push notification sending
      logger.info(`Push notification would be sent to user ${recipient._id}:`, pushPayload);

      await notification.updateChannelStatus('push', 'sent', {
        notificationId: `push_${Date.now()}`
      });

    } catch (error) {
      logger.error(`Push notification send error for notification ${notification._id}:`, error);
      await notification.updateChannelStatus('push', 'failed', {
        errorMessage: error.message
      });
    }
  }

  // Generate HTML email template
  generateEmailTemplate(notification, recipient) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E8B57; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background: #2E8B57; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧘‍♀️ AyurSutra</h1>
            <p>Panchakarma Management System</p>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>Dear ${recipient.firstName},</p>
            <p>${notification.message}</p>
            ${notification.actions && notification.actions.length > 0 ? 
              notification.actions.map(action => 
                `<a href="${action.value}" class="button">${action.label}</a>`
              ).join(' ') : ''
            }
          </div>
          <div class="footer">
            <p>This is an automated message from AyurSutra.</p>
            <p>If you have questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Format SMS message
  formatSMSMessage(notification) {
    let message = `AyurSutra: ${notification.title}\n${notification.message}`;
    
    // Keep SMS under 160 characters if possible
    if (message.length > 160) {
      message = `AyurSutra: ${notification.message}`;
      if (message.length > 160) {
        message = message.substring(0, 157) + '...';
      }
    }
    
    return message;
  }

  // Send appointment reminders
  async sendAppointmentReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      // Find appointments scheduled for tomorrow
      const Appointment = require('../models/Appointment');
      const appointments = await Appointment.find({
        scheduledDateTime: {
          $gte: tomorrow,
          $lte: endOfTomorrow
        },
        status: { $in: ['scheduled', 'confirmed'] }
      }).populate('patient therapy');

      for (const appointment of appointments) {
        await this.createNotification({
          title: 'Appointment Reminder',
          message: `Reminder: You have an appointment for ${appointment.therapy.name} tomorrow at ${appointment.scheduledDateTime.toLocaleTimeString()}.`,
          recipient: appointment.patient._id,
          type: 'appointment_reminder',
          channels: {
            email: { enabled: true },
            sms: { enabled: true },
            inApp: { enabled: true }
          },
          relatedTo: {
            entityType: 'appointment',
            entityId: appointment._id
          },
          isImmediate: true
        });
      }

      logger.info(`Sent reminders for ${appointments.length} appointments`);
    } catch (error) {
      logger.error('Send appointment reminders error:', error);
    }
  }

  // Send preparation reminders
  async sendPreparationReminders() {
    try {
      // Logic to send pre-therapy preparation reminders
      // This would check appointments and send dietary/lifestyle reminders
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const Appointment = require('../models/Appointment');
      const appointments = await Appointment.find({
        scheduledDateTime: {
          $gte: new Date(),
          $lte: threeDaysFromNow
        },
        status: { $in: ['scheduled', 'confirmed'] },
        'preparationStatus.dietaryCompliance.status': 'pending'
      }).populate('patient therapy');

      for (const appointment of appointments) {
        const therapy = appointment.therapy;
        if (therapy.preparation?.preTherapy?.dietary?.length > 0) {
          const dietaryInstructions = therapy.preparation.preTherapy.dietary.join(', ');
          
          await this.createNotification({
            title: 'Pre-Therapy Preparation',
            message: `Please follow these dietary guidelines for your upcoming ${therapy.name} session: ${dietaryInstructions}`,
            recipient: appointment.patient._id,
            type: 'preparation_reminder',
            channels: {
              email: { enabled: true },
              sms: { enabled: true },
              inApp: { enabled: true }
            },
            relatedTo: {
              entityType: 'appointment',
              entityId: appointment._id
            }
          });
        }
      }
    } catch (error) {
      logger.error('Send preparation reminders error:', error);
    }
  }

  // Start notification cron jobs
  startNotificationCron() {
    // Send appointment reminders daily at 9 AM
    const reminderJob = new cron.CronJob('0 9 * * *', () => {
      logger.info('Running appointment reminder job');
      this.sendAppointmentReminders();
    });

    // Send preparation reminders daily at 8 AM
    const preparationJob = new cron.CronJob('0 8 * * *', () => {
      logger.info('Running preparation reminder job');
      this.sendPreparationReminders();
    });

    // Process pending notifications every 5 minutes
    const processingJob = new cron.CronJob('*/5 * * * *', async () => {
      try {
        const pendingNotifications = await Notification.getPendingNotifications();
        for (const notification of pendingNotifications) {
          await this.processNotification(notification);
        }
      } catch (error) {
        logger.error('Notification processing job error:', error);
      }
    });

    // Process retries every 10 minutes
    const retryJob = new cron.CronJob('*/10 * * * *', async () => {
      try {
        const retryNotifications = await Notification.getRetryNotifications();
        for (const notification of retryNotifications) {
          notification.retryCount += 1;
          notification.lastRetryAt = new Date();
          notification.nextRetryAt = new Date(Date.now() + notification.deliveryPreferences.retryInterval * 60000);
          await notification.save();
          
          await this.processNotification(notification);
        }
      } catch (error) {
        logger.error('Notification retry job error:', error);
      }
    });

    // Cleanup expired notifications daily at midnight
    const cleanupJob = new cron.CronJob('0 0 * * *', async () => {
      try {
        await Notification.cleanupExpired();
        logger.info('Expired notifications cleaned up');
      } catch (error) {
        logger.error('Cleanup job error:', error);
      }
    });

    // Start all jobs
    reminderJob.start();
    preparationJob.start();
    processingJob.start();
    retryJob.start();
    cleanupJob.start();

    logger.info('Notification cron jobs started successfully');
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type
      } = options;

      const query = {
        recipient: userId,
        'channels.inApp.enabled': true
      };

      if (unreadOnly) {
        query['channels.inApp.status'] = { $ne: 'read' };
      }

      if (type) {
        query.type = type;
      }

      const skip = (page - 1) * limit;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title message type createdAt channels.inApp actionRequired actions');

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        'channels.inApp.enabled': true,
        'channels.inApp.status': { $ne: 'read' }
      });

      return {
        notifications,
        total,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get user notifications error:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();
      return notification;
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Track notification click
  async trackClick(notificationId, action) {
    try {
      const notification = await Notification.findById(notificationId);
      if (notification) {
        await notification.trackClick(action);
      }
    } catch (error) {
      logger.error('Track notification click error:', error);
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();