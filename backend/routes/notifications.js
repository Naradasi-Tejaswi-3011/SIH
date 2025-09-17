const express = require('express');
const { protect, authorize, logActivity } = require('../middleware/auth');
const {
  getNotifications,
  getNotification,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  trackClick,
  getNotificationStats,
  sendBulkNotifications
} = require('../controllers/notificationController');

const router = express.Router();

// Special routes first (to avoid conflicts with /:id)
router.get('/stats', protect, authorize('admin'), getNotificationStats);
router.put('/read-all', protect, markAllAsRead);
router.post('/bulk', protect, authorize('admin'), logActivity('bulk_notification'), sendBulkNotifications);

// CRUD operations
router.get('/', protect, getNotifications);
router.get('/:id', protect, getNotification);
router.post('/', protect, authorize('admin', 'doctor', 'therapist'), logActivity('notification_create'), createNotification);
router.delete('/:id', protect, deleteNotification);

// Special actions
router.put('/:id/read', protect, markAsRead);
router.post('/:id/click', protect, trackClick);

module.exports = router;
