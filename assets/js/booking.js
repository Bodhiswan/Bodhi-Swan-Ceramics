class BookingRequestCalendar {
    constructor() {
        const apiBase = window.BODHI_BOOKING_CONFIG?.apiBase || 'https://bodhiswanceramics.netlify.app/.netlify/functions';

        this.config = {
            apiBase,
            bookingApiUrl: window.BODHI_BOOKING_CONFIG?.bookingApiUrl || `${apiBase}/booking-api`,
            checkoutApiUrl: window.BODHI_BOOKING_CONFIG?.checkoutApiUrl || `${apiBase}/create-booking-checkout`,
            recipientEmail: 'swan1995@gmail.com',
            maxMonthsAhead: 3,
            ...window.BODHI_BOOKING_CONFIG
        };

        this.currentDate = new Date();
        this.currentDate.setDate(1);
        this.selectedDate = null;
        this.selectedTime = null;
        this.availableSlots = {};

        this.elements = {
            month: document.getElementById('currentMonth'),
            calendarDays: document.getElementById('calendarDays'),
            selectedDate: document.getElementById('selectedDate'),
            timeSlots: document.getElementById('timeSlots'),
            form: document.getElementById('bookingForm'),
            submitBtn: document.getElementById('submitBtn'),
            status: document.getElementById('requestStatus'),
            classType: document.getElementById('classType')
        };

        this.generateDefaultAvailability();
        this.bindEvents();
        this.renderCalendar();
        this.updateSelectedDate();
        this.renderTimeSlots();
        this.applyStatusFromUrl();
        this.updateSubmitState();
        this.loadAvailability();
    }

    bindEvents() {
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        ['classType', 'fullName', 'email', 'phone', 'experience', 'notes', 'terms'].forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (!field) {
                return;
            }

            const eventName = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input';
            field.addEventListener(eventName, () => {
                this.updateSubmitState();
                if (fieldId === 'classType') {
                    this.updateSelectedDate();
                    this.updateSubmitButtonLabel();
                }
            });

            if (eventName !== 'input') {
                field.addEventListener('input', () => this.updateSubmitState());
            }
        });

        this.elements.form?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.handleSubmit();
        });
    }

    async loadAvailability() {
        try {
            const response = await fetch(`${this.config.bookingApiUrl}?t=${Date.now()}`, {
                cache: 'no-store'
            });
            const result = await response.json();

            if (!response.ok || result.success === false || !result?.data?.slots) {
                return;
            }

            const liveSlots = {};
            Object.entries(result.data.slots).forEach(([dateKey, slotInfo]) => {
                const availableCount = Number(slotInfo.available ?? 0);
                if (availableCount <= 0) {
                    return;
                }

                liveSlots[dateKey] = {
                    times: Array.isArray(slotInfo.times) ? slotInfo.times : [],
                    label: availableCount === 1 ? '1 place left' : `${availableCount} places left`,
                    available: availableCount
                };
            });

            if (Object.keys(liveSlots).length) {
                this.availableSlots = liveSlots;
                this.renderCalendar();
                this.updateSelectedDate();
                this.renderTimeSlots();
                this.updateSubmitState();
            }
        } catch {
            // Keep the default calendar if the live endpoint is unavailable.
        }
    }

    generateDefaultAvailability() {
        const today = new Date();
        const end = new Date(today.getFullYear(), today.getMonth() + this.config.maxMonthsAhead, today.getDate());

        for (let date = new Date(today); date <= end; date.setDate(date.getDate() + 1)) {
            const workingDate = new Date(date);
            const day = workingDate.getDay();
            const key = this.formatDateKey(workingDate);

            if (day === 1) {
                this.availableSlots[key] = {
                    times: ['6:00 PM'],
                    label: 'Monday evening class',
                    available: 6
                };
            }

            if (day === 6) {
                this.availableSlots[key] = {
                    times: ['10:00 AM', '2:00 PM'],
                    label: 'Saturday session',
                    available: 8
                };
            }
        }
    }

    renderCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        this.elements.month.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        this.elements.calendarDays.innerHTML = '';

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const gridStart = new Date(firstDay);
        gridStart.setDate(firstDay.getDate() - firstDay.getDay());
        const todayKey = this.formatDateKey(new Date());

        for (let i = 0; i < 42; i += 1) {
            const cellDate = new Date(gridStart);
            cellDate.setDate(gridStart.getDate() + i);

            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'calendar-day';
            cell.textContent = cellDate.getDate();

            const isCurrentMonth = cellDate.getMonth() === this.currentDate.getMonth();
            const dateKey = this.formatDateKey(cellDate);
            const isPast = this.isPastDate(cellDate);
            const slotInfo = this.availableSlots[dateKey];
            const isAvailable = Boolean(slotInfo) && !isPast;
            const isSelected = this.selectedDate && this.formatDateKey(this.selectedDate) === dateKey;

            if (!isCurrentMonth) {
                cell.classList.add('is-muted');
            }

            if (dateKey === todayKey && isCurrentMonth) {
                cell.classList.add('is-today');
            }

            if (isAvailable) {
                cell.classList.add('is-available');
                cell.setAttribute('aria-label', `${this.formatDisplayDate(cellDate)} available`);
                cell.addEventListener('click', () => this.selectDate(cellDate));
            } else {
                cell.disabled = true;
                cell.setAttribute('aria-disabled', 'true');
            }

            if (isSelected) {
                cell.classList.add('is-selected');
            }

            this.elements.calendarDays.appendChild(cell);
        }
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.selectedTime = null;
        this.renderCalendar();
        this.updateSelectedDate();
        this.renderTimeSlots();
        this.updateSubmitState();
        this.clearStatus();
    }

    updateSelectedDate() {
        if (!this.selectedDate) {
            this.elements.selectedDate.textContent = 'Choose a highlighted date to start your request.';
            return;
        }

        const dateKey = this.formatDateKey(this.selectedDate);
        const slotInfo = this.availableSlots[dateKey];
        const classType = this.elements.classType?.value || '';
        const paymentLabel = this.isPaidClassType(classType)
            ? ', payment happens in Stripe after you continue'
            : classType === 'private-request'
                ? ', this stays as a request until Bodhi replies'
                : '';

        this.elements.selectedDate.textContent = `${this.formatDisplayDate(this.selectedDate)}${slotInfo ? `, ${slotInfo.label}` : ''}${paymentLabel}`;
    }

    renderTimeSlots() {
        this.elements.timeSlots.innerHTML = '';

        if (!this.selectedDate) {
            this.elements.timeSlots.innerHTML = '<div>Choose a date to see available session times.</div>';
            return;
        }

        const slotInfo = this.availableSlots[this.formatDateKey(this.selectedDate)];
        if (!slotInfo || !slotInfo.times.length) {
            this.elements.timeSlots.innerHTML = '<div>No times are listed for this date yet.</div>';
            return;
        }

        slotInfo.times.forEach((time) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'time-slot';
            button.textContent = time;

            if (this.selectedTime === time) {
                button.classList.add('is-selected');
            }

            button.addEventListener('click', () => {
                this.selectedTime = time;
                this.renderTimeSlots();
                this.updateSubmitState();
                this.clearStatus();
            });

            this.elements.timeSlots.appendChild(button);
        });
    }

    async handleSubmit() {
        if (!this.isFormReady()) {
            this.showStatus('Please choose a date, choose a time, and complete the form before continuing.', 'error');
            return;
        }

        const payload = this.collectPayload();
        this.setSubmitting(true);

        try {
            if (this.isPaidClassType(payload.classType)) {
                const response = await fetch(this.config.checkoutApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (!response.ok || !result.success || !result.checkoutUrl) {
                    throw new Error(result.message || 'Could not start payment.');
                }

                window.location.href = result.checkoutUrl;
                return;
            }

            if (this.config.bookingApiUrl) {
                const response = await fetch(this.config.bookingApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'submitBookingRequest',
                        data: payload
                    })
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Could not send booking request.');
                }

                this.showStatus('Private lesson request sent. Bodhi will reply to confirm the details.', 'success');
                this.resetForm();
                return;
            }

            this.openMailtoFallback(payload);
            this.showStatus('Your email app should open with the booking request pre-filled. If it does not, email swan1995@gmail.com directly.', 'success');
            this.resetForm();
        } catch (error) {
            this.showStatus(error.message || 'Something went wrong while sending your request.', 'error');
        } finally {
            this.setSubmitting(false);
        }
    }

    collectPayload() {
        return {
            date: this.formatDisplayDate(this.selectedDate),
            dateKey: this.formatDateKey(this.selectedDate),
            time: this.selectedTime,
            classType: document.getElementById('classType').value,
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            experience: document.getElementById('experience').value,
            notes: document.getElementById('notes').value.trim(),
            timestamp: new Date().toISOString()
        };
    }

    openMailtoFallback(payload) {
        const subject = `Booking request: ${payload.fullName} - ${payload.date}`;
        const body = [
            'New pottery booking request',
            '',
            `Date: ${payload.date}`,
            `Time: ${payload.time}`,
            `Class Type: ${payload.classType}`,
            '',
            `Name: ${payload.fullName}`,
            `Email: ${payload.email}`,
            `Phone: ${payload.phone}`,
            `Experience: ${payload.experience}`,
            '',
            'Notes:',
            payload.notes || 'None'
        ].join('\n');

        window.location.href = `mailto:${encodeURIComponent(this.config.recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    updateSubmitState() {
        if (!this.elements.submitBtn) {
            return;
        }

        this.updateSubmitButtonLabel();
        this.elements.submitBtn.disabled = !this.isFormReady() || this.elements.submitBtn.dataset.loading === 'true';
    }

    updateSubmitButtonLabel() {
        if (!this.elements.submitBtn) {
            return;
        }

        if (this.elements.submitBtn.dataset.loading === 'true') {
            return;
        }

        const classType = this.elements.classType?.value || '';
        this.elements.submitBtn.textContent = this.isPaidClassType(classType)
            ? 'Continue to Payment'
            : classType === 'private-request'
                ? 'Send Private Lesson Request'
                : 'Choose Class Type';
    }

    isFormReady() {
        const requiredIds = ['classType', 'fullName', 'email', 'phone', 'experience', 'terms'];
        const fieldsValid = requiredIds.every((fieldId) => {
            const field = document.getElementById(fieldId);
            if (!field) {
                return false;
            }

            if (field.type === 'checkbox') {
                return field.checked;
            }

            return field.value.trim() !== '';
        });

        return Boolean(this.selectedDate && this.selectedTime && fieldsValid);
    }

    isPaidClassType(classType) {
        return classType === 'first-class' || classType === 'returning-class';
    }

    setSubmitting(isSubmitting) {
        this.elements.submitBtn.dataset.loading = isSubmitting ? 'true' : 'false';
        this.elements.submitBtn.textContent = isSubmitting
            ? (this.isPaidClassType(this.elements.classType?.value || '') ? 'Opening Payment...' : 'Sending Request...')
            : this.elements.submitBtn.textContent;
        this.updateSubmitState();
    }

    resetForm() {
        this.elements.form.reset();
        this.selectedDate = null;
        this.selectedTime = null;
        this.updateSelectedDate();
        this.renderCalendar();
        this.renderTimeSlots();
        this.updateSubmitState();
    }

    applyStatusFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const bookingStatus = params.get('booking');

        if (bookingStatus === 'paid') {
            this.showStatus('Payment received. Your class booking is being finalised and a confirmation email should follow shortly.', 'success');
        }

        if (bookingStatus === 'cancelled') {
            this.showStatus('Payment was cancelled, so your booking was not completed. You can choose another date or try again.', 'error');
        }
    }

    showStatus(message, type) {
        this.elements.status.textContent = message;
        this.elements.status.className = `request-status is-${type}`;
    }

    clearStatus() {
        this.elements.status.textContent = '';
        this.elements.status.className = 'request-status';
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

    isPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BookingRequestCalendar();
});
