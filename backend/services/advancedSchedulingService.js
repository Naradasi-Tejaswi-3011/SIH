const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Therapy = require('../models/Therapy');
const moment = require('moment');
const logger = require('../utils/logger');

class AdvancedSchedulingService {
  constructor() {
    // Therapy room requirements
    this.roomRequirements = {
      abhyanga: { type: 'standard', equipment: ['massage_table', 'oils'] },
      shirodhara: { type: 'specialized', equipment: ['shirodhara_table', 'oil_pot'] },
      panchakarma: { type: 'specialized', equipment: ['specialized_bed', 'steam_unit'] },
      consultation: { type: 'consultation', equipment: ['examination_table'] }
    };

    // Therapist specializations
    this.therapistSpecializations = {
      panchakarma_specialist: ['vamana', 'virechana', 'basti', 'nasya', 'raktamokshana'],
      massage_therapist: ['abhyanga', 'udvartana', 'marma_massage'],
      meditation_instructor: ['meditation', 'pranayama', 'yoga_therapy'],
      general_practitioner: ['consultation', 'dietary_counseling']
    };

    // Time slot preferences based on therapy type
    this.therapyTimePreferences = {
      vamana: { preferredHours: [6, 7, 8], duration: 180 }, // Early morning, 3 hours
      virechana: { preferredHours: [8, 9, 10], duration: 120 }, // Morning, 2 hours
      basti: { preferredHours: [7, 8, 9], duration: 90 }, // Early morning, 1.5 hours
      abhyanga: { preferredHours: [9, 10, 11, 14, 15, 16], duration: 60 }, // Flexible, 1 hour
      shirodhara: { preferredHours: [10, 11, 15, 16, 17], duration: 45 }, // Calm periods, 45 min
      meditation: { preferredHours: [6, 7, 18, 19], duration: 30 } // Early morning/evening, 30 min
    };

    // Patient preference weights
    this.preferenceWeights = {
      therapistExperience: 0.25,
      timePreference: 0.2,
      therapySequence: 0.2,
      roomAvailability: 0.15,
      patientHistory: 0.1,
      seasonalOptimization: 0.1
    };
  }

  // Main scheduling function
  async findOptimalSchedule(appointmentRequest) {
    try {
      const {
        patientId,
        therapyId,
        preferredDates,
        preferredTimes,
        therapistId = null, // Optional specific therapist
        urgency = 'normal' // normal, high, emergency
      } = appointmentRequest;

      // Get required data
      const [patient, therapy, availableTherapists] = await Promise.all([
        User.findById(patientId),
        Therapy.findById(therapyId),
        this.getAvailableTherapists(therapyId, preferredDates)
      ]);

      if (!patient || !therapy) {
        throw new Error('Patient or therapy not found');
      }

      // Generate time slots for the preferred date range
      const timeSlots = this.generateTimeSlots(preferredDates, preferredTimes, therapy);

      // Score and rank all possible combinations
      const rankedOptions = await this.scoreSchedulingOptions(
        patient,
        therapy,
        availableTherapists,
        timeSlots,
        urgency
      );

      // Return top recommendations
      return {
        recommended: rankedOptions.slice(0, 3),
        alternatives: rankedOptions.slice(3, 8),
        insights: this.generateSchedulingInsights(rankedOptions[0], patient, therapy)
      };

    } catch (error) {
      logger.error('Advanced scheduling error:', error);
      throw error;
    }
  }

  // Get available therapists for specific therapy
  async getAvailableTherapists(therapyId, dateRange) {
    try {
      const therapy = await Therapy.findById(therapyId);
      const requiredSpecializations = this.getRequiredSpecializations(therapy.name);
      
      // Find therapists with matching specializations
      const therapists = await User.find({
        role: 'therapist',
        isActive: true,
        'professionalInfo.specializations': { $in: requiredSpecializations }
      });

      // Filter by availability
      const availableTherapists = [];
      
      for (const therapist of therapists) {
        const availability = await this.checkTherapistAvailability(therapist._id, dateRange);
        if (availability.isAvailable) {
          availableTherapists.push({
            ...therapist.toObject(),
            availability: availability.slots,
            experience: this.calculateExperienceScore(therapist, therapy),
            workload: await this.calculateWorkload(therapist._id, dateRange)
          });
        }
      }

      return availableTherapists;
    } catch (error) {
      logger.error('Error getting available therapists:', error);
      return [];
    }
  }

