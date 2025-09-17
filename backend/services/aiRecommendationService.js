const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Therapy = require('../models/Therapy');
const logger = require('../utils/logger');

class AIRecommendationService {
  constructor() {
    // Ayurvedic body type characteristics
    this.doshaCharacteristics = {
      vata: {
        keywords: ['anxiety', 'insomnia', 'digestive', 'joint', 'nervous'],
        recommendedTherapies: ['abhyanga', 'shirodhara', 'basti', 'nasya'],
        avoidTherapies: ['virechana'],
        seasonalPreference: ['winter', 'autumn'],
        timePreference: 'morning'
      },
      pitta: {
        keywords: ['inflammation', 'acidity', 'heat', 'anger', 'skin'],
        recommendedTherapies: ['virechana', 'raktamokshana', 'shirodhara'],
        avoidTherapies: ['swedana'],
        seasonalPreference: ['summer', 'late_spring'],
        timePreference: 'evening'
      },
      kapha: {
        keywords: ['obesity', 'diabetes', 'congestion', 'lethargy', 'mucus'],
        recommendedTherapies: ['vamana', 'udvartana', 'swedana'],
        avoidTherapies: ['snehana'],
        seasonalPreference: ['spring', 'winter'],
        timePreference: 'morning'
      }
    };

    // Therapy compatibility matrix
    this.therapySequence = {
      preparatory: ['snehana', 'swedana'],
      main: ['vamana', 'virechana', 'basti', 'nasya', 'raktamokshana'],
      rejuvenative: ['abhyanga', 'shirodhara', 'akshi_tarpana']
    };

    // Condition-therapy mapping
    this.conditionTherapyMap = {
      'arthritis': ['abhyanga', 'swedana', 'basti'],
      'hypertension': ['shirodhara', 'abhyanga', 'meditation'],
      'diabetes': ['udvartana', 'virechana', 'dietary_therapy'],
      'insomnia': ['shirodhara', 'abhyanga', 'meditation'],
      'digestive_disorders': ['virechana', 'basti', 'dietary_therapy'],
      'skin_disorders': ['raktamokshana', 'virechana', 'external_therapies'],
      'respiratory_issues': ['nasya', 'swedana', 'pranayama'],
      'stress_anxiety': ['shirodhara', 'abhyanga', 'meditation']
    };
  }

  // Main recommendation function
  async generateRecommendations(patientId, options = {}) {
    try {
      const patient = await User.findById(patientId).populate('medicalHistory');
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Get patient's therapy history
      const therapyHistory = await this.getPatientTherapyHistory(patientId);
      
      // Get available therapies
      const availableTherapies = await Therapy.find({ isActive: true });

      // Generate recommendations based on multiple factors
      const recommendations = await this.generateMultiFactorRecommendations(
        patient,
        therapyHistory,
        availableTherapies,
        options
      );

      return recommendations;
    } catch (error) {
      logger.error('AI Recommendation error:', error);
      throw error;
    }
  }

  // Generate recommendations based on multiple factors
  async generateMultiFactorRecommendations(patient, history, availableTherapies, options) {
    const recommendations = [];

    // Factor 1: Medical history and current conditions
    const conditionBasedRecommendations = this.getConditionBasedRecommendations(
      patient.medicalHistory || {},
      availableTherapies
    );

    // Factor 2: Dosha analysis
    const doshaBasedRecommendations = this.getDoshaBasedRecommendations(
      patient.medicalHistory?.doshaAssessment || 'vata',
      availableTherapies
    );

    // Factor 3: Previous therapy outcomes
    const historyBasedRecommendations = this.getHistoryBasedRecommendations(
      history,
      availableTherapies
    );

    // Factor 4: Seasonal and time-based recommendations
    const seasonalRecommendations = this.getSeasonalRecommendations(
      availableTherapies,
      options.season || this.getCurrentSeason()
    );

    // Factor 5: Therapy sequence optimization
    const sequenceRecommendations = this.getSequenceRecommendations(
      history,
      availableTherapies
    );

    // Combine and weight recommendations
    const combinedRecommendations = this.combineRecommendations([
      { recommendations: conditionBasedRecommendations, weight: 0.3 },
      { recommendations: doshaBasedRecommendations, weight: 0.25 },
      { recommendations: historyBasedRecommendations, weight: 0.2 },
      { recommendations: seasonalRecommendations, weight: 0.15 },
      { recommendations: sequenceRecommendations, weight: 0.1 }
    ]);

    // Add personalization factors
    const personalizedRecommendations = this.addPersonalizationFactors(
      combinedRecommendations,
      patient,
      options
    );

    return {
      primary: personalizedRecommendations.slice(0, 3),
      secondary: personalizedRecommendations.slice(3, 6),
      reasoning: this.generateRecommendationReasoning(patient, personalizedRecommendations),
      contraindications: this.getContraindications(patient, personalizedRecommendations),
      timeline: this.suggestTherapyTimeline(personalizedRecommendations)
    };
  }

