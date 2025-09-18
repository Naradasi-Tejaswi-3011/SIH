const express = require('express');
const { protect, authorize, logActivity } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Therapy = require('../models/Therapy');
const logger = require('../utils/logger');
const { validateSimpleFeedback, validateFeedbackResponse } = require('../utils/validators');

const router = express.Router();

// @desc    Get feedback with filtering and pagination
// @route   GET /api/feedback
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      rating,
      type,
      status = 'approved',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      therapist,
      therapy,
      patient
    } = req.query;

    // Build query based on user role
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'patient') {
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'therapist') {
      // Therapists can see feedback where they were the therapist for the related appointment
      const therapistAppointments = await Appointment.find({ therapist: req.user._id }).select('_id');
      query.$and = [{ 'relatedTo.entityType': 'appointment' }, { 'relatedTo.entityId': { $in: therapistAppointments.map(apt => apt._id) } }];
    } else if (req.user.role === 'doctor') {
      // Doctors can see feedback for appointments where they were the doctor
      const doctorAppointments = await Appointment.find({ doctor: req.user._id }).select('_id');
      query.$and = [{ 'relatedTo.entityType': 'appointment' }, { 'relatedTo.entityId': { $in: doctorAppointments.map(apt => apt._id) } }];
    }
    
    // Additional filters
    if (status) query.status = status;
    if (rating) query['ratings.overall'] = parseInt(rating);
    if (type) query.feedbackType = type;
    if (therapy) {
      // For therapy filter, need to find appointments for that therapy first
      const therapyAppointments = await Appointment.find({ therapy }).select('_id');
      if (query.$and) {
        query.$and.push({ 'relatedTo.entityId': { $in: therapyAppointments.map(apt => apt._id) } });
      } else {
        query.$and = [{ 'relatedTo.entityType': 'appointment' }, { 'relatedTo.entityId': { $in: therapyAppointments.map(apt => apt._id) } }];
      }
    }
    if (patient && ['admin', 'therapist', 'doctor'].includes(req.user.role)) query.submittedBy = patient;

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const feedback = await Feedback.find(query)
      .populate('submittedBy', 'firstName lastName')
      .populate('response.respondedBy', 'firstName lastName role')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    // Get feedback statistics
    const stats = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$ratings.overall' },
          totalFeedback: { $sum: 1 },
          ratingDistribution: {
            $push: '$ratings.overall'
          }
        }
      }
    ]);

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats[0]) {
      stats[0].ratingDistribution.forEach(rating => {
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      });
    }

    res.status(200).json({
      success: true,
      count: feedback.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      stats: {
        averageRating: stats[0]?.averageRating || 0,
        totalFeedback: stats[0]?.totalFeedback || 0,
        ratingDistribution: ratingCounts
      },
      data: feedback
    });
  } catch (error) {
    logger.error('Get feedback error:', error);
    next(error);
  }
});

