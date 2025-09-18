const express = require('express');
const { protect, authorize, logActivity } = require('../middleware/auth');
const Therapy = require('../models/Therapy');
const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');
const { validateTherapy, validateTherapyUpdate } = require('../utils/validators');

const router = express.Router();

// @desc    Get all therapies with filtering and pagination
// @route   GET /api/therapies
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      isActive = 'true'
    } = req.query;

    // Build query
    let query = { isActive: isActive === 'true' || isActive === true };
    
    if (category) {
      query.category = category;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sanskritName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'benefits.conditions': { $regex: search, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }

    // Duration range filter
    if (minDuration || maxDuration) {
      query['duration.perSession'] = {};
      if (minDuration) query['duration.perSession'].$gte = parseInt(minDuration);
      if (maxDuration) query['duration.perSession'].$lte = parseInt(maxDuration);
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const therapies = await Therapy.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName role')
      .lean();

    const total = await Therapy.countDocuments(query);

    // Get categories for filters
    const categories = await Therapy.distinct('category', { isActive: true });

    // Get price range for filters
    const priceStats = await Therapy.aggregate([
      { $match: { isActive: true, 'pricing.basePrice': { $exists: true } } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$pricing.basePrice' },
          maxPrice: { $max: '$pricing.basePrice' },
          avgPrice: { $avg: '$pricing.basePrice' }
        }
      }
    ]);

    // Add appointment count for each therapy
    const therapiesWithStats = await Promise.all(
      therapies.map(async (therapy) => {
        const appointmentCount = await Appointment.countDocuments({
          therapy: therapy._id,
          status: { $in: ['completed', 'scheduled', 'confirmed'] }
        });
        return {
          ...therapy,
          appointmentCount,
          popularity: appointmentCount > 10 ? 'high' : appointmentCount > 5 ? 'medium' : 'low'
        };
      })
    );

    res.status(200).json({
      success: true,
      count: therapies.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      filters: {
        categories,
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 }
      },
      data: therapiesWithStats
    });
  } catch (error) {
    logger.error('Get therapies error:', error);
    next(error);
  }
});

