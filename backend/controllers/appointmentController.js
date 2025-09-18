const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Therapy = require('../models/Therapy');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const { validateAppointment } = require('../utils/validators');
const moment = require('moment');

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate, therapist, patient } = req.query;
    
    // Build query based on user role and filters
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'therapist') {
      query.therapist = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }
    
    // Additional filters
    if (status) query.status = status;
    if (therapist && req.user.role !== 'therapist') query.therapist = therapist;
    if (patient && req.user.role === 'admin') query.patient = patient;
    
    // Date range filter
    if (startDate && endDate) {
      query.scheduledDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const skip = (page - 1) * limit;
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName professionalInfo.specialization')
      .populate('therapist', 'firstName lastName professionalInfo.specialization')
      .populate('therapy', 'name sanskritName duration pricing')
      .sort({ scheduledDateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Appointment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: appointments
    });
  } catch (error) {
    logger.error('Get appointments error:', error);
    next(error);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone medicalHistory')
      .populate('doctor', 'firstName lastName professionalInfo')
      .populate('therapist', 'firstName lastName professionalInfo')
      .populate('therapy');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user has permission to view this appointment
    const userIsParticipant = 
      appointment.patient._id.toString() === req.user._id.toString() ||
      appointment.doctor._id.toString() === req.user._id.toString() ||
      appointment.therapist._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';
    
    if (!userIsParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    logger.error('Get appointment error:', error);
    next(error);
  }
};

