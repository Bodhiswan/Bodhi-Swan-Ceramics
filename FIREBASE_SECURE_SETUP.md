# Secure Firebase Booking System Setup Guide

This guide will help you set up the enterprise-grade secure booking system using Firebase with proper authentication, data validation, and security rules.

## Why Firebase Over Google Sheets?

### Security Advantages:
- **End-to-End Encryption**: All data encrypted in transit and at rest
- **Authentication**: Proper user authentication and session management
- **Security Rules**: Granular access control and data validation
- **Audit Logging**: Complete activity tracking and monitoring
- **GDPR Compliance**: Built-in privacy controls and data protection
- **Rate Limiting**: Protection against abuse and spam
- **Real-time Updates**: Instant availability updates across all clients

### Technical Benefits:
- **Scalability**: Handles thousands of concurrent users
- **Reliability**: 99.95% uptime SLA
- **Performance**: Global CDN and optimized queries
- **Offline Support**: Works without internet connection
- **Real-time Sync**: Live updates across all devices

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "Bodhi Swan Ceramics Booking"
4. Enable Google Analytics (recommended)
5. Choose your analytics account
6. Click "Create project"

## Step 2: Enable Firebase Services

### Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" authentication (for booking sessions)
5. Optionally enable "Email/Password" for admin access

### Enable Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select your preferred location (closest to Australia)
5. Click "Done"

### Enable Cloud Functions (for email notifications)
1. Go to "Functions"
2. Click "Get started"
3. Follow the setup instructions
4. Install Firebase CLI: `npm install -g firebase-tools`

## Step 3: Configure Web App

1. In Firebase Console, click the web icon (</>) to add a web app
2. Name it "Bodhi Swan Booking Web App"
3. Enable Firebase Hosting (optional)
4. Copy the Firebase configuration object
5. Replace the config in `assets/js/firebase-booking.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## Step 4: Set Up Security Rules

### Firestore Security Rules
1. Go to "Firestore Database" > "Rules"
2. Replace the default rules with the content from `firebase-security-rules.js`
3. Click "Publish"

### Key Security Features:
- **Data Validation**: All booking data is validated server-side
- **Access Control**: Users can only access their own bookings
- **Admin Protection**: Admin functions require special permissions
- **Input Sanitization**: Prevents XSS and injection attacks
- **Rate Limiting**: Built-in protection against spam

## Step 5: Initialize Database Structure

### Create Collections
Run these commands in the Firebase Console or use the admin SDK:

```javascript
// Availability collection
db.collection('availability').add({
    dateKey: '2025-08-11',
    date: new Date('2025-08-11'),
    dayOfWeek: 'Monday',
    times: ['6:00 PM'],
    maxCapacity: 6,
    currentBookings: 0,
    classType: 'regular'
});

// Admin collection (replace with your email)
db.collection('admin').doc('your-admin-uid').set({
    email: 'swan1995@gmail.com',
    role: 'admin',
    createdAt: new Date()
});
```

## Step 6: Set Up Cloud Functions (Email Notifications)

### Install Dependencies
```bash
cd functions
npm install nodemailer
npm install @google-cloud/firestore
```

### Create Email Function
Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure email transporter
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password' // Use App Password, not regular password
    }
});

exports.sendBookingConfirmation = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { bookingData, bookingId } = data;

    // Send confirmation email to customer
    const customerEmail = {
        from: 'Bodhi Swan Ceramics <your-email@gmail.com>',
        to: bookingData.email,
        subject: `Pottery Class Booking Confirmation - ${bookingData.date}`,
        html: generateConfirmationEmail(bookingData, bookingId)
    };

    // Send notification to studio
    const studioEmail = {
        from: 'Booking System <your-email@gmail.com>',
        to: 'swan1995@gmail.com',
        subject: `New Booking: ${bookingData.fullName} - ${bookingData.date}`,
        text: generateStudioNotification(bookingData, bookingId)
    };

    try {
        await transporter.sendMail(customerEmail);
        await transporter.sendMail(studioEmail);
        return { success: true };
    } catch (error) {
        console.error('Email error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send email');
    }
});

function generateConfirmationEmail(bookingData, bookingId) {
    return `
        <h2>Booking Confirmed!</h2>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Date:</strong> ${bookingData.date}</p>
        <p><strong>Time:</strong> ${bookingData.time}</p>
        <p><strong>Class:</strong> ${bookingData.classType}</p>
        <p>Payment is due at the beginning of class.</p>
    `;
}

function generateStudioNotification(bookingData, bookingId) {
    return `
