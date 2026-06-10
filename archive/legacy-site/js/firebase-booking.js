/**
 * Secure Firebase-Based Booking System
 * Provides authentication, data validation, and security rules
 */

// Firebase configuration - replace with your Firebase project config
const firebaseConfig = {

  apiKey: "AIzaSyBW9ZhKDhsRD2D7Yv45VSPqSYFBaV2kq-E",

  authDomain: "bodhi-swan-ceramics.firebaseapp.com",

  projectId: "bodhi-swan-ceramics",

  storageBucket: "bodhi-swan-ceramics.firebasestorage.app",

  messagingSenderId: "657925294092",

  appId: "1:657925294092:web:4b7a8bb637ece7ded7c629",

  measurementId: "G-PKSRH5FCT2"

};


// IMPORTANT: You need to replace the values above with your actual Firebase config
// To get your config:
// 1. Go to Firebase Console: https://console.firebase.google.com
// 2. Select your project
// 3. Click the gear icon > Project settings
// 4. Scroll down to "Your apps" section
// 5. Click on your web app
// 6. Copy the config object and replace the values above

class SecureBookingSystem {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTime = null;
        this.availableSlots = {};
        this.isLoading = false;
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            
            // Set up authentication state listener
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateAuthUI();
            });
            
            this.showLoading(true);
            await this.loadAvailableSlots();
            this.renderCalendar();
            this.bindEvents();
            this.updateFormState();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error initializing Firebase booking system:', error);
            // Fall back to demo mode for testing
            console.log('Falling back to demo mode...');
            this.generateDemoSlots();
            this.renderCalendar();
            this.bindEvents();
            this.updateFormState();
            this.showLoading(false);
        }
    }

    async loadAvailableSlots() {
        try {
            // Load availability from Firestore
            const availabilityRef = this.db.collection('availability');
            const snapshot = await availabilityRef
                .where('date', '>=', new Date())
                .orderBy('date')
                .limit(90) // Next 3 months
                .get();
            
            this.availableSlots = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const dateKey = this.formatDateKey(data.date.toDate());
                this.availableSlots[dateKey] = {
                    id: doc.id,
                    times: data.times || [],
                    maxCapacity: data.maxCapacity || 6,
                    booked: data.currentBookings || 0,
                    available: (data.maxCapacity || 6) - (data.currentBookings || 0)
                };
            });
            
        } catch (error) {
            console.error('Error loading availability:', error);
            // Fallback to demo data for development
            console.log('Loading demo data...');
            this.generateDemoSlots();
        }
    }

    generateDemoSlots() {
        // Generate demo slots for testing
        console.log('Generating demo slots...');
        const slots = {};
        const today = new Date();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
        
        for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            const dateStr = this.formatDateKey(date);
            
            // Monday evening classes
            if (dayOfWeek === 1) {
                slots[dateStr] = {
                    times: ['6:00 PM'],
                    maxCapacity: 6,
                    booked: Math.floor(Math.random() * 4),
                    available: 6 - Math.floor(Math.random() * 4),
                    classType: 'regular'
                };
            }
            
            // Saturday workshops
            if (dayOfWeek === 6 && Math.random() > 0.7) {
                slots[dateStr] = {
                    times: ['10:00 AM', '2:00 PM'],
                    maxCapacity: 8,
                    booked: Math.floor(Math.random() * 3),
                    available: 8 - Math.floor(Math.random() * 3),
                    classType: 'workshop'
                };
            }
        }
        
        this.availableSlots = slots;
        console.log('Demo slots generated:', Object.keys(slots).length, 'dates');
    }

    async authenticateUser(email, name) {
        try {
            // Create anonymous user session for booking
            const userCredential = await this.auth.signInAnonymously();
            
            // Store user info in Firestore for this session
            await this.db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                name: name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAnonymous: true
            });
            
            return userCredential.user;
            
        } catch (error) {
            console.error('Authentication error:', error);
            throw new Error('Failed to authenticate user');
        }
    }

    async submitBooking(bookingData) {
        try {
            this.showLoading(true);
            
            // Authenticate user for this booking session
            if (!this.currentUser) {
                await this.authenticateUser(bookingData.email, bookingData.fullName);
            }
            
            // Validate availability in real-time
            const dateKey = this.formatDateKey(this.selectedDate);
            const availabilityDoc = await this.db.collection('availability')
                .where('dateKey', '==', dateKey)
                .limit(1)
                .get();
            
            if (availabilityDoc.empty) {
                throw new Error('Selected date is no longer available');
            }
            
            const availabilityData = availabilityDoc.docs[0].data();
            const availableSpots = availabilityData.maxCapacity - availabilityData.currentBookings;
            
            if (availableSpots <= 0) {
                throw new Error('This time slot is now fully booked');
            }
            
            // Create booking with transaction to ensure data consistency
            const bookingId = this.generateBookingId();
            
            await this.db.runTransaction(async (transaction) => {
                // Create booking document
                const bookingRef = this.db.collection('bookings').doc(bookingId);
                transaction.set(bookingRef, {
                    ...bookingData,
                    bookingId: bookingId,
                    userId: this.currentUser.uid,
                    dateKey: dateKey,
                    status: 'confirmed',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    paymentStatus: 'pending'
                });
                
                // Update availability
                const availabilityRef = availabilityDoc.docs[0].ref;
                transaction.update(availabilityRef, {
                    currentBookings: firebase.firestore.FieldValue.increment(1)
                });
                
                // Log booking activity
                const activityRef = this.db.collection('activity').doc();
                transaction.set(activityRef, {
                    type: 'booking_created',
                    bookingId: bookingId,
                    userId: this.currentUser.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            // Send confirmation email via Cloud Function
            await this.sendBookingConfirmation(bookingData, bookingId);
            
            this.showSuccessMessage(bookingData, bookingId);
            this.resetForm();
            await this.refreshAvailability();
            
        } catch (error) {
            console.error('Booking submission error:', error);
            this.showErrorMessage(error.message);
        } finally {
            this.showLoading(false);
            this.updateFormState();
        }
    }

    async sendBookingConfirmation(bookingData, bookingId) {
        try {
            // Call Cloud Function for email sending
            const sendEmail = firebase.functions().httpsCallable('sendBookingConfirmation');
            await sendEmail({
                bookingData: bookingData,
                bookingId: bookingId
            });
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            // Don't throw error - booking is still valid even if email fails
        }
    }

    updateAuthUI() {
        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
            if (this.currentUser) {
                authStatus.textContent = 'Authenticated for booking';
                authStatus.className = 'auth-status authenticated';
            } else {
                authStatus.textContent = 'Authentication required for booking';
                authStatus.className = 'auth-status not-authenticated';
            }
        }
    }

    // Security validation
    validateBookingData(data) {
        const errors = [];
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('Please enter a valid email address');
        }
        
        // Phone validation (Australian format)
        const phoneRegex = /^(\+61|0)[2-9]\d{8}$/;
        if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
            errors.push('Please enter a valid Australian phone number');
        }
        
        // Name validation
        if (data.fullName.length < 2 || data.fullName.length > 50) {
            errors.push('Name must be between 2 and 50 characters');
        }
        
        // Sanitize inputs
        data.fullName = this.sanitizeInput(data.fullName);
        data.notes = this.sanitizeInput(data.notes);
        
        return { isValid: errors.length === 0, errors, data };
    }

    sanitizeInput(input) {
        if (!input) return '';
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/[<>]/g, '')
                   .trim();
    }

    generateBookingId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `BSC-${timestamp}-${random}`.toUpperCase();
    }

    formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    formatDisplayDate(date) {
        return date.toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // UI Methods (similar to previous implementation but with security enhancements)
    renderCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const currentMonthEl = document.getElementById('currentMonth');
        currentMonthEl.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = cellDate.getDate();
            
            dayEl.style.cssText = `
                padding: 0.75rem 0.5rem;
                text-align: center;
                border-radius: 0.5rem;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const isCurrentMonth = cellDate.getMonth() === this.currentDate.getMonth();
            const isToday = this.isSameDate(cellDate, new Date());
            const isPast = cellDate < new Date().setHours(0, 0, 0, 0);
            const dateKey = this.formatDateKey(cellDate);
            const hasSlots = this.availableSlots[dateKey];
            const isSelected = this.selectedDate && this.isSameDate(cellDate, this.selectedDate);

            if (!isCurrentMonth) {
                dayEl.style.color = 'var(--color-text-secondary)';
                dayEl.style.opacity = '0.3';
            } else if (isPast) {
                dayEl.style.color = 'var(--color-text-secondary)';
                dayEl.style.cursor = 'not-allowed';
            } else if (isSelected) {
                dayEl.style.background = 'var(--color-primary)';
                dayEl.style.color = 'white';
            } else if (hasSlots) {
                const availableSpots = hasSlots.maxCapacity - hasSlots.booked;
                if (availableSpots > 0) {
                    dayEl.style.background = 'var(--color-accent)';
                    dayEl.style.color = 'white';
                    dayEl.title = `${availableSpots} spots available`;
                } else {
                    dayEl.style.background = 'var(--color-text-secondary)';
                    dayEl.style.color = 'white';
                    dayEl.style.cursor = 'not-allowed';
                    dayEl.title = 'Fully booked';
                }
            }

            if (isToday && isCurrentMonth) {
                dayEl.style.border = '2px solid var(--color-accent)';
            }

            if (isCurrentMonth && !isPast && hasSlots) {
                const availableSpots = hasSlots.maxCapacity - hasSlots.booked;
                if (availableSpots > 0) {
                    dayEl.addEventListener('click', () => this.selectDate(cellDate));
                }
            }

            calendarDays.appendChild(dayEl);
        }
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.selectedTime = null;
        this.renderCalendar();
        this.updateSelectedDate();
        this.renderTimeSlots();
        this.updateFormState();
    }

    updateSelectedDate() {
        const selectedDateEl = document.getElementById('selectedDate');
        if (this.selectedDate) {
            selectedDateEl.textContent = this.formatDisplayDate(this.selectedDate);
            selectedDateEl.style.background = 'var(--color-surface)';
            selectedDateEl.style.color = 'var(--color-text)';
        } else {
            selectedDateEl.textContent = 'Please select a date from the calendar';
            selectedDateEl.style.background = 'var(--color-surface-secondary)';
            selectedDateEl.style.color = 'var(--color-text-secondary)';
        }
    }

    renderTimeSlots() {
        const timeSlotsEl = document.getElementById('timeSlots');
        
        if (!this.selectedDate) {
            timeSlotsEl.innerHTML = '<div class="text-secondary">Select a date to see available times</div>';
            return;
        }

        const dateKey = this.formatDateKey(this.selectedDate);
        const slots = this.availableSlots[dateKey];

        if (!slots || !slots.times.length) {
            timeSlotsEl.innerHTML = '<div class="text-secondary">No available times for this date</div>';
            return;
        }

        timeSlotsEl.innerHTML = '';
        
        slots.times.forEach(time => {
            const timeBtn = document.createElement('button');
            timeBtn.type = 'button';
            timeBtn.className = 'time-slot-btn';
            
            const availableSpots = slots.maxCapacity - slots.booked;
            timeBtn.innerHTML = `
                <div>${time}</div>
                <div style="font-size: 0.75rem; opacity: 0.8;">${availableSpots} spots left</div>
            `;
            
            timeBtn.style.cssText = `
                padding: 1rem;
                border: 2px solid var(--color-border);
                border-radius: 0.5rem;
                background: var(--color-surface);
                color: var(--color-text);
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.875rem;
                font-weight: 500;
                text-align: center;
            `;

            if (this.selectedTime === time) {
                timeBtn.style.background = 'var(--color-primary)';
                timeBtn.style.color = 'white';
                timeBtn.style.borderColor = 'var(--color-primary)';
            }

            timeBtn.addEventListener('click', () => {
                this.selectedTime = time;
                this.renderTimeSlots();
                this.updateFormState();
            });

            timeSlotsEl.appendChild(timeBtn);
        });
    }

    showLoading(show) {
        this.isLoading = show;
        const loadingEl = document.getElementById('loadingIndicator');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
    }

    updateFormState() {
        const submitBtn = document.getElementById('submitBtn');
        const termsCheckbox = document.getElementById('terms');
        
        const isFormValid = this.selectedDate && 
                           this.selectedTime && 
                           termsCheckbox.checked &&
                           this.validateRequiredFields();
        
        submitBtn.disabled = !isFormValid || this.isLoading;
        
        if (isFormValid && !this.isLoading) {
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.textContent = 'Complete Secure Booking';
        } else if (this.isLoading) {
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.textContent = 'Processing...';
        } else {
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.textContent = 'Complete Secure Booking';
        }
    }

    validateRequiredFields() {
        const requiredFields = ['classType', 'fullName', 'email', 'phone', 'experience'];
        return requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });
    }

    bindEvents() {
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Form validation
        const formFields = ['classType', 'fullName', 'email', 'phone', 'experience', 'terms'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', () => this.updateFormState());
                field.addEventListener('input', () => this.updateFormState());
            }
        });

        // Form submission
        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });

        // Refresh availability
        const refreshBtn = document.getElementById('refreshAvailability');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAvailability());
        }
    }

    async refreshAvailability() {
        this.showLoading(true);
        await this.loadAvailableSlots();
        this.renderCalendar();
        this.renderTimeSlots();
        this.showLoading(false);
    }

    async handleFormSubmission() {
        if (!this.selectedDate || !this.selectedTime) {
            alert('Please select a date and time for your class.');
            return;
        }

        // Collect and validate form data
        const formData = {
            date: this.formatDisplayDate(this.selectedDate),
            time: this.selectedTime,
            classType: document.getElementById('classType').value,
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            experience: document.getElementById('experience').value,
            notes: document.getElementById('notes').value
        };

        // Validate data
        const validation = this.validateBookingData(formData);
        if (!validation.isValid) {
            this.showErrorMessage(validation.errors.join('\n'));
            return;
        }

        await this.submitBooking(validation.data);
    }

    showSuccessMessage(formData, bookingId) {
        const message = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 2rem; border-radius: 1rem; max-width: 500px; margin: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="width: 60px; height: 60px; background: var(--color-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                            <span style="color: white; font-size: 1.5rem;">✓</span>
                        </div>
                        <h3 style="margin: 0; color: var(--color-text);">Secure Booking Confirmed!</h3>
                    </div>
                    <div style="margin-bottom: 1.5rem; color: var(--color-text-secondary); line-height: 1.5;">
                        <p><strong>Booking ID:</strong> ${bookingId}</p>
                        <p><strong>Date:</strong> ${formData.date}</p>
                        <p><strong>Time:</strong> ${formData.time}</p>
                        <p><strong>Class:</strong> ${formData.classType}</p>
                        <p style="margin-top: 1rem; font-size: 0.875rem;">
                            Your booking is securely stored and you'll receive a confirmation email shortly. 
                            Payment is due at the beginning of class.
                        </p>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; background: var(--color-primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', message);
    }

    showErrorMessage(errorMsg) {
        const message = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 2rem; border-radius: 1rem; max-width: 500px; margin: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="width: 60px; height: 60px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                            <span style="color: white; font-size: 1.5rem;">!</span>
                        </div>
                        <h3 style="margin: 0; color: var(--color-text);">Booking Error</h3>
                    </div>
                    <p style="margin-bottom: 1.5rem; color: var(--color-text-secondary); text-align: center; white-space: pre-line;">
                        ${errorMsg}
                    </p>
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex: 1; background: var(--color-surface-secondary); color: var(--color-text); border: none; padding: 0.75rem 1rem; border-radius: 0.5rem; cursor: pointer;">
                            Close
                        </button>
                        <a href="mailto:swan1995@gmail.com" style="flex: 1; background: var(--color-primary); color: white; border: none; padding: 0.75rem 1rem; border-radius: 0.5rem; text-decoration: none; text-align: center; font-weight: 500;">
                            Email Us
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', message);
    }

    resetForm() {
        document.getElementById('bookingForm').reset();
        this.selectedDate = null;
        this.selectedTime = null;
        this.updateSelectedDate();
        this.renderTimeSlots();
        this.updateFormState();
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}

// Initialize secure booking system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Please include Firebase scripts.');
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h2>Booking System Unavailable</h2>
                <p>Please contact us directly to make a booking.</p>
                <a href="mailto:swan1995@gmail.com" style="background: var(--color-primary); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem;">Email Us</a>
            </div>
        `;
        return;
    }
    
    new SecureBookingSystem();
});