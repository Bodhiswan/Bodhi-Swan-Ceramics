/**
 * Google Apps Script for Bodhi Swan Ceramics Booking System
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet with these tabs:
 *    - "Bookings" (for storing booking data)
 *    - "Availability" (for managing class schedules)
 *    - "Settings" (for configuration)
 * 
 * 2. Go to script.google.com and create a new project
 * 3. Replace the default code with this script
 * 4. Deploy as a web app with execute permissions for "Anyone"
 * 5. Copy the web app URL to your booking.js config
 * 
 * GOOGLE SHEET STRUCTURE:
 * 
 * Bookings Sheet (columns A-L):
 * A: Timestamp | B: Date | C: Time | D: Class Type | E: Full Name | F: Email 
 * G: Phone | H: Experience | I: Notes | J: Status | K: Date Key | L: Booking ID
 * 
 * Availability Sheet (columns A-F):
 * A: Date Key | B: Date | C: Day of Week | D: Times Available | E: Max Capacity | F: Current Bookings
 * 
 * Settings Sheet (columns A-B):
 * A: Setting Name | B: Value
 * (e.g., "default_capacity", "6", "notification_email", "swan1995@gmail.com")
 */

// Configuration
const CONFIG = {
  BOOKINGS_SHEET: 'Bookings',
  AVAILABILITY_SHEET: 'Availability',
  SETTINGS_SHEET: 'Settings',
  NOTIFICATION_EMAIL: 'swan1995@gmail.com'
};

/**
 * Main function to handle web app requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'submitBooking':
        return submitBooking(data.data);
      case 'getAvailability':
        return getAvailability();
      case 'updateAvailability':
        return updateAvailability(data.data);
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Handle GET requests for availability
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getAvailability') {
      return getAvailability();
    }
    
    return createResponse(false, 'Invalid GET action');
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Submit a new booking
 */
function submitBooking(bookingData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingsSheet = ss.getSheetByName(CONFIG.BOOKINGS_SHEET);
    const availabilitySheet = ss.getSheetByName(CONFIG.AVAILABILITY_SHEET);
    
    // Generate unique booking ID
    const bookingId = generateBookingId();
    
    // Check availability
    const availability = getDateAvailability(bookingData.dateKey);
    if (!availability || availability.available <= 0) {
      return createResponse(false, 'This time slot is no longer available');
    }
    
    // Add booking to sheet
    const row = [
      new Date(), // Timestamp
      bookingData.date,
      bookingData.time,
      bookingData.classType,
      bookingData.fullName,
      bookingData.email,
      bookingData.phone,
      bookingData.experience,
      bookingData.notes || '',
      'confirmed', // Status
      bookingData.dateKey,
      bookingId
    ];
    
    bookingsSheet.appendRow(row);
    
    // Update availability
    updateDateAvailability(bookingData.dateKey, -1);
    
    // Send confirmation emails
    sendBookingConfirmation(bookingData, bookingId);
    sendNotificationToStudio(bookingData, bookingId);
    
    return createResponse(true, 'Booking confirmed', { bookingId });
    
  } catch (error) {
    console.error('Error submitting booking:', error);
    return createResponse(false, 'Failed to submit booking: ' + error.toString());
  }
}

/**
 * Get current availability for all dates
 */
function getAvailability() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const availabilitySheet = ss.getSheetByName(CONFIG.AVAILABILITY_SHEET);
    
    // If availability sheet is empty, initialize it
    if (availabilitySheet.getLastRow() <= 1) {
      initializeAvailability();
    }
    
    const data = availabilitySheet.getDataRange().getValues();
    const headers = data[0];
    const slots = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const dateKey = row[0];
      const times = row[3] ? row[3].split(',').map(t => t.trim()) : [];
      const maxCapacity = row[4] || 6;
      const currentBookings = row[5] || 0;
      
      if (dateKey && times.length > 0) {
        slots[dateKey] = {
          times: times,
          maxCapacity: maxCapacity,
          booked: currentBookings,
          available: maxCapacity - currentBookings
        };
      }
    }
    
    return createResponse(true, 'Availability loaded', { slots });
    
  } catch (error) {
    console.error('Error getting availability:', error);
    return createResponse(false, 'Failed to load availability: ' + error.toString());
  }
}

