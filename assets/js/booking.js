/**
 * Google Sheets-Based Booking System
 * Handles calendar functionality, real-time availability, and form submission to Google Sheets
 */

class BookingSystem {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTime = null;
        this.availableSlots = {};
        this.isLoading = false;
        
        // Google Sheets configuration
        this.config = {
            // Replace with your Google Sheets ID
            spreadsheetId: 'YOUR_GOOGLE_SHEETS_ID',
            // Replace with your Google Apps Script Web App URL
            scriptUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL',
            // API Key for reading public sheets (optional)
            apiKey: 'YOUR_GOOGLE_API_KEY'
        };
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        await this.loadAvailableSlots();
        this.renderCalendar();
        this.bindEvents();
        this.updateFormState();
        this.showLoading(false);
    }

    showLoading(show) {
        this.isLoading = show;
        const loadingEl = document.getElementById('loadingIndicator');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    async loadAvailableSlots() {
        try {
            // Load availability from Google Sheets
            const response = await fetch(`${this.config.scriptUrl}?action=getAvailability`);
            const data = await response.json();
            
            if (data.success) {
                this.availableSlots = data.slots;
            } else {
                console.error('Failed to load availability:', data.error);
                // Fallback to demo data
                this.generateDemoSlots();
            }
        } catch (error) {
            console.error('Error loading availability:', error);
            // Fallback to demo data
            this.generateDemoSlots();
        }
    }

    generateDemoSlots() {
        // Generate demo slots for testing (remove when Google Sheets is connected)
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
                    classType: 'regular'
                };
            }
            
            // Saturday workshops
            if (dayOfWeek === 6 && Math.random() > 0.7) {
                slots[dateStr] = {
                    times: ['10:00 AM', '2:00 PM'],
                    maxCapacity: 8,
                    booked: Math.floor(Math.random() * 3),
                    classType: 'workshop'
                };
            }
        }
        
        this.availableSlots = slots;
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

    renderCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Update month header
        const currentMonthEl = document.getElementById('currentMonth');
        currentMonthEl.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        // Clear previous calendar days
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Generate calendar grid
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = cellDate.getDate();
            
            // Styling
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

            // Check date status
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
                    
                    // Add small indicator for available spots
                    const indicator = document.createElement('div');
                    indicator.style.cssText = `
                        position: absolute;
                        bottom: 2px;
                        right: 2px;
                        width: 6px;
                        height: 6px;
                        background: white;
                        border-radius: 50%;
                        font-size: 8px;
                    `;
                    dayEl.appendChild(indicator);
                } else {
                    dayEl.style.background = 'var(--color-text-secondary)';
                    dayEl.style.color = 'white';
                    dayEl.style.cursor = 'not-allowed';
                    dayEl.title = 'Fully booked';
                }
            } else {
                dayEl.style.background = 'var(--color-surface-secondary)';
            }

            if (isToday && isCurrentMonth) {
                dayEl.style.border = '2px solid var(--color-accent)';
            }

            // Add click handler
            if (isCurrentMonth && !isPast && hasSlots) {
                const availableSpots = hasSlots.maxCapacity - hasSlots.booked;
                if (availableSpots > 0) {
                    dayEl.addEventListener('click', () => this.selectDate(cellDate));
                }
            }

            // Hover effects
            if (isCurrentMonth && !isPast && hasSlots) {
                dayEl.addEventListener('mouseenter', () => {
                    if (!isSelected) {
                        dayEl.style.transform = 'scale(1.05)';
                    }
                });
                dayEl.addEventListener('mouseleave', () => {
                    if (!isSelected) {
                        dayEl.style.transform = 'scale(1)';
                    }
                });
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
            
            // Show available spots
            const availableSpots = slots.maxCapacity - slots.booked;
            timeBtn.innerHTML = `
                <div>${time}</div>
                <div style="font-size: 0.75rem; opacity: 0.8;">${availableSpots} spots left</div>
            `;
            
            // Styling
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

            timeBtn.addEventListener('mouseenter', () => {
                if (this.selectedTime !== time) {
                    timeBtn.style.borderColor = 'var(--color-accent)';
                    timeBtn.style.background = 'var(--color-surface-secondary)';
                }
            });

            timeBtn.addEventListener('mouseleave', () => {
                if (this.selectedTime !== time) {
                    timeBtn.style.borderColor = 'var(--color-border)';
                    timeBtn.style.background = 'var(--color-surface)';
                }
            });

            timeSlotsEl.appendChild(timeBtn);
        });
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
            submitBtn.textContent = 'Complete Booking';
        } else if (this.isLoading) {
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.textContent = 'Processing...';
        } else {
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.textContent = 'Complete Booking';
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

        // Refresh availability button
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

        this.showLoading(true);
        this.updateFormState();

        // Collect form data
        const formData = {
            date: this.formatDisplayDate(this.selectedDate),
            dateKey: this.formatDateKey(this.selectedDate),
            time: this.selectedTime,
            classType: document.getElementById('classType').value,
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            experience: document.getElementById('experience').value,
            notes: document.getElementById('notes').value,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        try {
            // Submit to Google Sheets
            const response = await fetch(this.config.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'submitBooking',
                    data: formData
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccessMessage(formData);
                this.resetForm();
                await this.refreshAvailability();
            } else {
                throw new Error(result.error || 'Booking submission failed');
            }
        } catch (error) {
            console.error('Booking submission error:', error);
            this.showErrorMessage(error.message);
        } finally {
            this.showLoading(false);
            this.updateFormState();
        }
    }

    showSuccessMessage(formData) {
        const message = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 2rem; border-radius: 1rem; max-width: 500px; margin: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="width: 60px; height: 60px; background: var(--color-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                            <span style="color: white; font-size: 1.5rem;">✓</span>
                        </div>
                        <h3 style="margin: 0; color: var(--color-text);">Booking Confirmed!</h3>
                    </div>
                    <div style="margin-bottom: 1.5rem; color: var(--color-text-secondary); line-height: 1.5;">
                        <p><strong>Date:</strong> ${formData.date}</p>
                        <p><strong>Time:</strong> ${formData.time}</p>
                        <p><strong>Class:</strong> ${formData.classType}</p>
                        <p style="margin-top: 1rem; font-size: 0.875rem;">
                            You'll receive a confirmation email shortly. Remember: Payment is due at the beginning of class.
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
                    <p style="margin-bottom: 1.5rem; color: var(--color-text-secondary); text-align: center;">
                        ${errorMsg}. Please try again or contact us directly.
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

// Initialize booking system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookingSystem();
});