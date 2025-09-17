const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getPatientProgress,
  getTherapistPerformance,
  getDashboardAnalytics,
  getRealtimeAnalytics
} = require('../controllers/analyticsController');

const router = express.Router();

// Patient Progress Analytics
router.get('/patient/:patientId/progress', 
  protect, 
  authorize('patient', 'doctor', 'therapist', 'admin'),
  getPatientProgress
);

// Therapist Performance Analytics
router.get('/therapist/:therapistId/performance', 
  protect, 
  authorize('therapist', 'admin'),
  getTherapistPerformance
);

// System-wide Dashboard Analytics (Admin only)
router.get('/dashboard', 
  protect, 
  authorize('admin'),
  getDashboardAnalytics
);

// Real-time Analytics
router.get('/realtime', 
  protect, 
  authorize('admin', 'therapist', 'doctor'),
  getRealtimeAnalytics
);

module.exports = router;