  // Check therapist availability
  async checkTherapistAvailability(therapistId, dateRange) {
    try {
      const startDate = moment(dateRange[0]).startOf('day');
      const endDate = moment(dateRange[dateRange.length - 1]).endOf('day');

      // Get existing appointments
      const existingAppointments = await Appointment.find({
        therapist: therapistId,
        scheduledDateTime: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate()
        },
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
      });

      // Get therapist's working hours
      const therapist = await User.findById(therapistId);
      const workingHours = therapist.professionalInfo?.workingHours || {
        start: 9,
        end: 17,
        daysOff: ['sunday']
      };

      // Generate available slots
      const availableSlots = [];
      
      dateRange.forEach(date => {
        const dayOfWeek = moment(date).format('dddd').toLowerCase();
        
        if (!workingHours.daysOff.includes(dayOfWeek)) {
          for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            const slotTime = moment(date).hour(hour).minute(0);
            
            // Check if slot is not conflicting with existing appointments
            const hasConflict = existingAppointments.some(apt => {
              const aptStart = moment(apt.scheduledDateTime);
              const aptEnd = moment(aptStart).add(apt.estimatedDuration || 60, 'minutes');
              return slotTime.isBetween(aptStart, aptEnd, null, '[)');
            });

            if (!hasConflict) {
              availableSlots.push(slotTime.toDate());
            }
          }
        }
      });

