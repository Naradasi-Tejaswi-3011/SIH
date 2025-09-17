const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { validateNotification } = require('../utils/validators');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly, type } = req.query;
    
    const result = await notificationService.getUserNotifications(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    next(error);
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
const getNotification = async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Get notification error:', error);
    next(error);
  }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (admin, doctor, therapist)
const createNotification = async (req, res, next) => {
  try {
    const { error } = validateNotification(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const notificationData = {
      ...req.body,
      createdBy: req.user._id
    };

    const notification = await notificationService.createNotification(notificationData);

    logger.info(`Notification created by ${req.user.email}: ${notification._id}`);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    // Real-time update via Socket.io
    const io = req.app.get('io');
    io.to(req.user._id.toString()).emit('notification_read', {
      notificationId: notification._id,
      readAt: notification.channels.inApp.readAt
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        'channels.inApp.enabled': true,
        'channels.inApp.status': { $ne: 'read' }
      },
      {
        $set: {
          'channels.inApp.status': 'read',
          'channels.inApp.readAt': new Date()
        }
      }
    );

    // Real-time update
    const io = req.app.get('io');
    io.to(req.user._id.toString()).emit('notifications_read_all', {
      count: result.modifiedCount,
      readAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    logger.error('Mark all as read error:', error);
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Real-time update
    const io = req.app.get('io');
    io.to(req.user._id.toString()).emit('notification_deleted', {
      notificationId: notification._id
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    next(error);
  }
};

// @desc    Track notification click
// @route   POST /api/notifications/:id/click
// @access  Private
const trackClick = async (req, res, next) => {
  try {
    const { action } = req.body;
    
    await notificationService.trackClick(req.params.id, action);

    res.status(200).json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    logger.error('Track click error:', error);
    next(error);
  }
};

// @desc    Get notification statistics (admin only)
// @route   GET /api/notifications/stats
// @access  Private (admin)
const getNotificationStats = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const Notification = require('../models/Notification');
    
    // Build match query
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (type) {
      matchQuery.type = type;
    }

    // Aggregation pipeline for comprehensive stats
    const stats = await Notification.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          emailSent: { $sum: { $cond: [{ $eq: ['$channels.email.status', 'sent'] }, 1, 0] } },
          smsSent: { $sum: { $cond: [{ $eq: ['$channels.sms.status', 'sent'] }, 1, 0] } },
          pushSent: { $sum: { $cond: [{ $eq: ['$channels.push.status', 'sent'] }, 1, 0] } },
          inAppRead: { $sum: { $cond: [{ $eq: ['$channels.inApp.status', 'read'] }, 1, 0] } },
          avgInteractionScore: { $avg: '$tracking.interactionScore' },
          totalClicks: { $sum: '$tracking.clicked.count' }
        }
      }
    ]);

    // Get stats by type
    const typeStats = await Notification.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgRating: { $avg: '$tracking.interactionScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          emailSent: 0,
          smsSent: 0,
          pushSent: 0,
          inAppRead: 0,
          avgInteractionScore: 0,
          totalClicks: 0
        },
        byType: typeStats
      }
    });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    next(error);
  }
};

// @desc    Send bulk notifications (admin only)
// @route   POST /api/notifications/bulk
// @access  Private (admin)
const sendBulkNotifications = async (req, res, next) => {
  try {
    const { recipients, template, scheduledFor } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required'
      });
    }

    const results = [];
    
    for (const recipientId of recipients) {
      try {
        const notification = await notificationService.createNotification({
          ...template,
          recipient: recipientId,
          scheduledFor: scheduledFor || Date.now(),
          createdBy: req.user._id
        });
        
        results.push({
          recipientId,
          notificationId: notification._id,
          success: true
        });
      } catch (error) {
        results.push({
          recipientId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    logger.info(`Bulk notifications sent by ${req.user.email}: ${successCount}/${recipients.length}`);

    res.status(200).json({
      success: true,
      message: `Bulk notifications processed: ${successCount}/${recipients.length} successful`,
      data: results
    });
  } catch (error) {
    logger.error('Send bulk notifications error:', error);
    next(error);
  }
};

module.exports = {
  getNotifications,
  getNotification,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  trackClick,
  getNotificationStats,
  sendBulkNotifications
};