// @desc    Create appointment with smart scheduling
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res, next) => {
  try {
    const { patient, doctor, therapist, therapy, scheduledDateTime, notes } = req.body;
    
    // First get therapy data to set estimatedDuration if not provided
    const therapyData = await Therapy.findById(therapy);
    if (!therapyData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid therapy specified'
      });
    }
    
    // Add estimated duration from therapy if not provided
    const appointmentData = {
      ...req.body,
      estimatedDuration: req.body.estimatedDuration || therapyData.duration.perSession
    };
    
    const { error } = validateAppointment(appointmentData);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    // Verify all participants exist and have correct roles
    const [patientUser, doctorUser, therapistUser] = await Promise.all([
      User.findOne({ _id: patient, role: 'patient' }),
      User.findOne({ _id: doctor, role: 'doctor' }),
      User.findOne({ _id: therapist, role: 'therapist' })
    ]);
    
    if (!patientUser || !doctorUser || !therapistUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant specified'
      });
    }
    
    // Smart scheduling - check for conflicts
    const appointmentStart = new Date(scheduledDateTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + therapyData.duration.perSession * 60000);
    
    // Check therapist availability
    const conflicts = await Appointment.findConflicts(therapist, appointmentStart, appointmentEnd);
    
    if (conflicts.length > 0) {
      // Suggest alternative slots
      const alternativeSlots = await findAlternativeSlots(
        therapist, 
        appointmentStart, 
        therapyData.duration.perSession
      );
      
      return res.status(409).json({
        success: false,
        message: 'Time slot not available',
        conflicts: conflicts.map(conflict => ({
          id: conflict._id,
          scheduledDateTime: conflict.scheduledDateTime,
          therapy: conflict.therapy
        })),
        suggestions: alternativeSlots
      });
    }
    
    // Check room availability (simplified - could be enhanced)
    const roomType = therapyData.requirements?.room?.type || 'standard';
    
    // Create appointment
    const appointment = await Appointment.create({
      patient,
      doctor,
      therapist,
      therapy,
      scheduledDateTime: appointmentStart,
      estimatedDuration: therapyData.duration.perSession,
      courseInfo: {
        totalSessions: therapyData.duration.totalCourse,
        currentSession: 1,
        sessionType: 'therapy_session'
      },
      room: {
        roomType: roomType
      },
      payment: {
        amount: therapyData.pricing.basePrice,
        currency: therapyData.pricing.currency,
        status: 'pending'
      },
      createdBy: req.user._id,
      doctorNotes: notes
    });
    
    // Populate the created appointment
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName' },
      { path: 'therapist', select: 'firstName lastName' },
      { path: 'therapy', select: 'name sanskritName duration pricing' }
    ]);
    
    // Send notifications to all participants
    await sendAppointmentNotifications(appointment, 'appointment_confirmation');
    
    // Real-time update via Socket.io
    const io = req.app.get('io');
    io.emit('appointment_created', {
      appointmentId: appointment._id,
      patient: appointment.patient._id,
      therapist: appointment.therapist._id,
      doctor: appointment.doctor._id,
      scheduledDateTime: appointment.scheduledDateTime
    });
    
    logger.info(`Appointment created: ${appointment.appointmentId} by ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: appointment
    });
  } catch (error) {
    logger.error('Create appointment error:', error);
    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check permissions
    const canUpdate = 
      appointment.doctor.toString() === req.user._id.toString() ||
      appointment.therapist.toString() === req.user._id.toString() ||
      req.user.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }
    
    // Prevent updating completed or cancelled appointments
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled appointments'
      });
    }
    
    const allowedUpdates = [
      'status', 'doctorNotes', 'therapistNotes', 'sessionProgress',
      'preparationStatus', 'qualityMetrics'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    updates.updatedBy = req.user._id;
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('patient doctor therapist therapy');
    
    // Real-time update
    const io = req.app.get('io');
    io.emit('appointment_updated', {
      appointmentId: updatedAppointment._id,
      updates,
      updatedBy: req.user._id
    });
    
    logger.info(`Appointment updated: ${updatedAppointment.appointmentId} by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    logger.error('Update appointment error:', error);
    next(error);
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled (less than 24 hours notice or already completed)'
      });
    }
    
    const { reason } = req.body;
    
    appointment.status = 'cancelled';
    appointment.cancellationInfo = {
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
      reason: reason || 'No reason provided'
    };
    
    await appointment.save();
    
    // Send cancellation notifications
    await sendAppointmentNotifications(appointment, 'appointment_cancellation');
    
    // Real-time update
    const io = req.app.get('io');
    io.emit('appointment_cancelled', {
      appointmentId: appointment._id,
      cancelledBy: req.user._id,
      reason
    });
    
    logger.info(`Appointment cancelled: ${appointment.appointmentId} by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    next(error);
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private
const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('therapy');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment can be rescheduled
    if (!appointment.canBeRescheduled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be rescheduled (maximum reschedules reached or status not allowed)'
      });
    }
    
    const { newDateTime, reason } = req.body;
    
    if (!newDateTime) {
      return res.status(400).json({
        success: false,
        message: 'New date and time is required'
      });
    }
    
    const newStart = new Date(newDateTime);
    const newEnd = new Date(newStart.getTime() + appointment.therapy.duration.perSession * 60000);
    
    // Check for conflicts at new time slot
    const conflicts = await Appointment.findConflicts(
      appointment.therapist, 
      newStart, 
      newEnd, 
      appointment._id
    );
    
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'New time slot is not available',
        conflicts
      });
    }
    
    // Store original date for tracking
    if (!appointment.reschedulingInfo.originalDateTime) {
      appointment.reschedulingInfo.originalDateTime = appointment.scheduledDateTime;
    }
    
    // Update appointment
    appointment.scheduledDateTime = newStart;
    appointment.reschedulingInfo.rescheduleCount += 1;
    appointment.reschedulingInfo.rescheduleReason = reason;
    appointment.reschedulingInfo.rescheduledBy = req.user._id;
    appointment.reschedulingInfo.rescheduledAt = new Date();
    appointment.status = 'rescheduled';
    
    await appointment.save();
    
    // Send reschedule notifications
    await sendAppointmentNotifications(appointment, 'appointment_rescheduled');
    
    logger.info(`Appointment rescheduled: ${appointment.appointmentId} by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });
  } catch (error) {
    logger.error('Reschedule appointment error:', error);
    next(error);
  }
};

// @desc    Get therapist availability
// @route   GET /api/appointments/availability/:therapistId/:date
// @access  Private
const getTherapistAvailability = async (req, res, next) => {
  try {
    const { therapistId, date } = req.params;
    
    // Validate therapist exists
    const therapist = await User.findOne({ _id: therapistId, role: 'therapist' });
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }
    
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    
    // Get therapist's availability schedule
    const availability = therapist.professionalInfo?.availability || [];
    const daySchedule = availability.find(schedule => schedule.dayOfWeek === dayOfWeek);
    
    if (!daySchedule || !daySchedule.isAvailable) {
      return res.status(200).json({
        success: true,
        message: 'Therapist not available on this day',
        available: false,
        slots: []
      });
    }
    
    // Get existing appointments for the day
    const existingAppointments = await Appointment.getAvailability(therapistId, targetDate);
    
    // Generate available time slots
    const availableSlots = generateAvailableSlots(
      daySchedule.startTime,
      daySchedule.endTime,
      existingAppointments,
      60 // default session duration in minutes
    );
    
    res.status(200).json({
      success: true,
      available: availableSlots.length > 0,
      therapist: {
        id: therapist._id,
        name: `${therapist.firstName} ${therapist.lastName}`,
        specialization: therapist.professionalInfo?.specialization
      },
      date: targetDate.toISOString().split('T')[0],
      workingHours: {
        start: daySchedule.startTime,
        end: daySchedule.endTime
      },
      slots: availableSlots
    });
  } catch (error) {
    logger.error('Get availability error:', error);
    next(error);
  }
};

