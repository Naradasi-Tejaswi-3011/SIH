const express = require('express');
const { protect, authorize, logActivity } = require('../middleware/auth');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getTherapistAvailability
} = require('../controllers/appointmentController');
const {
  startTherapySession,
  updateSessionProgress,
  completeTherapySession,
  getSessionStatus,
  getLiveSessionData
} = require('../controllers/therapyTrackingController');

const router = express.Router();

// Get therapist availability - moved before /:id to avoid conflicts
router.get('/availability/:therapistId/:date', protect, getTherapistAvailability);

// CRUD operations
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.post('/', protect, authorize('admin', 'doctor', 'patient'), logActivity('appointment_create'), createAppointment);
router.put('/:id', protect, logActivity('appointment_update'), updateAppointment);

// Special actions
router.put('/:id/cancel', protect, logActivity('appointment_cancel'), cancelAppointment);
router.put('/:id/reschedule', protect, logActivity('appointment_reschedule'), rescheduleAppointment);

// Therapy session tracking routes
router.put('/:id/start-session', 
  protect, 
  authorize('therapist', 'admin'), 
  logActivity('start_therapy_session'),
  startTherapySession
);

router.put('/:id/update-progress', 
  protect, 
  authorize('patient', 'therapist', 'admin'), 
  logActivity('update_session_progress'),
  updateSessionProgress
);

router.put('/:id/complete-session', 
  protect, 
  authorize('therapist', 'admin'), 
  logActivity('complete_therapy_session'),
  completeTherapySession
);

router.get('/:id/session-status', 
  protect, 
  getSessionStatus
);

router.get('/:id/live-data', 
  protect, 
  getLiveSessionData
);

module.exports = router;
