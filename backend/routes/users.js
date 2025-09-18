const express = require('express');
const { protect, authorize, checkPermission, logActivity } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');
const { validateUserUpdate } = require('../utils/validators');

const router = express.Router();

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Private (admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      isActive, 
      isVerified, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password -passwordResetToken -verificationToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get user statistics
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const stats = userStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      stats,
      data: users
    });
  } catch (error) {
    logger.error('Get users error:', error);
    next(error);
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    // Check if user can access this profile
    const isOwnProfile = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwnProfile && !isAdmin) {
      // Allow doctors and therapists to view each other's basic info
      if (!['doctor', 'therapist'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this profile'
        });
      }
    }

    let selectFields = '-password -passwordResetToken -verificationToken';
    
    // Limit fields for non-admin, non-owner access
    if (!isOwnProfile && !isAdmin) {
      selectFields = 'firstName lastName role professionalInfo.specialization professionalInfo.experience professionalInfo.qualifications';
    }

    const user = await User.findById(req.params.id).select(selectFields);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats for own profile or admin view
    let additionalData = {};
    if (isOwnProfile || isAdmin) {
      if (user.role === 'patient') {
        const appointmentStats = await Appointment.aggregate([
          { $match: { patient: user._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        additionalData.appointmentStats = appointmentStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {});
      } else if (['doctor', 'therapist'].includes(user.role)) {
        const field = user.role === 'doctor' ? 'doctor' : 'therapist';
        const appointmentStats = await Appointment.aggregate([
          { $match: { [field]: user._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        additionalData.appointmentStats = appointmentStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {});
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        ...additionalData
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    next(error);
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', protect, logActivity('user_update'), async (req, res, next) => {
  try {
    // Check permissions
    const isOwnProfile = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate input
    const { error } = validateUserUpdate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const {
      firstName,
      lastName,
      phone,
      address,
      medicalHistory,
      professionalInfo,
      notificationPreferences,
      isActive,
      role
    } = req.body;

    // Only admins can change role and active status
    if (!isAdmin && (role !== undefined || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change role or active status'
      });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = { ...user.address, ...address };
    if (notificationPreferences !== undefined) {
      user.notificationPreferences = { ...user.notificationPreferences, ...notificationPreferences };
    }

    // Admin only fields
    if (isAdmin) {
      if (isActive !== undefined) user.isActive = isActive;
      if (role !== undefined && role !== user.role) {
        // Role change - clear role-specific data
        if (role === 'patient') {
          user.professionalInfo = undefined;
        } else if (['doctor', 'therapist'].includes(role)) {
          user.medicalHistory = undefined;
        }
        user.role = role;
      }
    }

    // Update role-specific data
    if (user.role === 'patient' && medicalHistory !== undefined) {
      user.medicalHistory = { ...user.medicalHistory, ...medicalHistory };
    } else if (['doctor', 'therapist'].includes(user.role) && professionalInfo !== undefined) {
      user.professionalInfo = { ...user.professionalInfo, ...professionalInfo };
    }

    user.updatedBy = req.user._id;
    await user.save();

    // Remove sensitive data from response
    user.password = undefined;
    user.passwordResetToken = undefined;
    user.verificationToken = undefined;

    logger.info(`User updated: ${user.email} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update user error:', error);
    next(error);
  }
});

// @desc    Delete/Deactivate user
// @route   DELETE /api/users/:id
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), logActivity('user_delete'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active appointments
    const activeAppointments = await Appointment.countDocuments({
      $or: [
        { patient: user._id },
        { doctor: user._id },
        { therapist: user._id }
      ],
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    });

    if (activeAppointments > 0) {
      // Deactivate instead of delete if there are active appointments
      user.isActive = false;
      await user.save();

      logger.info(`User deactivated (has active appointments): ${user.email} by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: 'User deactivated due to active appointments',
        data: { deactivated: true, activeAppointments }
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`; // Ensure email uniqueness
    await user.save();

    logger.info(`User deleted: ${user.email} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    next(error);
  }
});

// @desc    Get therapists with availability
// @route   GET /api/users/therapists/available
// @access  Private
router.get('/therapists/available', protect, async (req, res, next) => {
  try {
    const { date, specialization } = req.query;

    let query = {
      role: 'therapist',
      isActive: true,
      isVerified: true
    };

    if (specialization) {
      query['professionalInfo.specialization'] = { $in: [specialization] };
    }

    const therapists = await User.find(query)
      .select('firstName lastName professionalInfo.specialization professionalInfo.experience professionalInfo.availability professionalInfo.consultationFee')
      .lean();

    // If date is provided, check availability
    if (date) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      const therapistsWithAvailability = await Promise.all(
        therapists.map(async (therapist) => {
          const availability = therapist.professionalInfo?.availability || [];
          const daySchedule = availability.find(schedule => schedule.dayOfWeek === dayOfWeek);
          
          const isAvailable = daySchedule && daySchedule.isAvailable;
          
          let availableSlots = [];
          if (isAvailable) {
            const existingAppointments = await Appointment.getAvailability(therapist._id, targetDate);
            // Generate available slots (simplified)
            availableSlots = existingAppointments.length < 8 ? ['09:00', '10:00', '11:00', '14:00', '15:00'] : [];
          }

          return {
            ...therapist,
            availability: {
              date: date,
              isAvailable,
              workingHours: isAvailable ? {
                start: daySchedule.startTime,
                end: daySchedule.endTime
              } : null,
              availableSlots
            }
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: therapistsWithAvailability.length,
        data: therapistsWithAvailability
      });
    }

    res.status(200).json({
      success: true,
      count: therapists.length,
      data: therapists
    });
  } catch (error) {
    logger.error('Get available therapists error:', error);
    next(error);
  }
});

// @desc    Get user activity log (admin only)
// @route   GET /api/users/:id/activity
// @access  Private (admin)
router.get('/:id/activity', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // This would require an activity log model - simplified for now
    const recentAppointments = await Appointment.find({
      $or: [
        { patient: req.params.id },
        { doctor: req.params.id },
        { therapist: req.params.id },
        { createdBy: req.params.id },
        { updatedBy: req.params.id }
      ]
    })
    .populate('patient', 'firstName lastName')
    .populate('doctor', 'firstName lastName')
    .populate('therapist', 'firstName lastName')
    .populate('therapy', 'name')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const activity = recentAppointments.map(apt => ({
      id: apt._id,
      type: 'appointment',
      action: apt.status,
      description: `${apt.status} appointment for ${apt.therapy.name}`,
      timestamp: apt.updatedAt,
      details: {
        appointmentId: apt.appointmentId,
        patient: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Unknown',
        therapist: apt.therapist ? `${apt.therapist.firstName} ${apt.therapist.lastName}` : 'Unknown',
        therapy: apt.therapy.name
      }
    }));

    res.status(200).json({
      success: true,
      count: activity.length,
      data: activity
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    next(error);
  }
});

module.exports = router;