// Helper function to find alternative time slots
const findAlternativeSlots = async (therapistId, preferredStart, durationMinutes) => {
  const suggestions = [];
  const searchDays = 7; // Look for alternatives in next 7 days
  
  for (let i = 0; i < searchDays; i++) {
    const searchDate = new Date(preferredStart);
    searchDate.setDate(searchDate.getDate() + i);
    
    try {
      const response = await getTherapistAvailability(
        { params: { therapistId, date: searchDate.toISOString().split('T')[0] } },
        { status: () => ({ json: (data) => data }) },
        () => {}
      );
      
      if (response.available && response.slots.length > 0) {
        suggestions.push({
          date: searchDate.toISOString().split('T')[0],
          slots: response.slots.slice(0, 3) // Top 3 slots per day
        });
        
        if (suggestions.length >= 3) break; // Limit to 3 days with suggestions
      }
    } catch (error) {
      logger.warn(`Error getting availability for ${searchDate}:`, error.message);
    }
  }
  
  return suggestions;
};

// Helper function to generate available time slots
const generateAvailableSlots = (startTime, endTime, existingAppointments, defaultDuration) => {
  const slots = [];
  const start = moment(startTime, 'HH:mm');
  const end = moment(endTime, 'HH:mm');
  const slotDuration = defaultDuration;
  
  let current = start.clone();
  
  while (current.clone().add(slotDuration, 'minutes').isSameOrBefore(end)) {
    const slotStart = current.format('HH:mm');
    const slotEnd = current.clone().add(slotDuration, 'minutes').format('HH:mm');
    
    // Check if slot conflicts with existing appointments
    const isAvailable = !existingAppointments.some(appointment => {
      const appointmentStart = moment(appointment.scheduledDateTime);
      const appointmentEnd = appointmentStart.clone().add(appointment.estimatedDuration, 'minutes');
      
      return current.isBetween(appointmentStart, appointmentEnd, null, '[)')
        || current.clone().add(slotDuration, 'minutes').isBetween(appointmentStart, appointmentEnd, null, '(]');
    });
    
    if (isAvailable) {
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: true
      });
    }
    
    current.add(slotDuration, 'minutes');
  }
  
  return slots;
};

// Helper function to send appointment notifications
const sendAppointmentNotifications = async (appointment, type) => {
  try {
    const participants = [appointment.patient, appointment.doctor, appointment.therapist];
    
    for (const participant of participants) {
      if (participant && participant._id) {
        await Notification.create({
          title: getNotificationTitle(type),
          message: getNotificationMessage(type, appointment),
          recipient: participant._id,
          type: type,
          channels: {
            email: { enabled: true },
            sms: { enabled: true },
            inApp: { enabled: true }
          },
          relatedTo: {
            entityType: 'appointment',
            entityId: appointment._id
          },
          actionRequired: type === 'appointment_confirmation'
        });
      }
    }
  } catch (error) {
    logger.error('Send notification error:', error);
  }
};

// Helper functions for notification content
const getNotificationTitle = (type) => {
  const titles = {
    'appointment_confirmation': 'Appointment Confirmed',
    'appointment_cancellation': 'Appointment Cancelled',
    'appointment_rescheduled': 'Appointment Rescheduled',
    'appointment_reminder': 'Appointment Reminder'
  };
  return titles[type] || 'Appointment Update';
};

const getNotificationMessage = (type, appointment) => {
  const messages = {
    'appointment_confirmation': `Your appointment for ${appointment.therapy?.name} has been confirmed for ${moment(appointment.scheduledDateTime).format('MMMM Do, YYYY [at] h:mm A')}`,
    'appointment_cancellation': `Your appointment for ${appointment.therapy?.name} scheduled for ${moment(appointment.scheduledDateTime).format('MMMM Do, YYYY [at] h:mm A')} has been cancelled`,
    'appointment_rescheduled': `Your appointment for ${appointment.therapy?.name} has been rescheduled to ${moment(appointment.scheduledDateTime).format('MMMM Do, YYYY [at] h:mm A')}`,
    'appointment_reminder': `Reminder: You have an appointment for ${appointment.therapy?.name} tomorrow at ${moment(appointment.scheduledDateTime).format('h:mm A')}`
  };
  return messages[type] || 'Your appointment has been updated';
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getTherapistAvailability
};