/**
 * Initialize availability sheet with default schedule
 */
function initializeAvailability() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const availabilitySheet = ss.getSheetByName(CONFIG.AVAILABILITY_SHEET);
  
  // Clear existing data
  availabilitySheet.clear();
  
  // Add headers
  const headers = ['Date Key', 'Date', 'Day of Week', 'Times Available', 'Max Capacity', 'Current Bookings'];
  availabilitySheet.appendRow(headers);
  
  // Generate availability for next 3 months
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  
  for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dateKey = formatDateKey(date);
    const dateStr = formatDisplayDate(date);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    // Monday evening classes
    if (dayOfWeek === 1) {
      availabilitySheet.appendRow([
        dateKey,
        dateStr,
        dayName,
        '6:00 PM',
        6,
        0
      ]);
    }
    
    // Saturday workshops (every other Saturday)
    if (dayOfWeek === 6 && Math.floor((date.getDate() - 1) / 7) % 2 === 0) {
      availabilitySheet.appendRow([
        dateKey,
        dateStr,
        dayName,
        '10:00 AM, 2:00 PM',
        8,
        0
      ]);
    }
  }
}

/**
 * Get availability for a specific date
 */
function getDateAvailability(dateKey) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const availabilitySheet = ss.getSheetByName(CONFIG.AVAILABILITY_SHEET);
  
  const data = availabilitySheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dateKey) {
      return {
        maxCapacity: data[i][4] || 6,
        currentBookings: data[i][5] || 0,
        available: (data[i][4] || 6) - (data[i][5] || 0)
      };
    }
  }
  
  return null;
}

/**
 * Update availability for a specific date
 */
function updateDateAvailability(dateKey, change) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const availabilitySheet = ss.getSheetByName(CONFIG.AVAILABILITY_SHEET);
  
  const data = availabilitySheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dateKey) {
      const currentBookings = (data[i][5] || 0) + change;
      availabilitySheet.getRange(i + 1, 6).setValue(Math.max(0, currentBookings));
      break;
    }
  }
}

/**
 * Send booking confirmation email to customer
 */
