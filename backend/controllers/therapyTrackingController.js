const Appointment = require('../models/Appointment');
const User = require('../models/User');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');
const moment = require('moment');

// @desc    Start therapy session
// @route   POST /api/appointments/:id/start-session
// @access  Private (therapist)
const startTherapySession = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient therapy therapist');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the assigned therapist
    if (appointment.therapist._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this session'
      });
    }

    // Check if appointment can be started
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be started in current status'
      });
    }

    // Check if patient preparation is complete
    if (!appointment.isPreparationComplete()) {
      return res.status(400).json({
        success: false,
        message: 'Patient preparation is not complete. Please ensure dietary compliance and medication adjustments are verified.'
      });
    }

    const { vitalParameters, initialObservations, roomAssigned } = req.body;

    // Update appointment status and session progress
    appointment.status = 'in_progress';
    appointment.actualStartTime = new Date();
    appointment.sessionProgress = {
      checkInTime: new Date(),
      completionPercentage: 5,
      observations: initialObservations || '',
      milestones: [{
        milestone: 'Session started',
        completedAt: new Date(),
        notes: 'Therapy session initiated by therapist'
      }]
    };

    // Record initial vital parameters
    if (vitalParameters && Array.isArray(vitalParameters)) {
      appointment.preparationStatus.vitalParameters = [
        ...appointment.preparationStatus.vitalParameters || [],
        ...vitalParameters.map(param => ({
          ...param,
          recordedAt: new Date(),
          recordedBy: req.user._id
        }))
      ];
    }

    // Update room assignment if provided
    if (roomAssigned) {
      appointment.room = {
        ...appointment.room,
        ...roomAssigned
      };
    }

    await appointment.save();

    // Real-time updates
    const io = req.app.get('io');
    
    // Notify all participants
    const participants = [
      appointment.patient._id.toString(),
      appointment.doctor.toString(),
      appointment.therapist._id.toString()
    ];

    participants.forEach(participantId => {
      io.to(participantId).emit('therapy_session_started', {
        appointmentId: appointment._id,
        sessionId: appointment.appointmentId,
        startTime: appointment.actualStartTime,
        therapist: {
          name: `${appointment.therapist.firstName} ${appointment.therapist.lastName}`,
          id: appointment.therapist._id
        },
        therapy: appointment.therapy.name,
        estimatedDuration: appointment.estimatedDuration
      });
    });

    // Send notifications
    await notificationService.createNotification({
      title: 'Therapy Session Started',
      message: `Your ${appointment.therapy.name} session has started with ${appointment.therapist.firstName} ${appointment.therapist.lastName}`,
      recipient: appointment.patient._id,
      type: 'session_followup',
      channels: {
        inApp: { enabled: true },
        push: { enabled: true }
      },
      relatedTo: {
        entityType: 'appointment',
        entityId: appointment._id
      },
      isImmediate: true
    });

    logger.info(`Therapy session started: ${appointment.appointmentId} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Therapy session started successfully',
      data: {
        appointmentId: appointment._id,
        sessionId: appointment.appointmentId,
        startTime: appointment.actualStartTime,
        status: appointment.status,
        progress: appointment.sessionProgress
      }
    });
  } catch (error) {
    logger.error('Start therapy session error:', error);
    next(error);
  }
};

// @desc    Update session progress
// @route   PUT /api/appointments/:id/progress
// @access  Private (therapist)
const updateSessionProgress = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient therapy therapist');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the assigned therapist
    if (appointment.therapist._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }

    // Check if session is in progress
    if (appointment.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Session is not currently in progress'
      });
    }

    const { 
      completionPercentage, 
      observations, 
      complications, 
      patientResponse,
      milestone,
      vitalParameters
    } = req.body;

    // Update session progress
    const progressUpdate = {
      ...appointment.sessionProgress
    };

    if (completionPercentage !== undefined) {
      progressUpdate.completionPercentage = Math.min(100, Math.max(0, completionPercentage));
    }

    if (observations) {
      progressUpdate.observations = observations;
    }

    if (complications) {
      progressUpdate.complications = complications;
    }

    if (patientResponse) {
      progressUpdate.patientResponse = patientResponse;
    }

    // Add milestone if provided
    if (milestone) {
      if (!progressUpdate.milestones) {
        progressUpdate.milestones = [];
      }
      progressUpdate.milestones.push({
        milestone: milestone.description,
        completedAt: new Date(),
        notes: milestone.notes || ''
      });
    }

    appointment.sessionProgress = progressUpdate;

    // Record vital parameters if provided
    if (vitalParameters && Array.isArray(vitalParameters)) {
      appointment.preparationStatus.vitalParameters.push(
        ...vitalParameters.map(param => ({
          ...param,
          recordedAt: new Date(),
          recordedBy: req.user._id
        }))
      );
    }

    await appointment.save();

    // Real-time updates
    const io = req.app.get('io');
    
    // Broadcast progress update
    const participants = [
      appointment.patient._id.toString(),
      appointment.doctor.toString(),
      appointment.therapist._id.toString()
    ];

    const progressData = {
      appointmentId: appointment._id,
      sessionId: appointment.appointmentId,
      progress: progressUpdate,
      updatedAt: new Date(),
      updatedBy: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.role
      }
    };

    participants.forEach(participantId => {
      io.to(participantId).emit('therapy_progress_updated', progressData);
    });

    // Send critical alerts if there are complications
    if (complications) {
      await notificationService.createNotification({
        title: 'Session Alert',
        message: `Complications noted in ${appointment.therapy.name} session: ${complications}`,
        recipient: appointment.doctor,
        type: 'system_alert',
        category: 'urgent',
        channels: {
          inApp: { enabled: true },
          email: { enabled: true },
          push: { enabled: true }
        },
        relatedTo: {
          entityType: 'appointment',
          entityId: appointment._id
        },
        actionRequired: true,
        isImmediate: true
      });
    }

    logger.info(`Session progress updated: ${appointment.appointmentId} - ${completionPercentage}%`);

    res.status(200).json({
      success: true,
      message: 'Session progress updated successfully',
      data: {
        appointmentId: appointment._id,
        progress: progressUpdate,
        vitalParameters: appointment.preparationStatus.vitalParameters
      }
    });
  } catch (error) {
    logger.error('Update session progress error:', error);
    next(error);
  }
};

// @desc    Complete therapy session
// @route   POST /api/appointments/:id/complete-session
// @access  Private (therapist)
const completeTherapySession = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient therapy therapist doctor');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the assigned therapist
    if (appointment.therapist._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this session'
      });
    }

    // Check if session is in progress
    if (appointment.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Session is not currently in progress'
      });
    }

    const { 
      finalObservations, 
      postTherapyInstructions, 
      nextSessionRecommendations,
      patientSatisfaction,
      therapistNotes,
      vitalParameters
    } = req.body;

    // Update appointment to completed status
    appointment.status = 'completed';
    appointment.actualEndTime = new Date();
    
    // Complete session progress
    appointment.sessionProgress = {
      ...appointment.sessionProgress,
      checkOutTime: new Date(),
      completionPercentage: 100,
      observations: finalObservations || appointment.sessionProgress.observations
    };

    // Add completion milestone
    appointment.sessionProgress.milestones.push({
      milestone: 'Session completed',
      completedAt: new Date(),
      notes: 'Therapy session successfully completed'
    });

    // Update therapist notes
    if (therapistNotes) {
      appointment.therapistNotes = therapistNotes;
    }

    // Record final vital parameters
    if (vitalParameters && Array.isArray(vitalParameters)) {
      appointment.preparationStatus.vitalParameters.push(
        ...vitalParameters.map(param => ({
          ...param,
          recordedAt: new Date(),
          recordedBy: req.user._id,
          notes: 'Post-therapy measurement'
        }))
      );
    }

    // Record quality metrics
    appointment.qualityMetrics = {
      satisfaction: {
        patientSatisfaction: patientSatisfaction || 0,
        therapistFeedback: 5, // Default good rating
        overallRating: patientSatisfaction || 4
      },
      punctuality: {
        therapistOnTime: true,
        patientOnTime: true,
        delayMinutes: 0
      }
    };

    // Set patient instructions
    if (postTherapyInstructions) {
      appointment.patientInstructions = postTherapyInstructions;
    }

    await appointment.save();

    // Real-time updates
    const io = req.app.get('io');
    
    // Notify all participants
    const participants = [
      appointment.patient._id.toString(),
      appointment.doctor._id.toString(),
      appointment.therapist._id.toString()
    ];

    const completionData = {
      appointmentId: appointment._id,
      sessionId: appointment.appointmentId,
      completedAt: appointment.actualEndTime,
      duration: Math.round((appointment.actualEndTime - appointment.actualStartTime) / 60000), // in minutes
      progress: appointment.sessionProgress,
      instructions: postTherapyInstructions
    };

    participants.forEach(participantId => {
      io.to(participantId).emit('therapy_session_completed', completionData);
    });

    // Send completion notifications
    await notificationService.createNotification({
      title: 'Therapy Session Completed',
      message: `Your ${appointment.therapy.name} session has been completed successfully. Please follow the post-therapy instructions provided.`,
      recipient: appointment.patient._id,
      type: 'therapy_completion',
      channels: {
        inApp: { enabled: true },
        email: { enabled: true },
        sms: { enabled: true }
      },
      relatedTo: {
        entityType: 'appointment',
        entityId: appointment._id
      },
      actionRequired: true,
      actions: [{
        label: 'View Instructions',
        type: 'deeplink',
        value: `/appointments/${appointment._id}/instructions`,
        primary: true
      }, {
        label: 'Provide Feedback',
        type: 'deeplink',
        value: `/appointments/${appointment._id}/feedback`,
        primary: false
      }],
      isImmediate: true
    });

    // Schedule follow-up if needed
    if (nextSessionRecommendations) {
      appointment.followUp = {
        required: true,
        scheduledFor: moment().add(1, 'day').toDate(),
        type: 'phone_call',
        notes: nextSessionRecommendations
      };
      await appointment.save();
    }

    // Auto-request feedback
    setTimeout(async () => {
      try {
        await notificationService.createNotification({
          title: 'Share Your Experience',
          message: `How was your ${appointment.therapy.name} session? Your feedback helps us improve our services.`,
          recipient: appointment.patient._id,
          type: 'feedback_request',
          channels: {
            inApp: { enabled: true },
            email: { enabled: true }
          },
          relatedTo: {
            entityType: 'appointment',
            entityId: appointment._id
          },
          actions: [{
            label: 'Rate Session',
            type: 'deeplink',
            value: `/feedback/create?appointment=${appointment._id}`,
            primary: true
          }],
          isImmediate: true
        });
      } catch (error) {
        logger.error('Auto feedback request error:', error);
      }
    }, 2 * 60 * 60 * 1000); // 2 hours later

    logger.info(`Therapy session completed: ${appointment.appointmentId} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Therapy session completed successfully',
      data: {
        appointmentId: appointment._id,
        sessionId: appointment.appointmentId,
        completedAt: appointment.actualEndTime,
        duration: Math.round((appointment.actualEndTime - appointment.actualStartTime) / 60000),
        status: appointment.status,
        progress: appointment.sessionProgress,
        qualityMetrics: appointment.qualityMetrics
      }
    });
  } catch (error) {
    logger.error('Complete therapy session error:', error);
    next(error);
  }
};

