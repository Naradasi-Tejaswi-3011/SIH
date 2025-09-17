const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Therapy = require('../models/Therapy');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const logger = require('../utils/logger');

/**
 * @desc    Get patient progress analytics
 * @route   GET /api/analytics/patient/:patientId/progress
 * @access  Private (patient, therapist, admin)
 */
const getPatientProgress = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { timeframe = '3months', therapyType } = req.query;

    // Check authorization - patients can only view their own data
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }

    // Build query
    let query = {
      patient: patientId,
      scheduledDate: { $gte: startDate },
      status: 'completed'
    };

    if (therapyType) {
      const therapy = await Therapy.findOne({ name: new RegExp(therapyType, 'i') });
      if (therapy) {
        query.therapy = therapy._id;
      }
    }

    // Get completed appointments with session data
    const appointments = await Appointment.find(query)
      .populate('therapy', 'name category duration')
      .populate('therapist', 'firstName lastName')
      .sort({ scheduledDate: 1 });

    // Calculate progress metrics
    const progressData = appointments.map(appointment => {
      const session = appointment.currentSession;
      return {
        date: appointment.scheduledDate,
        therapyName: appointment.therapy.name,
        therapyCategory: appointment.therapy.category,
        therapist: `${appointment.therapist.firstName} ${appointment.therapist.lastName}`,
        duration: session?.actualDuration || appointment.duration,
        progressUpdates: session?.progressUpdates?.length || 0,
        vitalSigns: session?.progressUpdates?.map(update => update.vitals).filter(Boolean) || [],
        completionNotes: session?.completionNotes,
        recommendations: session?.recommendations || []
      };
    });

    // Calculate trend metrics
    const totalSessions = appointments.length;
    const averageDuration = appointments.reduce((sum, apt) => 
      sum + (apt.currentSession?.actualDuration || apt.duration), 0) / totalSessions || 0;
    
    const therapyDistribution = {};
    appointments.forEach(apt => {
      const category = apt.therapy.category;
      therapyDistribution[category] = (therapyDistribution[category] || 0) + 1;
    });

    // Get recent vital signs trends
    const vitalSigns = [];
    appointments.forEach(apt => {
      if (apt.currentSession?.progressUpdates) {
        apt.currentSession.progressUpdates.forEach(update => {
          if (update.vitals) {
            vitalSigns.push({
              date: apt.scheduledDate,
              ...update.vitals,
              timestamp: update.timestamp
            });
          }
        });
      }
    });

    // Calculate improvement metrics
    const improvementScore = calculateImprovementScore(appointments);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSessions,
          averageDuration: Math.round(averageDuration),
          therapyTypes: Object.keys(therapyDistribution).length,
          improvementScore
        },
        progressData,
        therapyDistribution,
        vitalSigns: vitalSigns.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        trends: {
          sessionFrequency: calculateSessionFrequency(appointments),
          durationTrend: calculateDurationTrend(appointments),
          vitalsTrend: calculateVitalsTrend(vitalSigns)
        }
      }
    });

  } catch (error) {
    logger.error('Get patient progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient progress data'
    });
  }
};

/**
 * @desc    Get therapist performance analytics
 * @route   GET /api/analytics/therapist/:therapistId/performance
 * @access  Private (therapist, admin)
 */
const getTherapistPerformance = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { timeframe = '3months' } = req.query;

    // Check authorization
    if (req.user.role === 'therapist' && req.user.id !== therapistId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    const appointments = await Appointment.find({
      therapist: therapistId,
      scheduledDate: { $gte: startDate }
    })
    .populate('patient', 'firstName lastName')
    .populate('therapy', 'name category')
    .sort({ scheduledDate: 1 });

    // Calculate performance metrics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
    const completionRate = (completedAppointments / totalAppointments * 100) || 0;

    // Get patient feedback
    const feedbackData = await Feedback.find({
      'appointment': { $in: appointments.map(apt => apt._id) },
      rating: { $exists: true }
    });

    const averageRating = feedbackData.length > 0 
      ? feedbackData.reduce((sum, fb) => sum + fb.rating, 0) / feedbackData.length 
      : 0;

    // Calculate therapy distribution
    const therapyCategories = {};
    appointments.forEach(apt => {
      const category = apt.therapy.category;
      therapyCategories[category] = (therapyCategories[category] || 0) + 1;
    });

    // Patient outcomes
    const patientOutcomes = await calculatePatientOutcomes(appointments);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAppointments,
          completedAppointments,
          completionRate: Math.round(completionRate),
          averageRating: Math.round(averageRating * 10) / 10,
          uniquePatients: new Set(appointments.map(apt => apt.patient._id.toString())).size
        },
        performance: {
          monthlyStats: calculateMonthlyStats(appointments),
          therapyDistribution: therapyCategories,
          patientSatisfaction: {
            averageRating,
            totalFeedback: feedbackData.length,
            ratingDistribution: calculateRatingDistribution(feedbackData)
          }
        },
        patientOutcomes
      }
    });

  } catch (error) {
    logger.error('Get therapist performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve therapist performance data'
    });
  }
};