// @desc    Get therapy by ID with detailed information
// @route   GET /api/therapies/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const therapy = await Therapy.findById(req.params.id)
      .populate('createdBy', 'firstName lastName role professionalInfo.specialization')
      .populate('updatedBy', 'firstName lastName role');

    if (!therapy) {
      return res.status(404).json({
        success: false,
        message: 'Therapy not found'
      });
    }

    // Get therapy statistics
    const stats = await Appointment.aggregate([
      { $match: { therapy: therapy._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const appointmentStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Get related therapies (same category)
    const relatedTherapies = await Therapy.find({
      category: therapy.category,
      _id: { $ne: therapy._id },
      isActive: true
    })
    .limit(5)
    .select('name sanskritName duration.perSession pricing.basePrice')
    .lean();

    // Get average rating (if feedback exists)
    // This would require joining with feedback data
    const avgRating = 4.2; // Placeholder

    res.status(200).json({
      success: true,
      data: {
        ...therapy.toObject(),
        stats: {
          appointments: appointmentStats,
          totalAppointments: Object.values(appointmentStats).reduce((sum, count) => sum + count, 0),
          averageRating: avgRating
        },
        relatedTherapies
      }
    });
  } catch (error) {
    logger.error('Get therapy error:', error);
    next(error);
  }
});

// @desc    Create new therapy
// @route   POST /api/therapies
// @access  Private (admin, doctor)
router.post('/', protect, authorize('admin', 'doctor'), logActivity('therapy_create'), async (req, res, next) => {
  try {
    // Validate input
    const { error } = validateTherapy(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if therapy with same name exists
    const existingTherapy = await Therapy.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') }
    });

    if (existingTherapy) {
      return res.status(400).json({
        success: false,
        message: 'Therapy with this name already exists'
      });
    }

    // Create therapy with default values
    const therapyData = {
      ...req.body,
      createdBy: req.user._id,
      // Set default values if not provided
      pricing: {
        currency: 'INR',
        ...req.body.pricing
      },
      scheduling: {
        advanceBookingDays: 30,
        cancellationPolicy: '24 hours notice required',
        ...req.body.scheduling
      },
      safety: {
        contraindications: req.body.safety?.contraindications || [],
        sideEffects: req.body.safety?.sideEffects || [],
        precautions: req.body.safety?.precautions || []
      }
    };

    const therapy = await Therapy.create(therapyData);

    // Populate created therapy
    await therapy.populate('createdBy', 'firstName lastName role');

    logger.info(`Therapy created: ${therapy.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Therapy created successfully',
      data: therapy
    });
  } catch (error) {
    logger.error('Create therapy error:', error);
    next(error);
  }
});

// @desc    Update therapy
// @route   PUT /api/therapies/:id
// @access  Private (admin, doctor)
router.put('/:id', protect, authorize('admin', 'doctor'), logActivity('therapy_update'), async (req, res, next) => {
  try {
    const therapy = await Therapy.findById(req.params.id);

    if (!therapy) {
      return res.status(404).json({
        success: false,
        message: 'Therapy not found'
      });
    }

    // Check if user can update this therapy
    const canUpdate = 
      req.user.role === 'admin' || 
      therapy.createdBy.toString() === req.user._id.toString();

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this therapy'
      });
    }

    // Validate input
    const { error } = validateTherapyUpdate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if there are active appointments for this therapy
    if (req.body.isActive === false) {
      const activeAppointments = await Appointment.countDocuments({
        therapy: therapy._id,
        status: { $in: ['scheduled', 'confirmed'] },
        scheduledDateTime: { $gte: new Date() }
      });

      if (activeAppointments > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot deactivate therapy with ${activeAppointments} active future appointments`
        });
      }
    }

    // Update therapy
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
          therapy[key] = { ...therapy[key], ...req.body[key] };
        } else {
          therapy[key] = req.body[key];
        }
      }
    });

    therapy.updatedBy = req.user._id;
    therapy.updatedAt = new Date();

    await therapy.save();

    // Populate updated therapy
    await therapy.populate('createdBy updatedBy', 'firstName lastName role');

    logger.info(`Therapy updated: ${therapy.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Therapy updated successfully',
      data: therapy
    });
  } catch (error) {
    logger.error('Update therapy error:', error);
    next(error);
  }
});

// @desc    Delete therapy
// @route   DELETE /api/therapies/:id
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), logActivity('therapy_delete'), async (req, res, next) => {
  try {
    const therapy = await Therapy.findById(req.params.id);

    if (!therapy) {
      return res.status(404).json({
        success: false,
        message: 'Therapy not found'
      });
    }

    // Check if there are any appointments for this therapy
    const appointmentCount = await Appointment.countDocuments({ therapy: therapy._id });

    if (appointmentCount > 0) {
      // Soft delete - deactivate instead of removing
      therapy.isActive = false;
      therapy.deletedAt = new Date();
      therapy.deletedBy = req.user._id;
      await therapy.save();

      logger.info(`Therapy deactivated (has appointments): ${therapy.name} by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: 'Therapy deactivated due to existing appointments',
        data: { deactivated: true, appointmentCount }
      });
    }

    // Hard delete if no appointments
    await Therapy.findByIdAndDelete(req.params.id);

    logger.info(`Therapy deleted: ${therapy.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Therapy deleted successfully'
    });
  } catch (error) {
    logger.error('Delete therapy error:', error);
    next(error);
  }
});

// @desc    Get therapy categories with counts
// @route   GET /api/therapies/categories/stats
// @access  Public
router.get('/categories/stats', async (req, res, next) => {
  try {
    const categoryStats = await Therapy.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.basePrice' },
          avgDuration: { $avg: '$duration.perSession' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const categories = categoryStats.map(stat => ({
      category: stat._id,
      count: stat.count,
      averagePrice: Math.round(stat.avgPrice || 0),
      averageDuration: Math.round(stat.avgDuration || 0)
    }));

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get category stats error:', error);
    next(error);
  }
});

// @desc    Get popular therapies
// @route   GET /api/therapies/popular
// @access  Public
router.get('/popular', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Get most booked therapies
    const popularTherapies = await Appointment.aggregate([
      { $match: { status: { $in: ['completed', 'scheduled', 'confirmed'] } } },
      { $group: { _id: '$therapy', appointmentCount: { $sum: 1 } } },
      { $sort: { appointmentCount: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'therapies',
          localField: '_id',
          foreignField: '_id',
          as: 'therapy'
        }
      },
      { $unwind: '$therapy' },
      { $match: { 'therapy.isActive': true } },
      {
        $project: {
          _id: '$therapy._id',
          name: '$therapy.name',
          sanskritName: '$therapy.sanskritName',
          category: '$therapy.category',
          duration: '$therapy.duration',
          pricing: '$therapy.pricing',
          appointmentCount: 1,
          description: '$therapy.description',
          benefits: '$therapy.benefits'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: popularTherapies.length,
      data: popularTherapies
    });
  } catch (error) {
    logger.error('Get popular therapies error:', error);
    next(error);
  }
});

// @desc    Search therapies by benefits/conditions
// @route   GET /api/therapies/search/conditions
// @access  Public
router.get('/search/conditions', async (req, res, next) => {
  try {
    const { condition, limit = 10 } = req.query;

    if (!condition) {
      return res.status(400).json({
        success: false,
        message: 'Condition parameter is required'
      });
    }

    const therapies = await Therapy.find({
      isActive: true,
      $or: [
        { 'benefits.conditions': { $regex: condition, $options: 'i' } },
        { 'benefits.healthBenefits': { $regex: condition, $options: 'i' } },
        { description: { $regex: condition, $options: 'i' } }
      ]
    })
    .limit(parseInt(limit))
    .select('name sanskritName category duration pricing benefits description')
    .lean();

    res.status(200).json({
      success: true,
      count: therapies.length,
      searchTerm: condition,
      data: therapies
    });
  } catch (error) {
    logger.error('Search therapies by condition error:', error);
    next(error);
  }
});

module.exports = router;