// @desc    Get feedback by ID
// @route   GET /api/feedback/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('patient', 'firstName lastName email')
      .populate('therapist', 'firstName lastName professionalInfo.specialization')
      .populate('therapy', 'name sanskritName category')
      .populate('appointment', 'appointmentId scheduledDateTime')
      .populate('responses.respondedBy', 'firstName lastName role')
      .populate('moderatedBy', 'firstName lastName role');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user has permission to view this feedback
    const canView = 
      req.user._id.toString() === feedback.patient._id.toString() ||
      req.user._id.toString() === feedback.therapist._id.toString() ||
      req.user.role === 'admin' ||
      (req.user.role === 'doctor' && await Appointment.exists({ 
        _id: feedback.appointment._id, 
        doctor: req.user._id 
      }));

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this feedback'
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Get feedback error:', error);
    next(error);
  }
});

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
router.post('/', protect, logActivity('feedback_submit'), async (req, res, next) => {
  try {
    // Validate input
    const { error } = validateSimpleFeedback(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { appointment, rating, comment, type, categories, isAnonymous, tags } = req.body;

    // Verify appointment exists and user is the patient
    const appointmentDoc = await Appointment.findById(appointment)
      .populate('therapy', 'name category')
      .populate('therapist', 'firstName lastName');

    if (!appointmentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the patient for this appointment
    if (appointmentDoc.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit feedback for your own appointments'
      });
    }

    // Check if appointment is completed
    if (appointmentDoc.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only submit feedback for completed appointments'
      });
    }

    // Check if feedback already exists for this appointment
    const existingFeedback = await Feedback.findOne({ appointment: appointment });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this appointment'
      });
    }

    // Analyze sentiment (simplified)
    const sentimentScore = analyzeSentiment(comment || '');
    
    // Create feedback using the actual model structure
    const feedbackData = {
      submittedBy: req.user._id,
      submitterRole: req.user.role,
      relatedTo: {
        entityType: 'appointment',
        entityId: appointment,
        entityName: `Appointment ${appointmentDoc.appointmentId}`
      },
      feedbackType: type || 'session_feedback',
      category: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
      ratings: {
        overall: parseInt(rating)
      },
      feedback: {
        title: `Feedback for ${appointmentDoc.therapy.name}`,
        description: comment || 'No additional comments provided'
      },
      isAnonymous: isAnonymous || false,
      tags: tags || [],
      sentimentAnalysis: {
        score: sentimentScore,
        confidence: 0.8, // Placeholder confidence score
        keywords: extractKeywords(comment || ''),
        analyzedAt: new Date()
      },
      status: rating >= 4 ? 'submitted' : 'submitted', // All submitted for now
      priority: rating <= 2 ? 'high' : rating === 3 ? 'normal' : 'low'
    };

    const feedback = await Feedback.create(feedbackData);

    // Populate the created feedback
    await feedback.populate([
      { path: 'submittedBy', select: 'firstName lastName' },
      { path: 'relatedTo.entityId' } // This will populate the appointment
    ]);

    // Send notification to therapist about new feedback
    // This would integrate with the notification system

    logger.info(`Feedback submitted by ${req.user.email} for appointment ${appointmentDoc.appointmentId}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    logger.error('Submit feedback error:', error);
    next(error);
  }
});

// @desc    Respond to feedback
// @route   PUT /api/feedback/:id/respond
// @access  Private (admin, doctor, therapist)
router.put('/:id/respond', protect, authorize('admin', 'doctor', 'therapist'), logActivity('feedback_respond'), async (req, res, next) => {
  try {
    const { error } = validateFeedbackResponse(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { response, isPublic = true } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can respond to this feedback
    const canRespond = 
      req.user.role === 'admin' ||
      req.user._id.toString() === feedback.therapist.toString() ||
      (req.user.role === 'doctor' && await Appointment.exists({ 
        _id: feedback.appointment, 
        doctor: req.user._id 
      }));

    if (!canRespond) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this feedback'
      });
    }

    // Add response
    const responseData = {
      response,
      respondedBy: req.user._id,
      respondedAt: new Date(),
      isPublic,
      sentiment: {
        score: analyzeSentiment(response),
        classification: getSentimentClassification(analyzeSentiment(response))
      }
    };

    feedback.responses.push(responseData);
    feedback.hasResponse = true;
    feedback.lastResponseAt = new Date();

    await feedback.save();

    // Populate the response
    await feedback.populate('responses.respondedBy', 'firstName lastName role');

    // Send notification to patient about response
    // This would integrate with the notification system

    logger.info(`Response added to feedback ${feedback._id} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: feedback
    });
  } catch (error) {
    logger.error('Respond to feedback error:', error);
    next(error);
  }
});

// @desc    Mark feedback as helpful
// @route   PUT /api/feedback/:id/helpful
// @access  Private
router.put('/:id/helpful', protect, async (req, res, next) => {
  try {
    const { isHelpful } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user already marked this feedback
    const existingInteraction = feedback.interactions.find(
      interaction => interaction.user.toString() === req.user._id.toString()
    );

    if (existingInteraction) {
      existingInteraction.isHelpful = isHelpful;
      existingInteraction.interactedAt = new Date();
    } else {
      feedback.interactions.push({
        user: req.user._id,
        isHelpful,
        interactedAt: new Date()
      });
    }

    // Recalculate helpfulness score
    const helpfulCount = feedback.interactions.filter(i => i.isHelpful).length;
    const totalInteractions = feedback.interactions.length;
    feedback.qualityMetrics.helpfulnessScore = totalInteractions > 0 
      ? (helpfulCount / totalInteractions) * 100 
      : 0;

    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Feedback interaction recorded',
      data: {
        helpfulnessScore: feedback.qualityMetrics.helpfulnessScore,
        totalInteractions,
        helpfulCount
      }
    });
  } catch (error) {
    logger.error('Mark feedback helpful error:', error);
    next(error);
  }
});

