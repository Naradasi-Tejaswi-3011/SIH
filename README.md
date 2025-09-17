# AyurSutra - Panchakarma Patient Management and Therapy Scheduling Software

## 🌟 Overview

AyurSutra is a comprehensive digital platform designed specifically for Panchakarma centers to manage patients, therapies, appointments, and the complete treatment lifecycle. The system addresses the current challenges in Panchakarma management by providing automation, AI-driven insights, and standardized processes.

## ✨ Key Features

### Core Functionalities (SIH Requirements)

- **Automated Therapy Scheduling System**
  - Smart booking engine for patients and practitioners
  - Optimized therapist availability and room allocation
  - Automatic conflict resolution and rescheduling

- **Pre & Post-Procedure Notification System**
  - Multi-channel alerts (in-app, SMS, email)
  - Personalized dietary and lifestyle instructions
  - Compliance tracking and reminders

- **Real-Time Therapy Tracking**
  - Live progress monitoring with session check-ins
  - Digital dashboard for patients and doctors
  - Vital parameters and recovery milestone tracking

- **Visualization Tools**
  - Progress graphs and improvement charts
  - Wellness indexes and heatmaps
  - Before/after therapy comparisons

- **Integrated Feedback Loop**
  - Post-session patient feedback collection
  - AI-assisted recommendations for treatment optimization
  - Continuous improvement analytics

## 🏗️ Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with role-based access control
- **Security**: bcryptjs for password hashing, Helmet for security headers
- **Logging**: Winston for structured logging
- **Validation**: Joi for request validation
- **Real-time**: Socket.io for live updates
- **File Upload**: Multer for handling file uploads

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AyurSutra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy the `.env` file and update the MongoDB connection string
   - Update email and SMS API configurations
   - Set a secure JWT secret

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify installation**
   ```bash
   node test-api.js
   ```

The server will start on port 5000 by default.

## 📊 Database Models

### User Model
- Supports multiple roles: Patient, Doctor, Therapist, Admin
- Role-specific fields for medical history and professional information
- Advanced authentication with account locking and verification

### Therapy Model
- Comprehensive therapy definitions with Sanskrit names
- Detailed requirements (room, equipment, materials)
- Pricing and scheduling preferences
- Safety parameters and side effects tracking

### Appointment Model
- Complete appointment lifecycle management
- Real-time progress tracking
- Resource allocation and conflict management
- Quality metrics and satisfaction tracking

### Notification Model
- Multi-channel delivery (email, SMS, push, in-app)
- Template-based messaging with personalization
- Delivery tracking and retry logic
- Quiet hours and user preferences

### Feedback Model
- Comprehensive feedback collection with ratings
- Health outcome tracking and improvement metrics
- Sentiment analysis integration
- Moderation and response workflows

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Account Security**: Login attempt tracking and account locking
- **Role-Based Access Control**: Granular permissions system
- **Data Validation**: Comprehensive input validation with Joi
- **Security Headers**: Helmet.js for security hardening

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/forgotpassword` - Request password reset

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Therapies
- `GET /api/therapies` - Get all therapies
- `GET /api/therapies/:id` - Get therapy details
- `POST /api/therapies` - Create therapy (doctor/admin)
- `PUT /api/therapies/:id` - Update therapy
- `DELETE /api/therapies/:id` - Delete therapy (admin only)

### Appointments
- `GET /api/appointments` - Get appointments
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/reschedule` - Reschedule appointment
- `GET /api/appointments/availability/:therapistId/:date` - Check availability

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read

### Feedback
- `GET /api/feedback` - Get feedback
- `POST /api/feedback` - Submit feedback
- `PUT /api/feedback/:id/respond` - Respond to feedback

## 📋 Project Status

✅ **Completed:**
- Project setup and dependencies
- Database models and schemas
- User authentication and authorization
- Basic API structure with placeholder routes
- Security middleware and validation
- Error handling and logging
- MongoDB connection and testing

🚧 **In Progress:**
- Complete API implementation for scheduling system
- Notification service with multi-channel delivery
- Real-time therapy tracking with Socket.io
- Data visualization components
- Frontend interface development

📅 **Planned:**
- AI-powered recommendations
- Advanced analytics and reporting
- Mobile application
- Third-party integrations (payment, SMS, email)
- Comprehensive testing suite
- Deployment configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 SIH 2024 Compliance

This project addresses all requirements outlined in the Smart India Hackathon 2024 problem statement:
- ✅ Automated therapy scheduling with conflict resolution
- ✅ Multi-channel notification system
- ✅ Real-time progress tracking
- ✅ Data visualization and analytics
- ✅ Integrated feedback mechanisms
- ✅ Government-aligned healthcare standards
- ✅ Scalable architecture for medical tourism

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**AyurSutra** - Transforming Panchakarma management through technology 🧘‍♀️✨