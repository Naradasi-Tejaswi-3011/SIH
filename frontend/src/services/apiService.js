import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('ayursutra_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('ayursutra_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth token management
  setAuthToken(token) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Authentication
  async login(email, password) {
    return this.api.post('/auth/login', { email, password });
  }

  async register(userData) {
    return this.api.post('/auth/register', userData);
  }

  async logout() {
    return this.api.post('/auth/logout');
  }

  async getCurrentUser() {
    return this.api.get('/auth/me');
  }

  async updateProfile(userData) {
    return this.api.put('/auth/profile', userData);
  }

  async changePassword(currentPassword, newPassword) {
    return this.api.put('/auth/password', { currentPassword, newPassword });
  }

  // Users
  async getUsers(params = {}) {
    return this.api.get('/users', { params });
  }

  async getUser(userId) {
    return this.api.get(`/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return this.api.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.api.delete(`/users/${userId}`);
  }

  // Therapies
  async getTherapies(params = {}) {
    return this.api.get('/therapies', { params });
  }

  async getTherapy(therapyId) {
    return this.api.get(`/therapies/${therapyId}`);
  }

  async createTherapy(therapyData) {
    return this.api.post('/therapies', therapyData);
  }

  async updateTherapy(therapyId, therapyData) {
    return this.api.put(`/therapies/${therapyId}`, therapyData);
  }

  async deleteTherapy(therapyId) {
    return this.api.delete(`/therapies/${therapyId}`);
  }

  // Appointments
  async getAppointments(params = {}) {
    return this.api.get('/appointments', { params });
  }

  async getAppointment(appointmentId) {
    return this.api.get(`/appointments/${appointmentId}`);
  }

  async createAppointment(appointmentData) {
    return this.api.post('/appointments', appointmentData);
  }

  async updateAppointment(appointmentId, appointmentData) {
    return this.api.put(`/appointments/${appointmentId}`, appointmentData);
  }

  async cancelAppointment(appointmentId, reason) {
    return this.api.put(`/appointments/${appointmentId}/cancel`, { reason });
  }

  async rescheduleAppointment(appointmentId, newDateTime, reason) {
    return this.api.put(`/appointments/${appointmentId}/reschedule`, { 
      newDateTime, 
      reason 
    });
  }

  async getTherapistAvailability(therapistId, date) {
    return this.api.get(`/appointments/availability/${therapistId}/${date}`);
  }

  // Therapy Session Tracking
  async startTherapySession(appointmentId, sessionData) {
    return this.api.put(`/appointments/${appointmentId}/start-session`, sessionData);
  }

  async updateSessionProgress(appointmentId, progressData) {
    return this.api.put(`/appointments/${appointmentId}/update-progress`, progressData);
  }

  async completeTherapySession(appointmentId, completionData) {
    return this.api.put(`/appointments/${appointmentId}/complete-session`, completionData);
  }

  async getSessionStatus(appointmentId) {
    return this.api.get(`/appointments/${appointmentId}/session-status`);
  }

  async getLiveSessionData(appointmentId) {
    return this.api.get(`/appointments/${appointmentId}/live-data`);
  }

  // Notifications
  async getNotifications(params = {}) {
    return this.api.get('/notifications', { params });
  }

  async markNotificationAsRead(notificationId) {
    return this.api.put(`/notifications/${notificationId}/read`);
  }

  async getNotificationSettings() {
    return this.api.get('/notifications/settings');
  }

  async updateNotificationSettings(settings) {
    return this.api.put('/notifications/settings', settings);
  }

  // Feedback
  async getFeedback(params = {}) {
    return this.api.get('/feedback', { params });
  }

  async createFeedback(feedbackData) {
    return this.api.post('/feedback', feedbackData);
  }

  async updateFeedback(feedbackId, feedbackData) {
    return this.api.put(`/feedback/${feedbackId}`, feedbackData);
  }

  async deleteFeedback(feedbackId) {
    return this.api.delete(`/feedback/${feedbackId}`);
  }

  // Analytics
  async getPatientProgress(patientId, params = {}) {
    return this.api.get(`/analytics/patient/${patientId}/progress`, { params });
  }

  async getTherapistPerformance(therapistId, params = {}) {
    return this.api.get(`/analytics/therapist/${therapistId}/performance`, { params });
  }

  async getDashboardAnalytics(params = {}) {
    return this.api.get('/analytics/dashboard', { params });
  }

  async getRealtimeAnalytics() {
    return this.api.get('/analytics/realtime');
  }

  // Health Check
  async healthCheck() {
    return this.api.get('/health');
  }

  // File Upload
  async uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Custom requests
  async get(endpoint, config = {}) {
    return this.api.get(endpoint, config);
  }

  async post(endpoint, data = {}, config = {}) {
    return this.api.post(endpoint, data, config);
  }

  async put(endpoint, data = {}, config = {}) {
    return this.api.put(endpoint, data, config);
  }

  async delete(endpoint, config = {}) {
    return this.api.delete(endpoint, config);
  }
}

export const apiService = new ApiService();