  // Get therapy recommendations based on medical conditions
  getConditionBasedRecommendations(medicalHistory, availableTherapies) {
    const recommendations = [];
    const conditions = medicalHistory.currentConditions || [];
    const symptoms = medicalHistory.symptoms || [];

    conditions.forEach(condition => {
      const normalizedCondition = condition.toLowerCase().replace(/\s+/g, '_');
      const therapyNames = this.conditionTherapyMap[normalizedCondition] || [];
      
      therapyNames.forEach(therapyName => {
        const therapy = availableTherapies.find(t => 
          t.name.toLowerCase().includes(therapyName) || 
          t.sanskritName.toLowerCase().includes(therapyName)
        );
        
        if (therapy) {
          recommendations.push({
            therapy: therapy,
            score: 0.9,
            reason: `Recommended for ${condition}`,
            evidence: 'condition_match'
          });
        }
      });
    });

    // Check symptoms against dosha keywords
    symptoms.forEach(symptom => {
      Object.entries(this.doshaCharacteristics).forEach(([dosha, characteristics]) => {
        if (characteristics.keywords.some(keyword => 
          symptom.toLowerCase().includes(keyword)
        )) {
          characteristics.recommendedTherapies.forEach(therapyName => {
            const therapy = availableTherapies.find(t => 
              t.name.toLowerCase().includes(therapyName) || 
              t.sanskritName.toLowerCase().includes(therapyName)
            );
            
            if (therapy) {
              recommendations.push({
                therapy: therapy,
                score: 0.75,
                reason: `Recommended for ${dosha} imbalance (symptom: ${symptom})`,
                evidence: 'symptom_dosha_match'
              });
            }
          });
        }
      });
    });

    return this.deduplicateRecommendations(recommendations);
  }

  // Get recommendations based on dosha constitution
  getDoshaBasedRecommendations(primaryDosha, availableTherapies) {
    const recommendations = [];
    const doshaData = this.doshaCharacteristics[primaryDosha] || this.doshaCharacteristics.vata;

    doshaData.recommendedTherapies.forEach(therapyName => {
      const therapy = availableTherapies.find(t => 
        t.name.toLowerCase().includes(therapyName) || 
        t.sanskritName.toLowerCase().includes(therapyName)
      );
      
      if (therapy) {
        recommendations.push({
          therapy: therapy,
          score: 0.8,
          reason: `Balances ${primaryDosha} dosha`,
          evidence: 'dosha_constitution'
        });
      }
    });

    return recommendations;
  }

  // Get recommendations based on previous therapy outcomes
  getHistoryBasedRecommendations(therapyHistory, availableTherapies) {
    const recommendations = [];
    
    if (!therapyHistory || therapyHistory.length === 0) {
      return recommendations;
    }

    // Find therapies with positive outcomes
    const successfulTherapies = therapyHistory.filter(session => 
      session.outcome === 'positive' || session.patientSatisfaction >= 4
    );

    // Find therapies with poor outcomes to avoid
    const unsuccessfulTherapies = therapyHistory.filter(session => 
      session.outcome === 'negative' || session.patientSatisfaction < 3
    );

    // Recommend similar successful therapies
    successfulTherapies.forEach(session => {
      const therapy = availableTherapies.find(t => 
        t.category === session.therapy.category && 
        t._id.toString() !== session.therapy._id.toString()
      );
      
      if (therapy) {
        recommendations.push({
          therapy: therapy,
          score: 0.85,
          reason: `Similar to previously successful therapy (${session.therapy.name})`,
          evidence: 'positive_history'
        });
      }
    });

    // Avoid unsuccessful therapy categories (lower score)
    unsuccessfulTherapies.forEach(session => {
      availableTherapies.forEach(therapy => {
        if (therapy.category === session.therapy.category) {
          recommendations.push({
            therapy: therapy,
            score: 0.3,
            reason: `Proceed with caution - similar therapy had mixed results`,
            evidence: 'negative_history'
          });
        }
      });
    });

    return this.deduplicateRecommendations(recommendations);
  }