/**
 * @desc    Get system-wide analytics dashboard
 * @route   GET /api/analytics/dashboard
 * @access  Private (admin)
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get system-wide metrics
    const [
      totalUsers,
      totalAppointments,
      recentAppointments,
      totalTherapies,
      totalNotifications,
      recentFeedback
    ] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Therapy.countDocuments(),
      Notification.countDocuments(),
      Feedback.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // User distribution
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Appointment status distribution
    const appointmentStats = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Top therapies
    const topTherapies = await Appointment.aggregate([
      { $group: { _id: '$therapy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'therapies',
          localField: '_id',
          foreignField: '_id',
          as: 'therapy'
        }
      },
      { $unwind: '$therapy' },
      {
        $project: {
          name: '$therapy.name',
          category: '$therapy.category',
          count: 1
        }
      }
    ]);

    // Revenue metrics (if pricing is implemented)
    const revenueData = await calculateRevenueMetrics(thirtyDaysAgo);

    // System health metrics
    const systemHealth = {
      activeUsers: await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),
      averageSessionDuration: await calculateAverageSessionDuration(),
      notificationDeliveryRate: await calculateNotificationDeliveryRate(),
      systemUptime: process.uptime()
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalAppointments,
          recentAppointments,
          totalTherapies,
          totalNotifications,
          recentFeedback
        },
        userDistribution: userStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        appointmentDistribution: appointmentStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        topTherapies,
        revenueData,
        systemHealth,
        trends: {
          dailyAppointments: await getDailyAppointmentTrends(thirtyDaysAgo),
          userGrowth: await getUserGrowthTrends(thirtyDaysAgo),
          therapyPopularity: await getTherapyPopularityTrends(thirtyDaysAgo)
        }
      }
    });

  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics'
    });
  }
};

/**
 * @desc    Get real-time analytics for live dashboard
 * @route   GET /api/analytics/realtime
 * @access  Private (admin, therapist)
 */
const getRealtimeAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Current active sessions
    const activeSessions = await Appointment.countDocuments({
      status: 'in-progress',
      'currentSession.status': 'active'
    });

    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      scheduledDate: {
        $gte: todayStart,
        $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Pending notifications
    const pendingNotifications = await Notification.countDocuments({
      status: { $in: ['scheduled', 'pending'] }
    });

    // Recent activity (last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentActivity = await Appointment.find({
      updatedAt: { $gte: oneHourAgo }
    })
    .populate('patient', 'firstName lastName')
    .populate('therapist', 'firstName lastName')
    .populate('therapy', 'name')
    .sort({ updatedAt: -1 })
    .limit(10);

    // Live session data (if user is admin or involved in sessions)
    let liveSessionData = [];
    if (req.user.role === 'admin') {
      liveSessionData = await Appointment.find({
        'currentSession.status': 'active'
      })
      .populate('patient', 'firstName lastName')
      .populate('therapist', 'firstName lastName')
      .populate('therapy', 'name category')
      .select('currentSession patient therapist therapy scheduledDate');
    } else if (req.user.role === 'therapist') {
      liveSessionData = await Appointment.find({
        therapist: req.user.id,
        'currentSession.status': 'active'
      })
      .populate('patient', 'firstName lastName')
      .populate('therapy', 'name category')
      .select('currentSession patient therapy scheduledDate');
    }

    res.status(200).json({
      success: true,
      data: {
        activeSessions,
        todayAppointments,
        pendingNotifications,
        recentActivity: recentActivity.map(activity => ({
          id: activity._id,
          type: 'appointment',
          action: activity.status,
          patient: `${activity.patient.firstName} ${activity.patient.lastName}`,
          therapist: `${activity.therapist.firstName} ${activity.therapist.lastName}`,
          therapy: activity.therapy.name,
          timestamp: activity.updatedAt
        })),
        liveSessionData: liveSessionData.map(session => ({
          appointmentId: session._id,
          patient: session.patient ? `${session.patient.firstName} ${session.patient.lastName}` : 'Unknown',
          therapist: session.therapist ? `${session.therapist.firstName} ${session.therapist.lastName}` : 'Unknown',
          therapy: session.therapy.name,
          category: session.therapy.category,
          startTime: session.currentSession.startedAt,
          duration: Math.floor((now - new Date(session.currentSession.startedAt)) / (1000 * 60)), // minutes
          progressUpdates: session.currentSession.progressUpdates?.length || 0
        })),
        timestamp: now
      }
    });

  } catch (error) {
    logger.error('Get realtime analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve real-time analytics'
    });
  }
};

