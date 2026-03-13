class BookingRequestCalendar {
    constructor() {
        this.config = {
            endpoint: '',
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
            status: document.getElementById('requestStatus')
        };

        this.generateDefaultAvailability();
        this.bindEvents();
        this.renderCalendar();
        this.updateSelectedDate();
        this.renderTimeSlots();
        this.updateSubmitState();
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
            field.addEventListener(eventName, () => this.updateSubmitState());
            if (eventName !== 'input') {
                field.addEventListener('input', () => this.updateSubmitState());
            }
        });

        this.elements.form?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.handleSubmit();
        });
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
                    label: 'Monday evening class'
                };
            }

            if (day === 6) {
                this.availableSlots[key] = {
                    times: ['10:00 AM', '2:00 PM'],
                    label: 'Saturday session'
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
            const isAvailable = Boolean(this.availableSlots[dateKey]) && !isPast;
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
        this.elements.selectedDate.textContent = `${this.formatDisplayDate(this.selectedDate)}${slotInfo ? `, ${slotInfo.label}` : ''}`;
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
            this.showStatus('Please choose a date, choose a time, and complete the form before sending your request.', 'error');
            return;
        }

        const payload = this.collectPayload();
        this.setSubmitting(true);

        try {
            if (this.config.endpoint) {
                const response = await fetch(this.config.endpoint, {
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
                if (!result.success) {
                    throw new Error(result.message || 'Could not send booking request.');
                }

                this.showStatus('Booking request sent. Bodhi will reply to confirm your session.', 'success');
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

        this.elements.submitBtn.disabled = !this.isFormReady() || this.elements.submitBtn.dataset.loading === 'true';
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

    setSubmitting(isSubmitting) {
        this.elements.submitBtn.dataset.loading = isSubmitting ? 'true' : 'false';
        this.elements.submitBtn.textContent = isSubmitting ? 'Sending Request...' : 'Send Booking Request';
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