function sendBookingConfirmation(bookingData, bookingId) {
  const subject = `Pottery Class Booking Confirmation - ${bookingData.date}`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f8f9fa; padding: 2rem; border-radius: 8px; margin-bottom: 2rem;">
        <h2 style="color: #2c3e50; margin: 0;">Booking Confirmed!</h2>
        <p style="color: #7f8c8d; margin: 0.5rem 0 0 0;">Bodhi Swan Ceramics</p>
      </div>
      
      <div style="margin-bottom: 2rem;">
        <h3 style="color: #2c3e50;">Class Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 0.5rem 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">${bookingData.date}</td></tr>
          <tr><td style="padding: 0.5rem 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td><td style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">${bookingData.time}</td></tr>
          <tr><td style="padding: 0.5rem 0; border-bottom: 1px solid #eee;"><strong>Class Type:</strong></td><td style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">${bookingData.classType}</td></tr>
          <tr><td style="padding: 0.5rem 0; border-bottom: 1px solid #eee;"><strong>Booking ID:</strong></td><td style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">${bookingId}</td></tr>
        </table>
      </div>
      
      <div style="background: #e8f4fd; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
        <h4 style="color: #2c3e50; margin: 0 0 1rem 0;">Important Reminders</h4>
        <ul style="margin: 0; padding-left: 1.5rem; color: #5a6c7d;">
          <li>Payment is due at the beginning of class</li>
          <li>Wear clothes you don't mind getting dirty</li>
          <li>Closed-toe shoes recommended</li>
          <li>All tools and materials provided</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 2rem;">
        <h4 style="color: #2c3e50;">Studio Location</h4>
        <p style="margin: 0.5rem 0;">Shop 4 & 6, 8 Station Road<br>Indooroopilly, QLD</p>
        <p style="margin: 0.5rem 0; color: #7f8c8d;">Free parking behind the studio off Coonan Street</p>
      </div>
      
      <div style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #eee;">
        <p style="color: #7f8c8d; margin: 0;">Questions? Reply to this email or call 0478 756 284</p>
      </div>
    </div>
  `;
  
  try {
    GmailApp.sendEmail(
      bookingData.email,
      subject,
      '', // Plain text version
      {
        htmlBody: htmlBody,
        name: 'Bodhi Swan Ceramics'
      }
    );
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

/**
 * Send notification email to studio
 */
function sendNotificationToStudio(bookingData, bookingId) {
  const subject = `New Booking: ${bookingData.fullName} - ${bookingData.date}`;
  
  const body = `
New pottery class booking received:

Booking ID: ${bookingId}
Date: ${bookingData.date}
Time: ${bookingData.time}
Class Type: ${bookingData.classType}

Student Information:
Name: ${bookingData.fullName}
Email: ${bookingData.email}
Phone: ${bookingData.phone}
Experience: ${bookingData.experience}

Special Notes:
${bookingData.notes || 'None'}

The booking has been automatically confirmed and the customer has been sent a confirmation email.
  `;
  
  try {
    GmailApp.sendEmail(
      CONFIG.NOTIFICATION_EMAIL,
      subject,
      body
    );
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}

/**
 * Generate unique booking ID
 */
function generateBookingId() {
  const timestamp = new Date().getTime().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BSC-${timestamp}-${random}`.toUpperCase();
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Format date for display
 */
function formatDisplayDate(date) {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Create standardized response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to initialize the system
 */
function initializeSystem() {
  try {
    // First, check if we have an active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) {
      throw new Error('No active spreadsheet found. Please open a Google Sheet first.');
    }
    
    console.log('Active spreadsheet found:', ss.getName());
    
    // Create sheets if they don't exist
    const sheetNames = [CONFIG.BOOKINGS_SHEET, CONFIG.AVAILABILITY_SHEET, CONFIG.SETTINGS_SHEET];
    
    sheetNames.forEach(name => {
      try {
        let sheet = ss.getSheetByName(name);
        if (!sheet) {
          console.log('Creating sheet:', name);
          sheet = ss.insertSheet(name);
        } else {
          console.log('Sheet already exists:', name);
        }
      } catch (error) {
        console.error('Error creating sheet', name, ':', error);
        throw error;
      }
    });
  
  // Initialize availability
  initializeAvailability();
  
  // Initialize settings
  const settingsSheet = ss.getSheetByName(CONFIG.SETTINGS_SHEET);
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.clear();
    settingsSheet.appendRow(['Setting', 'Value']);
    settingsSheet.appendRow(['default_capacity', '6']);
    settingsSheet.appendRow(['notification_email', CONFIG.NOTIFICATION_EMAIL]);
    settingsSheet.appendRow(['studio_address', 'Shop 4 & 6, 8 Station Road, Indooroopilly, QLD']);
  }
  
  // Initialize bookings sheet headers
  const bookingsSheet = ss.getSheetByName(CONFIG.BOOKINGS_SHEET);
  if (bookingsSheet.getLastRow() <= 1) {
    bookingsSheet.clear();
    const headers = ['Timestamp', 'Date', 'Time', 'Class Type', 'Full Name', 'Email', 'Phone', 'Experience', 'Notes', 'Status', 'Date Key', 'Booking ID'];
    bookingsSheet.appendRow(headers);
  }
  
    console.log('System initialized successfully');
    return 'System initialized successfully! All sheets created.';
    
  } catch (error) {
    console.error('Error initializing system:', error);
    throw new Error('Initialization failed: ' + error.toString());
  }
}