  // Get seasonal recommendations
  getSeasonalRecommendations(availableTherapies, currentSeason) {
    const recommendations = [];

    Object.entries(this.doshaCharacteristics).forEach(([dosha, characteristics]) => {
      if (characteristics.seasonalPreference.includes(currentSeason)) {
        characteristics.recommendedTherapies.forEach(therapyName => {
          const therapy = availableTherapies.find(t => 
            t.name.toLowerCase().includes(therapyName) || 
            t.sanskritName.toLowerCase().includes(therapyName)
          );
          
          if (therapy) {
            recommendations.push({
              therapy: therapy,
              score: 0.7,
              reason: `Suitable for ${currentSeason} season`,
              evidence: 'seasonal_appropriateness'
            });
          }
        });
      }
    });

    return this.deduplicateRecommendations(recommendations);
  }

  // Get therapy sequence recommendations
  getSequenceRecommendations(therapyHistory, availableTherapies) {
    const recommendations = [];
    
    if (!therapyHistory || therapyHistory.length === 0) {
      // Recommend preparatory therapies for new patients
      this.therapySequence.preparatory.forEach(therapyName => {
        const therapy = availableTherapies.find(t => 
          t.name.toLowerCase().includes(therapyName) || 
          t.sanskritName.toLowerCase().includes(therapyName)
        );
        
        if (therapy) {
          recommendations.push({
            therapy: therapy,
            score: 0.8,
            reason: 'Preparatory therapy recommended for new patients',
            evidence: 'therapy_sequence'
          });
        }
      });
    } else {
      // Analyze last therapy to suggest next in sequence
      const lastTherapy = therapyHistory[therapyHistory.length - 1];
      const nextSequence = this.getNextInSequence(lastTherapy.therapy.name);
      
      nextSequence.forEach(therapyName => {
        const therapy = availableTherapies.find(t => 
          t.name.toLowerCase().includes(therapyName) || 
          t.sanskritName.toLowerCase().includes(therapyName)
        );
        
        if (therapy) {
          recommendations.push({
            therapy: therapy,
            score: 0.75,
            reason: `Follows treatment sequence after ${lastTherapy.therapy.name}`,
            evidence: 'therapy_sequence'
          });
        }
      });
    }

    return recommendations;
  }

