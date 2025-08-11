# Google Sheets Booking System Setup Guide

This guide will help you set up the serverless booking system using Google Sheets and Google Apps Script.

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Bodhi Swan Ceramics - Booking System"
4. Create three sheets with these exact names:
   - `Bookings`
   - `Availability` 
   - `Settings`

## Step 2: Set up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace the default code with the contents of `google-apps-script.js`
4. Save the project (name it "Bodhi Swan Booking System")
5. Run the `initializeSystem()` function once to set up the sheets
6. Deploy as web app:
   - Click "Deploy" > "New Deployment"
   - Choose "Web app" as type
   - Set execute as "Me"
   - Set access to "Anyone"
   - Click "Deploy"
   - Copy the web app URL

## Step 3: Configure the Frontend

1. Open `assets/js/booking.js`
2. Update the config object with your details:

```javascript
this.config = {
    // Replace with your Google Sheets ID (from the URL)
    spreadsheetId: 'YOUR_GOOGLE_SHEETS_ID',
    // Replace with your Google Apps Script Web App URL
    scriptUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL',
    // Optional: API Key for reading public sheets
    apiKey: 'YOUR_GOOGLE_API_KEY'
};
```

## Step 4: Test the System

1. Open your website and navigate to `/booking.html`
2. The calendar should load with available dates
3. Try making a test booking
4. Check your Google Sheet to see if the booking appears
5. Check your email for confirmation

## Google Sheets Structure

### Bookings Sheet
| Column | Header | Description |
|--------|--------|-------------|
| A | Timestamp | When booking was made |
| B | Date | Class date (formatted) |
| C | Time | Class time |
| D | Class Type | Type of class booked |
| E | Full Name | Student's name |
| F | Email | Student's email |
| G | Phone | Student's phone |
| H | Experience | Experience level |
| I | Notes | Special requests |
| J | Status | Booking status |
| K | Date Key | Date in YYYY-MM-DD format |
| L | Booking ID | Unique booking identifier |

### Availability Sheet
| Column | Header | Description |
|--------|--------|-------------|
| A | Date Key | Date in YYYY-MM-DD format |
| B | Date | Formatted date |
| C | Day of Week | Day name |
| D | Times Available | Comma-separated times |
| E | Max Capacity | Maximum students |
| F | Current Bookings | Number of bookings |

### Settings Sheet
| Column | Header | Description |
|--------|--------|-------------|
| A | Setting | Setting name |
| B | Value | Setting value |

## Managing Your Schedule

### Adding New Class Dates
1. Open the Availability sheet
2. Add a new row with:
   - Date Key: YYYY-MM-DD format
   - Date: Formatted date
   - Day of Week: Day name
   - Times Available: e.g., "6:00 PM" or "10:00 AM, 2:00 PM"
   - Max Capacity: Number (e.g., 6)
   - Current Bookings: 0

### Viewing Bookings
- All bookings appear in the Bookings sheet
- Sort by date to see upcoming classes
- Filter by status to see confirmed/cancelled bookings

### Email Notifications
- You'll receive an email for each new booking
- Customers receive automatic confirmation emails
- Update the notification email in the Settings sheet

## Customization Options

### Class Schedule
Edit the `initializeAvailability()` function in Google Apps Script to change:
- Which days classes are offered
- Class times
- Capacity limits

### Email Templates
Modify the `sendBookingConfirmation()` function to customize:
- Email styling
- Content and messaging
- Additional information

### Pricing
Update the booking form options in `booking.html` to reflect your current pricing.

## Troubleshooting

### Common Issues

1. **Calendar not loading**
   - Check the script URL in booking.js
   - Ensure the web app is deployed with "Anyone" access
   - Check browser console for errors

2. **Bookings not saving**
   - Verify the Google Apps Script has permission to access Gmail
   - Check that the sheet names match exactly
   - Run the initializeSystem() function again

3. **Emails not sending**
   - Ensure Gmail API is enabled in Google Apps Script
   - Check spam folders
   - Verify email addresses are correct

### Getting Help

If you encounter issues:
1. Check the Google Apps Script logs for errors
2. Test the script functions individually
3. Verify all sheet names and column headers match exactly
4. Ensure the web app deployment is set to "Anyone" access

## Security Notes

- The system uses Google's authentication
- No sensitive data is stored in the frontend
- All booking data is secured in your Google account
- Email notifications are sent through Gmail

## Backup and Maintenance

- Google Sheets automatically saves all data
- Export bookings regularly for your records
- Update availability seasonally
- Monitor the system for any issues

This serverless solution provides a robust, cost-effective booking system that scales with your business needs.