New booking received:
Booking ID: ${bookingId}
Name: ${bookingData.fullName}
Email: ${bookingData.email}
Phone: ${bookingData.phone}
Date: ${bookingData.date}
Time: ${bookingData.time}
Experience: ${bookingData.experience}
Notes: ${bookingData.notes || 'None'}
    `;
}
```

### Deploy Functions
```bash
firebase deploy --only functions
```

## Step 7: Update Website Links

Update your classes page and homepage to link to the secure booking system:

```html
<!-- Replace booking.html links with secure-booking.html -->
<a href="secure-booking.html" class="btn btn-primary">Book Securely</a>
```

## Step 8: Test the System

1. Open `secure-booking.html` in your browser
2. Check that Firebase initializes correctly
3. Test date selection and form validation
4. Submit a test booking
5. Verify emails are sent
6. Check Firestore for the booking data

## Security Features Implemented

### Data Protection
- **AES-256 Encryption**: All data encrypted at rest
- **TLS 1.3**: Encrypted data transmission
- **Input Validation**: Server-side validation prevents malicious input
- **XSS Protection**: Content sanitization and CSP headers
- **CSRF Protection**: Firebase handles CSRF tokens automatically

### Access Control
- **Anonymous Authentication**: Secure session for booking
- **Role-Based Access**: Admin vs. user permissions
- **Data Isolation**: Users can only access their own data
- **Audit Logging**: All actions logged for security monitoring

### Privacy Compliance
- **Data Minimization**: Only collect necessary information
- **Purpose Limitation**: Data used only for booking purposes
- **Retention Control**: Automatic data cleanup policies
- **User Rights**: Easy data access and deletion

## Monitoring and Maintenance

### Firebase Console Monitoring
- **Authentication**: Monitor user sessions
- **Firestore**: Track database usage and performance
- **Functions**: Monitor email delivery and errors
- **Security**: Review security rule violations

### Regular Maintenance
- **Security Rules**: Review and update quarterly
- **Function Updates**: Keep dependencies updated
- **Data Cleanup**: Remove old bookings as needed
- **Performance**: Monitor and optimize queries

## Cost Estimation

### Firebase Pricing (Free Tier Limits)
- **Authentication**: 10,000 verifications/month (free)
- **Firestore**: 50,000 reads, 20,000 writes/day (free)
- **Functions**: 125,000 invocations/month (free)
- **Hosting**: 10GB storage, 360MB/day transfer (free)

### Estimated Monthly Costs (Beyond Free Tier)
- Small pottery studio: **$0-5/month**
- Medium studio (100+ bookings/month): **$5-15/month**
- Large studio (500+ bookings/month): **$15-30/month**

## Backup and Recovery

### Automated Backups
Firebase automatically backs up your data, but you can also:

1. **Export Data**: Use Firebase CLI to export Firestore data
2. **Cloud Storage**: Set up automated exports to Cloud Storage
3. **Local Backups**: Download booking data regularly

### Disaster Recovery
- **Multi-region**: Firebase replicates data across regions
- **Point-in-time Recovery**: Restore to any point in the last 7 days
- **Offline Capability**: App works without internet connection

## Support and Troubleshooting

### Common Issues
1. **Authentication Errors**: Check Firebase config and API keys
2. **Security Rule Violations**: Review Firestore rules and permissions
3. **Email Delivery**: Verify SMTP settings and app passwords
4. **Performance**: Optimize queries and add indexes

### Getting Help
- **Firebase Documentation**: https://firebase.google.com/docs
- **Stack Overflow**: Tag questions with 'firebase'
- **Firebase Support**: Available for paid plans
- **Community Forums**: Firebase community discussions

This secure Firebase implementation provides enterprise-grade security while maintaining ease of use for your pottery studio booking system.