// @desc    Get session status
// @route   GET /api/appointments/:id/session-status
// @access  Private
const getSessionStatus = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient therapy therapist', 'firstName lastName')
      .select('appointmentId status sessionProgress actualStartTime actualEndTime estimatedDuration room qualityMetrics');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has permission to view this session
    const userIsParticipant = 
      appointment.patient._id.toString() === req.user._id.toString() ||
      appointment.therapist._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin' || req.user.role === 'doctor';

    if (!userIsParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this session'
      });
    }

    // Calculate session metrics
    let duration = 0;
    let timeRemaining = 0;

    if (appointment.actualStartTime) {
      const now = new Date();
      const endTime = appointment.actualEndTime || now;
      duration = Math.round((endTime - appointment.actualStartTime) / 60000);
      
      if (!appointment.actualEndTime && appointment.status === 'in_progress') {
        const estimatedEnd = new Date(appointment.actualStartTime.getTime() + appointment.estimatedDuration * 60000);
        timeRemaining = Math.max(0, Math.round((estimatedEnd - now) / 60000));
      }
    }

    const sessionData = {
      appointmentId: appointment._id,
      sessionId: appointment.appointmentId,
      status: appointment.status,
      progress: appointment.sessionProgress || {},
      timing: {
        startTime: appointment.actualStartTime,
        endTime: appointment.actualEndTime,
        estimatedDuration: appointment.estimatedDuration,
        actualDuration: duration,
        timeRemaining: timeRemaining
      },
      participants: {
        patient: appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : null,
        therapist: appointment.therapist ? `${appointment.therapist.firstName} ${appointment.therapist.lastName}` : null
      },
      therapy: appointment.therapy ? appointment.therapy.name : null,
      room: appointment.room || {},
      qualityMetrics: appointment.qualityMetrics || {}
    };

    res.status(200).json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    logger.error('Get session status error:', error);
    next(error);
  }
};