      return {
        isAvailable: availableSlots.length > 0,
        slots: availableSlots
      };
    } catch (error) {
      logger.error('Error checking therapist availability:', error);
      return { isAvailable: false, slots: [] };
    }
  }

  // Generate time slots based on preferences
  generateTimeSlots(preferredDates, preferredTimes, therapy) {
    const timeSlots = [];
    const therapyPrefs = this.therapyTimePreferences[therapy.name] || 
                        { preferredHours: [9, 10, 11, 14, 15, 16], duration: 60 };

    preferredDates.forEach(date => {
      // If specific times are preferred, use those
      if (preferredTimes && preferredTimes.length > 0) {
        preferredTimes.forEach(time => {
          timeSlots.push({
            dateTime: moment(date).hour(time).minute(0).toDate(),
            duration: therapyPrefs.duration,
            preference: 'user_specified',
            score: 1.0
          });
        });
      } else {
        // Use therapy-specific preferred hours
        therapyPrefs.preferredHours.forEach(hour => {
          timeSlots.push({
            dateTime: moment(date).hour(hour).minute(0).toDate(),
            duration: therapyPrefs.duration,
            preference: 'therapy_optimal',
            score: 0.9
          });
        });
      }
    });

    return timeSlots;
  }

  // Score scheduling options
  async scoreSchedulingOptions(patient, therapy, availableTherapists, timeSlots, urgency) {
    const options = [];

    for (const therapist of availableTherapists) {
      for (const timeSlot of timeSlots) {
        // Check if therapist is available at this time
        const isAvailable = therapist.availability.some(slot => 
          moment(slot).isSame(moment(timeSlot.dateTime), 'hour')
        );

        if (isAvailable) {
          const score = await this.calculateSchedulingScore(
            patient,
            therapy,
            therapist,
            timeSlot,
            urgency
          );

          options.push({
            therapist: {
              id: therapist._id,
              name: `${therapist.firstName} ${therapist.lastName}`,
              experience: therapist.experience,
              specializations: therapist.professionalInfo?.specializations || []
            },
            scheduledDateTime: timeSlot.dateTime,
            estimatedDuration: timeSlot.duration,
            room: await this.findOptimalRoom(therapy, timeSlot.dateTime),
            score: score,
            reasoning: this.generateScoreReasoning(score)
          });
        }
      }
    }

    return options.sort((a, b) => b.score.total - a.score.total);
  }

  // Calculate comprehensive scheduling score
  async calculateSchedulingScore(patient, therapy, therapist, timeSlot, urgency) {
    const weights = this.preferenceWeights;
    
    // Experience score
    const experienceScore = this.calculateExperienceScore(therapist, therapy);
    
    // Time preference score
    const timeScore = this.calculateTimePreferenceScore(timeSlot, therapy);
    
    // Therapy sequence score
    const sequenceScore = await this.calculateSequenceScore(patient, therapy);
    
    // Room availability score
    const roomScore = await this.calculateRoomAvailabilityScore(therapy, timeSlot.dateTime);
    
    // Patient history score
    const historyScore = await this.calculatePatientHistoryScore(patient, therapist);
    
    // Seasonal optimization score
    const seasonalScore = this.calculateSeasonalScore(therapy, timeSlot.dateTime);
    
    // Urgency modifier
    const urgencyModifier = urgency === 'emergency' ? 1.2 : urgency === 'high' ? 1.1 : 1.0;

    const totalScore = (
      experienceScore * weights.therapistExperience +
      timeScore * weights.timePreference +
      sequenceScore * weights.therapySequence +
      roomScore * weights.roomAvailability +
      historyScore * weights.patientHistory +
      seasonalScore * weights.seasonalOptimization
    ) * urgencyModifier;

    return {
      total: Math.round(totalScore * 100) / 100,
      breakdown: {
        experience: experienceScore,
        timePreference: timeScore,
        sequence: sequenceScore,
        room: roomScore,
        history: historyScore,
        seasonal: seasonalScore
      }
    };
  }

  // Calculate therapist experience score
  calculateExperienceScore(therapist, therapy) {
    const specializations = therapist.professionalInfo?.specializations || [];
    const requiredSpecs = this.getRequiredSpecializations(therapy.name);
    
    // Check specialization match
    const hasSpecialization = requiredSpecs.some(spec => 
      specializations.includes(spec)
    );
    
    // Years of experience
    const yearsExperience = therapist.professionalInfo?.yearsExperience || 0;
    
    // Base score for specialization
    let score = hasSpecialization ? 0.8 : 0.4;
    
    // Bonus for experience
    score += Math.min(yearsExperience * 0.05, 0.2);
    
    return Math.min(score, 1.0);
  }

  // Calculate time preference score
  calculateTimePreferenceScore(timeSlot, therapy) {
    const therapyPrefs = this.therapyTimePreferences[therapy.name] || 
                        { preferredHours: [9, 10, 11, 14, 15, 16] };
    
    const hour = moment(timeSlot.dateTime).hour();
    
    if (therapyPrefs.preferredHours.includes(hour)) {
      return timeSlot.score || 0.9;
    }
    
    // Calculate distance from preferred hours
    const distances = therapyPrefs.preferredHours.map(prefHour => 
      Math.abs(hour - prefHour)
    );
    const minDistance = Math.min(...distances);
    
    return Math.max(0.1, 0.9 - (minDistance * 0.1));
  }

  // Calculate therapy sequence score
  async calculateSequenceScore(patient, therapy) {
    try {
      // Get patient's recent therapy history
      const recentAppointments = await Appointment.find({
        patient: patient._id,
        status: 'completed',
        createdAt: { $gte: moment().subtract(3, 'months').toDate() }
      }).populate('therapy').sort({ createdAt: -1 }).limit(5);

      if (recentAppointments.length === 0) {
        return 0.8; // Good score for new patients
      }

      const lastTherapy = recentAppointments[0].therapy;
      
      // Check if current therapy follows recommended sequence
      const isGoodSequence = this.isGoodTherapySequence(lastTherapy.name, therapy.name);
      
      return isGoodSequence ? 0.9 : 0.6;
    } catch (error) {
      logger.error('Error calculating sequence score:', error);
      return 0.5;
    }
  }

  // Calculate room availability score
  async calculateRoomAvailabilityScore(therapy, dateTime) {
    try {
      const requiredRoom = this.roomRequirements[therapy.name] || { type: 'standard' };
      
      // For now, assume rooms are available (in a real implementation,
      // you would check room booking database)
      const roomAvailability = await this.checkRoomAvailability(requiredRoom.type, dateTime);
      
      return roomAvailability ? 1.0 : 0.3;
    } catch (error) {
      logger.error('Error calculating room score:', error);
      return 0.5;
    }
  }

  // Calculate patient history score with therapist
  async calculatePatientHistoryScore(patient, therapist) {
    try {
      const previousAppointments = await Appointment.find({
        patient: patient._id,
        therapist: therapist._id,
        status: 'completed'
      });

      if (previousAppointments.length === 0) {
        return 0.7; // Neutral score for new patient-therapist combinations
      }

      // Calculate average satisfaction
      const satisfactionScores = previousAppointments
        .map(apt => apt.qualityMetrics?.satisfaction?.patientSatisfaction || 3)
        .filter(score => score > 0);

      if (satisfactionScores.length === 0) {
        return 0.7;
      }

      const averageSatisfaction = satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length;
      
      // Convert 1-5 scale to 0-1 scale
      return Math.min((averageSatisfaction - 1) / 4, 1.0);
    } catch (error) {
      logger.error('Error calculating history score:', error);
      return 0.5;
    }
  }

  // Calculate seasonal optimization score
  calculateSeasonalScore(therapy, dateTime) {
    const month = moment(dateTime).month();
    const season = this.getCurrentSeason(month);
    
    // Seasonal therapy preferences based on Ayurveda
    const seasonalPreferences = {
      spring: ['udvartana', 'vamana', 'detox'], // Kapha season
      summer: ['shirodhara', 'abhyanga', 'cooling'], // Pitta season  
      autumn: ['basti', 'meditation', 'grounding'], // Vata season
      winter: ['abhyanga', 'swedana', 'warming'] // Kapha season
    };

    const preferredTherapies = seasonalPreferences[season] || [];
    const therapyName = therapy.name.toLowerCase();
    
    const isSeasonallyOptimal = preferredTherapies.some(pref => 
      therapyName.includes(pref)
    );

    return isSeasonallyOptimal ? 0.9 : 0.7;
  }

  // Helper methods
  getRequiredSpecializations(therapyName) {
    const name = therapyName.toLowerCase();
    
    for (const [specialization, therapies] of Object.entries(this.therapistSpecializations)) {
      if (therapies.some(therapy => name.includes(therapy))) {
        return [specialization];
      }
    }
    
    return ['general_practitioner'];
  }

  async calculateWorkload(therapistId, dateRange) {
    const startDate = moment(dateRange[0]).startOf('day');
    const endDate = moment(dateRange[dateRange.length - 1]).endOf('day');
    
    const appointmentCount = await Appointment.countDocuments({
      therapist: therapistId,
      scheduledDateTime: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    return appointmentCount / dateRange.length; // Average appointments per day
  }

  async findOptimalRoom(therapy, dateTime) {
    const requiredRoom = this.roomRequirements[therapy.name] || { type: 'standard' };
    
    // In a real implementation, this would check actual room availability
    return {
      type: requiredRoom.type,
      number: Math.floor(Math.random() * 5) + 1, // Placeholder
      equipment: requiredRoom.equipment || []
    };
  }

  async checkRoomAvailability(roomType, dateTime) {
    // Placeholder - in real implementation, check room booking system
    return Math.random() > 0.2; // 80% availability
  }

  isGoodTherapySequence(lastTherapy, currentTherapy) {
    // Simplified sequence logic - can be expanded
    const sequenceRules = {
      'snehana': ['swedana', 'vamana', 'virechana'],
      'swedana': ['vamana', 'virechana', 'basti'],
      'vamana': ['abhyanga', 'shirodhara'],
      'virechana': ['basti', 'abhyanga'],
      'basti': ['rasayana', 'abhyanga']
    };

    const nextTherapies = sequenceRules[lastTherapy.toLowerCase()] || [];
    return nextTherapies.some(next => currentTherapy.toLowerCase().includes(next));
  }

  getCurrentSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  generateScoreReasoning(score) {
    const reasons = [];
    
    if (score.breakdown.experience > 0.8) {
      reasons.push('Highly experienced therapist with relevant specialization');
    }
    if (score.breakdown.timePreference > 0.8) {
      reasons.push('Optimal time slot for this therapy');
    }
    if (score.breakdown.sequence > 0.8) {
      reasons.push('Follows recommended therapy sequence');
    }
    if (score.breakdown.room > 0.9) {
      reasons.push('Preferred room type available');
    }
    if (score.breakdown.history > 0.8) {
      reasons.push('Positive history with this therapist');
    }
    if (score.breakdown.seasonal > 0.8) {
      reasons.push('Seasonally appropriate therapy');
    }

    return reasons;
  }

  generateSchedulingInsights(topOption, patient, therapy) {
    return {
      recommendation: `Best match: ${topOption.therapist.name} on ${moment(topOption.scheduledDateTime).format('MMMM Do, YYYY at h:mm A')}`,
      confidence: `${Math.round(topOption.score.total * 100)}% match`,
      keyFactors: topOption.reasoning,
      preparation: `Allow ${topOption.estimatedDuration} minutes for ${therapy.name}`,
      roomInfo: `${topOption.room.type} room with required equipment available`
    };
  }
}

module.exports = new AdvancedSchedulingService();