/**
 * Alternative initialization function that creates a new spreadsheet
 */
function createNewBookingSpreadsheet() {
  try {
    // Create a new spreadsheet
    const ss = SpreadsheetApp.create('Bodhi Swan Ceramics - Booking System');
    
    console.log('New spreadsheet created:', ss.getUrl());
    
    // Remove default sheet
    const defaultSheet = ss.getSheets()[0];
    if (defaultSheet.getName() === 'Sheet1') {
      ss.deleteSheet(defaultSheet);
    }
    
    // Create our sheets
    const sheetNames = [CONFIG.BOOKINGS_SHEET, CONFIG.AVAILABILITY_SHEET, CONFIG.SETTINGS_SHEET];
    
    sheetNames.forEach(name => {
      ss.insertSheet(name);
    });
    
    // Initialize the sheets with data
    initializeAvailabilityForSpreadsheet(ss);
    initializeSettingsForSpreadsheet(ss);
    initializeBookingsForSpreadsheet(ss);
    
    console.log('New booking system spreadsheet created successfully');
    console.log('Spreadsheet URL:', ss.getUrl());
    
    return {
      success: true,
      message: 'New booking system created successfully!',
      spreadsheetUrl: ss.getUrl(),
      spreadsheetId: ss.getId()
    };
    
  } catch (error) {
    console.error('Error creating new spreadsheet:', error);
    throw new Error('Failed to create new spreadsheet: ' + error.toString());
  }
}

/**
 * Initialize availability for a specific spreadsheet
 */
function initializeAvailabilityForSpreadsheet(ss) {
  const availabilitySheet = ss.getSheetByName(CONFIG.AVAILABILITY_SHEET);
  
  // Clear existing data
  availabilitySheet.clear();
  
  // Add headers
  const headers = ['Date Key', 'Date', 'Day of Week', 'Times Available', 'Max Capacity', 'Current Bookings'];
  availabilitySheet.appendRow(headers);
  
  // Generate availability for next 3 months
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  
  for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dateKey = formatDateKey(date);
    const dateStr = formatDisplayDate(date);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    // Monday evening classes
    if (dayOfWeek === 1) {
      availabilitySheet.appendRow([
        dateKey,
        dateStr,
        dayName,
        '6:00 PM',
        6,
        0
      ]);
    }
    
    // Saturday workshops (every other Saturday)
    if (dayOfWeek === 6 && Math.floor((date.getDate() - 1) / 7) % 2 === 0) {
      availabilitySheet.appendRow([
        dateKey,
        dateStr,
        dayName,
        '10:00 AM, 2:00 PM',
        8,
        0
      ]);
    }
  }
}

/**
 * Initialize settings for a specific spreadsheet
 */
function initializeSettingsForSpreadsheet(ss) {
  const settingsSheet = ss.getSheetByName(CONFIG.SETTINGS_SHEET);
  settingsSheet.clear();
  settingsSheet.appendRow(['Setting', 'Value']);
  settingsSheet.appendRow(['default_capacity', '6']);
  settingsSheet.appendRow(['notification_email', CONFIG.NOTIFICATION_EMAIL]);
  settingsSheet.appendRow(['studio_address', 'Shop 4 & 6, 8 Station Road, Indooroopilly, QLD']);
}

/**
 * Initialize bookings for a specific spreadsheet
 */
function initializeBookingsForSpreadsheet(ss) {
  const bookingsSheet = ss.getSheetByName(CONFIG.BOOKINGS_SHEET);
  bookingsSheet.clear();
  const headers = ['Timestamp', 'Date', 'Time', 'Class Type', 'Full Name', 'Email', 'Phone', 'Experience', 'Notes', 'Status', 'Date Key', 'Booking ID'];
  bookingsSheet.appendRow(headers);
}