// @desc    Get live session data
// @route   GET /api/appointments/:id/live-data
// @access  Private (real-time endpoint)
const getLiveSessionData = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('preparationStatus.vitalParameters.recordedBy', 'firstName lastName role');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const userIsParticipant = 
      appointment.patient.toString() === req.user._id.toString() ||
      appointment.therapist.toString() === req.user._id.toString() ||
      appointment.doctor.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!userIsParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view live session data'
      });
    }

    // Get recent vital parameters (last 10)
    const recentVitals = appointment.preparationStatus.vitalParameters
      .slice(-10)
      .map(vital => ({
        parameter: vital.parameter,
        value: vital.value,
        unit: vital.unit,
        recordedAt: vital.recordedAt,
        recordedBy: vital.recordedBy ? `${vital.recordedBy.firstName} ${vital.recordedBy.lastName}` : 'Unknown',
        isNormal: vital.isNormal,
        notes: vital.notes
      }));

    // Calculate progress metrics
    const progressMetrics = {
      completionPercentage: appointment.sessionProgress?.completionPercentage || 0,
      milestonesCompleted: appointment.sessionProgress?.milestones?.length || 0,
      currentObservations: appointment.sessionProgress?.observations || '',
      patientResponse: appointment.sessionProgress?.patientResponse || 'good'
    };

    res.status(200).json({
      success: true,
      data: {
        sessionId: appointment.appointmentId,
        status: appointment.status,
        progress: progressMetrics,
        vitalParameters: recentVitals,
        lastUpdated: appointment.updatedAt
      }
    });
  } catch (error) {
    logger.error('Get live session data error:', error);
    next(error);
  }
};

module.exports = {
  startTherapySession,
  updateSessionProgress,
  completeTherapySession,
  getSessionStatus,
  getLiveSessionData
};