  // Combine multiple recommendation sources with weights
  combineRecommendations(weightedRecommendations) {
    const therapyScores = new Map();

    weightedRecommendations.forEach(({ recommendations, weight }) => {
      recommendations.forEach(rec => {
        const therapyId = rec.therapy._id.toString();
        const weightedScore = rec.score * weight;
        
        if (therapyScores.has(therapyId)) {
          const existing = therapyScores.get(therapyId);
          existing.totalScore += weightedScore;
          existing.reasons.push(rec.reason);
          existing.evidence.push(rec.evidence);
        } else {
          therapyScores.set(therapyId, {
            therapy: rec.therapy,
            totalScore: weightedScore,
            reasons: [rec.reason],
            evidence: [rec.evidence]
          });
        }
      });
    });

    // Convert to array and sort by score
    return Array.from(therapyScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .map(item => ({
        therapy: item.therapy,
        score: Math.round(item.totalScore * 100) / 100,
        reasons: [...new Set(item.reasons)],
        evidence: [...new Set(item.evidence)]
      }));
  }

  // Add personalization factors
  addPersonalizationFactors(recommendations, patient, options) {
    return recommendations.map(rec => {
      let personalizedScore = rec.score;
      const personalizedReasons = [...rec.reasons];

      // Age considerations
      const age = this.calculateAge(patient.dateOfBirth);
      if (age > 60 && rec.therapy.isGentleTherapy) {
        personalizedScore += 0.1;
        personalizedReasons.push('Gentle therapy suitable for senior patients');
      }

      // Gender-specific considerations
      if (patient.gender === 'female' && rec.therapy.femaleSpecific) {
        personalizedScore += 0.05;
        personalizedReasons.push('Therapy specifically beneficial for women');
      }

      // Lifestyle factors
      if (patient.medicalHistory?.lifestyle?.stressLevel === 'high' && 
          rec.therapy.category === 'shamana') {
        personalizedScore += 0.1;
        personalizedReasons.push('Stress-reducing therapy');
      }

      return {
        ...rec,
        score: Math.min(1.0, personalizedScore),
        reasons: personalizedReasons
      };
    });
  }

  // Generate reasoning for recommendations
  generateRecommendationReasoning(patient, recommendations) {
    const reasoning = {
      patientProfile: this.generatePatientProfile(patient),
      primaryFactors: [],
      considerations: []
    };

    if (recommendations.length > 0) {
      const topRecommendation = recommendations[0];
      reasoning.primaryFactors = topRecommendation.reasons.slice(0, 3);
    }

    // Add general considerations
    reasoning.considerations = [
      'Recommendations are based on Ayurvedic principles and patient history',
      'Individual response may vary - monitor progress closely',
      'Consult with qualified Ayurvedic physician before starting therapy',
      'Consider contraindications and current health status'
    ];

    return reasoning;
  }

  // Get contraindications
  getContraindications(patient, recommendations) {
    const contraindications = [];

    recommendations.forEach(rec => {
      // Age-based contraindications
      const age = this.calculateAge(patient.dateOfBirth);
      if (age < 18 && rec.therapy.adultOnly) {
        contraindications.push(`${rec.therapy.name}: Not suitable for patients under 18`);
      }

      // Condition-based contraindications
      const conditions = patient.medicalHistory?.currentConditions || [];
      conditions.forEach(condition => {
        if (rec.therapy.contraindications?.includes(condition.toLowerCase())) {
          contraindications.push(`${rec.therapy.name}: Contraindicated for ${condition}`);
        }
      });
    });

    return contraindications;
  }

  // Suggest therapy timeline
  suggestTherapyTimeline(recommendations) {
    if (recommendations.length === 0) return null;

    const timeline = {
      phase1: {
        duration: '1-2 weeks',
        therapies: recommendations.slice(0, 1).map(r => r.therapy.name),
        purpose: 'Initial preparation and assessment'
      },
      phase2: {
        duration: '2-4 weeks',
        therapies: recommendations.slice(1, 3).map(r => r.therapy.name),
        purpose: 'Main therapeutic intervention'
      },
      phase3: {
        duration: '1-2 weeks',
        therapies: ['Follow-up assessment', 'Lifestyle counseling'],
        purpose: 'Consolidation and maintenance'
      }
    };

    return timeline;
  }

  // Helper methods
  async getPatientTherapyHistory(patientId) {
    try {
      const appointments = await Appointment.find({
        patient: patientId,
        status: 'completed'
      })
      .populate('therapy')
      .sort({ createdAt: -1 })
      .limit(10);

      return appointments.map(apt => ({
        therapy: apt.therapy,
        outcome: apt.qualityMetrics?.satisfaction?.overallRating >= 4 ? 'positive' : 'negative',
        patientSatisfaction: apt.qualityMetrics?.satisfaction?.patientSatisfaction || 3,
        completedAt: apt.actualEndTime || apt.createdAt
      }));
    } catch (error) {
      logger.error('Error fetching therapy history:', error);
      return [];
    }
  }

  deduplicateRecommendations(recommendations) {
    const unique = new Map();
    
    recommendations.forEach(rec => {
      const key = rec.therapy._id.toString();
      if (!unique.has(key) || unique.get(key).score < rec.score) {
        unique.set(key, rec);
      }
    });

    return Array.from(unique.values());
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 30; // Default age
    return Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
  }

  getNextInSequence(therapyName) {
    const normalizedName = therapyName.toLowerCase();
    
    if (this.therapySequence.preparatory.some(t => normalizedName.includes(t))) {
      return this.therapySequence.main;
    }
    if (this.therapySequence.main.some(t => normalizedName.includes(t))) {
      return this.therapySequence.rejuvenative;
    }
    return this.therapySequence.preparatory;
  }

  generatePatientProfile(patient) {
    const age = this.calculateAge(patient.dateOfBirth);
    return {
      age: age,
      ageGroup: age < 30 ? 'Young Adult' : age < 60 ? 'Middle Aged' : 'Senior',
      gender: patient.gender,
      primaryDosha: patient.medicalHistory?.doshaAssessment || 'Unknown',
      healthStatus: patient.medicalHistory?.currentConditions?.length > 0 ? 'Has health concerns' : 'Generally healthy'
    };
  }
}

module.exports = new AIRecommendationService();