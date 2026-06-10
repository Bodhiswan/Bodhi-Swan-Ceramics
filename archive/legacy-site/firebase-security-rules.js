/**
 * Firebase Security Rules for Bodhi Swan Ceramics Booking System
 * These rules ensure data security and proper access control
 */

// Firestore Security Rules
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Availability collection - read-only for public, write for admin only
    match /availability/{document} {
      allow read: if true; // Public can read availability
      allow write: if isAdmin(); // Only admin can modify availability
    }
    
    // Bookings collection - secure access
    match /bookings/{bookingId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isValidBooking() && isOwner(request.auth.uid);
      allow update: if isAdmin(); // Only admin can update bookings
      allow delete: if false; // No deletion allowed
    }
    
    // Users collection - user can only access their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId) || isAdmin();
    }
    
    // Activity logs - admin only
    match /activity/{document} {
      allow read, write: if isAdmin();
    }
    
    // Admin collection - admin only
    match /admin/{document} {
      allow read, write: if isAdmin();
    }
    
    // Helper functions
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/admin/$(request.auth.uid));
    }
    
    function isValidBooking() {
      let data = request.resource.data;
      return data.keys().hasAll(['fullName', 'email', 'phone', 'classType', 'experience']) &&
             data.fullName is string && data.fullName.size() >= 2 && data.fullName.size() <= 50 &&
             data.email is string && data.email.matches('.*@.*\\..*') &&
             data.phone is string && data.phone.size() >= 10 &&
             data.classType in ['drop-in', 'weekly', 'private'] &&
             data.experience in ['beginner', 'some', 'intermediate', 'advanced'] &&
             data.status == 'confirmed' &&
             data.userId == request.auth.uid;
    }
  }
}`;

// Cloud Storage Security Rules (for future file uploads)
const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only allow authenticated users to upload profile images
    match /profile-images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Admin uploads
    match /admin/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    function isAdmin() {
      return request.auth != null && 
             firestore.exists(/databases/(default)/documents/admin/$(request.auth.uid));
    }
  }
}`;

module.exports = {
  firestoreRules,
  storageRules
};