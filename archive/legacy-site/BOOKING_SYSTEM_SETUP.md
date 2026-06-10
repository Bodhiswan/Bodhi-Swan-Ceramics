# Booking + Stripe Setup Guide

This guide will help you run the booking calendar with:

- Google Sheets + Google Apps Script for availability, emails, and booking records
- Netlify Functions for the public booking API and Stripe checkout creation
- Stripe Checkout for paid class bookings

## Step 1: Set up Google Apps Script (IMPORTANT: Do this first!)

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace the default code with the contents of `google-apps-script.js`
4. Save the project (name it "Bodhi Swan Booking System")

## Step 2: Create and Initialize the Spreadsheet

**Option A: Create New Spreadsheet (Recommended)**
1. In Google Apps Script, run the `createNewBookingSpreadsheet()` function
2. This will automatically create a new spreadsheet with all required sheets
3. Copy the spreadsheet URL from the execution log
4. The spreadsheet will be named "Bodhi Swan Ceramics - Booking System"

**Option B: Use Existing Spreadsheet**
1. Create a new Google Sheet manually
2. Name it "Bodhi Swan Ceramics - Booking System"
3. In Google Apps Script, go to "Resources" > "Libraries" or use the spreadsheet container
4. Bind the script to your spreadsheet
5. Run the `initializeSystem()` function

## Step 3: Deploy the Web App

1. In Google Apps Script, click "Deploy" > "New Deployment"
2. Choose "Web app" as type
3. Set execute as "Me"
4. Set access to "Anyone"
5. Click "Deploy"
6. Copy the web app URL
7. **Important**: You may need to authorize the script to access Gmail and Sheets

## Step 4: Configure Netlify

Add these environment variables in Netlify:

- `BOOKING_APPS_SCRIPT_URL`
  - your deployed Google Apps Script web app URL
- `STRIPE_SECRET_KEY`
  - your Stripe restricted or secret key for Checkout Session creation
- `STRIPE_WEBHOOK_SECRET`
  - the `whsec_...` signing secret from the Stripe webhook endpoint
- `PUBLIC_SITE_URL`
  - `https://bodhiswan.com`

Optional:

- `BOOKING_API_URL`
  - `https://bodhiswanceramics.netlify.app/.netlify/functions/booking-api`
  - only needed if you want the checkout creator to call the public Netlify booking endpoint instead of talking to Apps Script directly

## Step 5: Stripe Webhook

In Stripe, use this webhook endpoint:

- `https://bodhiswanceramics.netlify.app/.netlify/functions/stripe-webhook`

Listen for:

- `checkout.session.completed`

The webhook now handles both:

- shop purchases
- paid class bookings

For paid class bookings it will:

1. receive the successful Stripe checkout event
2. send the booking into Google Apps Script
3. try to confirm the booking automatically
4. fall back to a booking request if the slot can no longer be auto-confirmed

## Step 6: Frontend

`calendar.html` and `booking.html` now point at:

- `https://bodhiswanceramics.netlify.app/.netlify/functions/booking-api`
- `https://bodhiswanceramics.netlify.app/.netlify/functions/create-booking-checkout`

So you do not need to paste the Apps Script URL into the frontend anymore.

## Step 7: Test the System

1. Open your website and navigate to `/calendar.html`
2. The calendar should load with available dates
3. Test a private lesson request
4. Test a paid class booking with Stripe
5. Check your Google Sheet:
   - successful paid class should land in `Bookings`
   - fallback/manual cases should land in `Booking Requests`
6. Check email notifications and customer confirmations

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
- Paid confirmed classes appear in the `Bookings` sheet
- Manual/private/fallback cases appear in `Booking Requests`
- Sort by date to see upcoming classes
- Filter by status to see confirmed/request entries

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
Update the class pricing in both places if it changes:

- `calendar.html` / `booking.html` form labels
- `netlify/functions/create-booking-checkout.js`

## Troubleshooting

### Common Issues

1. **Error: "Cannot read properties of null (reading 'getSheetByName')"**
   - This means the script isn't properly connected to a spreadsheet
   - Solution: Use `createNewBookingSpreadsheet()` function instead of `initializeSystem()`
   - Or ensure you're running the script from within a Google Sheet (not standalone)

2. **Calendar not loading**
   - Check `BOOKING_APPS_SCRIPT_URL` in Netlify
   - Ensure the web app is deployed with "Anyone" access
   - Check the Netlify function:
     - `/.netlify/functions/booking-api`

3. **Bookings not saving after payment**
   - Verify the Stripe webhook is active
   - Verify `STRIPE_WEBHOOK_SECRET` in Netlify
   - Verify `BOOKING_APPS_SCRIPT_URL` in Netlify
   - Check Netlify function logs
   - Re-run the Apps Script initialization if the sheet tabs are missing

4. **Stripe checkout not opening**
   - Verify `STRIPE_SECRET_KEY` in Netlify
   - Confirm the class type is one of:
     - `first-class`
     - `returning-class`

5. **Emails not sending**
   - Ensure Gmail API is enabled in Google Apps Script
   - Check spam folders
   - Verify email addresses are correct
   - Grant necessary permissions when prompted

6. **Authorization Issues**
   - When first running functions, Google will ask for permissions
   - Grant access to Gmail and Google Sheets
   - You may need to go through advanced settings if warnings appear

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