// @desc    Get feedback analytics (admin only)
// @route   GET /api/feedback/analytics
// @access  Private (admin)
router.get('/analytics', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { startDate, endDate, therapist, therapy } = req.query;

    // Build match query
    const matchQuery = { status: 'approved' };
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (therapist) matchQuery.therapist = therapist;
    if (therapy) matchQuery.therapy = therapy;

    // Overall statistics
    const overallStats = await Feedback.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          averageSentimentScore: { $avg: '$sentiment.score' },
          averageHelpfulnessScore: { $avg: '$qualityMetrics.helpfulnessScore' },
          responseRate: { $avg: { $cond: [{ $eq: ['$hasResponse', true] }, 1, 0] } }
        }
      }
    ]);

    // Rating distribution
    const ratingDistribution = await Feedback.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Feedback trends over time
    const trends = await Feedback.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top therapists by rating
    const topTherapists = await Feedback.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$therapist',
          averageRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
          averageSentiment: { $avg: '$sentiment.score' }
        }
      },
      { $match: { totalFeedback: { $gte: 5 } } }, // At least 5 feedback entries
      { $sort: { averageRating: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'therapist'
        }
      },
      { $unwind: '$therapist' },
      {
        $project: {
          name: { $concat: ['$therapist.firstName', ' ', '$therapist.lastName'] },
          averageRating: { $round: ['$averageRating', 2] },
          totalFeedback: 1,
          averageSentiment: { $round: ['$averageSentiment', 2] }
        }
      }
    ]);

    // Sentiment analysis
    const sentimentStats = await Feedback.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$sentiment.classification',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: overallStats[0] || {
          totalFeedback: 0,
          averageRating: 0,
          averageSentimentScore: 0,
          averageHelpfulnessScore: 0,
          responseRate: 0
        },
        ratingDistribution: ratingDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        trends,
        topTherapists,
        sentimentAnalysis: sentimentStats
      }
    });
  } catch (error) {
    logger.error('Get feedback analytics error:', error);
    next(error);
  }
});

// @desc    Moderate feedback (admin only)
// @route   PUT /api/feedback/:id/moderate
// @access  Private (admin)
router.put('/:id/moderate', protect, authorize('admin'), logActivity('feedback_moderate'), async (req, res, next) => {
  try {
    const { status, moderationReason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or pending'
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.status = status;
    feedback.moderatedBy = req.user._id;
    feedback.moderatedAt = new Date();
    feedback.moderationReason = moderationReason;

    await feedback.save();

    await feedback.populate('moderatedBy', 'firstName lastName');

    logger.info(`Feedback ${feedback._id} moderated as ${status} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Feedback moderated successfully',
      data: feedback
    });
  } catch (error) {
    logger.error('Moderate feedback error:', error);
    next(error);
  }
});

// Helper functions for sentiment analysis and text processing
function analyzeSentiment(text) {
  // Simplified sentiment analysis - in production, use a proper NLP library
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'poor', 'disappointing'];
  
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  // Normalize score to -1 to 1 range
  return Math.max(-1, Math.min(1, score / Math.max(words.length / 10, 1)));
}

function getSentimentClassification(score) {
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

function calculateReadabilityScore(text) {
  // Simplified readability calculation
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const avgWordsPerSentence = words / sentences;
  
  if (avgWordsPerSentence < 15) return 'easy';
  if (avgWordsPerSentence < 25) return 'moderate';
  return 'complex';
}

function extractKeywords(text) {
  // Simple keyword extraction - remove common words and extract important terms
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could'];
  
  const words = text.toLowerCase()
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 10); // Take top 10 keywords
  
  return [...new Set(words)]; // Remove duplicates
}

module.exports = router;