// Helper functions
const calculateImprovementScore = (appointments) => {
  if (appointments.length < 2) return 0;
  
  // Simple improvement calculation based on session duration and completion
  const recent = appointments.slice(-Math.floor(appointments.length / 2));
  const older = appointments.slice(0, Math.floor(appointments.length / 2));
  
  const recentAvgDuration = recent.reduce((sum, apt) => sum + (apt.currentSession?.actualDuration || apt.duration), 0) / recent.length;
  const olderAvgDuration = older.reduce((sum, apt) => sum + (apt.currentSession?.actualDuration || apt.duration), 0) / older.length;
  
  const durationImprovement = ((recentAvgDuration - olderAvgDuration) / olderAvgDuration) * 100;
  
  // Score between 0-100
  return Math.max(0, Math.min(100, 50 + durationImprovement));
};

const calculateSessionFrequency = (appointments) => {
  if (appointments.length < 2) return 0;
  
  const sortedDates = appointments.map(apt => new Date(apt.scheduledDate)).sort((a, b) => a - b);
  const totalDays = (sortedDates[sortedDates.length - 1] - sortedDates[0]) / (1000 * 60 * 60 * 24);
  
  return appointments.length / (totalDays / 7); // sessions per week
};

const calculateDurationTrend = (appointments) => {
  if (appointments.length < 3) return 'stable';
  
  const durations = appointments.map(apt => apt.currentSession?.actualDuration || apt.duration);
  const recent = durations.slice(-Math.floor(durations.length / 3));
  const older = durations.slice(0, Math.floor(durations.length / 3));
  
  const recentAvg = recent.reduce((sum, d) => sum + d, 0) / recent.length;
  const olderAvg = older.reduce((sum, d) => sum + d, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
};

const calculateVitalsTrend = (vitalSigns) => {
  if (vitalSigns.length < 3) return { pulse: 'stable', bloodPressure: 'stable' };
  
  // Simple trend analysis for pulse and blood pressure
  const pulses = vitalSigns.map(v => v.pulse).filter(Boolean);
  const recent = pulses.slice(-Math.floor(pulses.length / 3));
  const older = pulses.slice(0, Math.floor(pulses.length / 3));
  
  if (recent.length === 0 || older.length === 0) return { pulse: 'stable', bloodPressure: 'stable' };
  
  const recentPulse = recent.reduce((sum, p) => sum + p, 0) / recent.length;
  const olderPulse = older.reduce((sum, p) => sum + p, 0) / older.length;
  
  const pulseChange = ((recentPulse - olderPulse) / olderPulse) * 100;
  
  return {
    pulse: pulseChange > 5 ? 'increasing' : pulseChange < -5 ? 'decreasing' : 'stable',
    bloodPressure: 'stable' // Simplified for now
  };
};

const calculateMonthlyStats = (appointments) => {
  const months = {};
  
  appointments.forEach(apt => {
    const month = apt.scheduledDate.toISOString().substring(0, 7); // YYYY-MM
    if (!months[month]) {
      months[month] = { total: 0, completed: 0, cancelled: 0 };
    }
    months[month].total++;
    months[month][apt.status]++;
  });
  
  return months;
};

const calculateRatingDistribution = (feedbackData) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  feedbackData.forEach(fb => {
    distribution[fb.rating]++;
  });
  
  return distribution;
};

const calculatePatientOutcomes = async (appointments) => {
  const completed = appointments.filter(apt => apt.status === 'completed');
  
  return {
    totalPatients: new Set(completed.map(apt => apt.patient._id.toString())).size,
    averageSessionsPerPatient: completed.length / new Set(completed.map(apt => apt.patient._id.toString())).size || 0,
    completionRate: (completed.length / appointments.length * 100) || 0
  };
};

const calculateRevenueMetrics = async (startDate) => {
  // Placeholder - implement when pricing model is added
  return {
    totalRevenue: 0,
    averageRevenuePerSession: 0,
    monthlyGrowth: 0
  };
};

const calculateAverageSessionDuration = async () => {
  const sessions = await Appointment.aggregate([
    { $match: { 'currentSession.actualDuration': { $exists: true } } },
    { $group: { _id: null, avgDuration: { $avg: '$currentSession.actualDuration' } } }
  ]);
  
  return sessions[0]?.avgDuration || 0;
};

const calculateNotificationDeliveryRate = async () => {
  const total = await Notification.countDocuments();
  const sent = await Notification.countDocuments({ status: 'sent' });
  
  return total > 0 ? (sent / total * 100) : 0;
};

const getDailyAppointmentTrends = async (startDate) => {
  return await Appointment.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const getUserGrowthTrends = async (startDate) => {
  return await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const getTherapyPopularityTrends = async (startDate) => {
  return await Appointment.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$therapy',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'therapies',
        localField: '_id',
        foreignField: '_id',
        as: 'therapy'
      }
    },
    { $unwind: '$therapy' },
    {
      $project: {
        name: '$therapy.name',
        category: '$therapy.category',
        count: 1
      }
    }
  ]);
};

module.exports = {
  getPatientProgress,
  getTherapistPerformance,
  getDashboardAnalytics,
  getRealtimeAnalytics
};