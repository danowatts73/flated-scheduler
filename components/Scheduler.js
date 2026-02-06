"use client";

import { useState, useEffect } from 'react';

export default function Scheduler() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [bookedSlots, setBookedSlots] = useState([]);

    // All available time slots (MST)
    const allTimeSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30"
    ];

    // Fetch availability when date changes
    useEffect(() => {
        if (formData.date) {
            const fetchAvailability = async () => {
                try {
                    const res = await fetch(`/api/schedule?date=${formData.date}`);
                    if (res.ok) {
                        const data = await res.json();
                        setBookedSlots(data.bookedTimes || []);
                    }
                } catch (error) {
                    console.error('Failed to fetch availability:', error);
                }
            };
            fetchAvailability();
        } else {
            setBookedSlots([]);
        }
    }, [formData.date]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    };

    const isHoliday = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed
        const day = date.getDate();

        // Simple fixed-date holidays
        const holidays = [
            { m: 0, d: 1 },  // New Year's Day
            { m: 6, d: 4 },  // Independence Day
            { m: 11, d: 25 } // Christmas Day
        ];

        // Check fixed holidays
        if (holidays.some(h => h.m === month && h.d === day)) return true;

        // Dynamic holidays (Memorial Day, Labor Day, Thanksgiving) could be added here
        // For this iteration, we'll stick to fixed dates + general weekend rule
        return false;
    };

    const validateTime = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return false;

        const dateObj = new Date(dateStr + 'T00:00:00'); // Local date

        if (isWeekend(dateObj)) return false;
        if (isHoliday(dateObj)) return false;

        const [hours, minutes] = timeStr.split(':').map(Number);
        if (hours < 9 || hours >= 17) return false; // 9 AM - 5 PM

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        const dateObj = new Date(formData.date + 'T00:00:00');

        if (isWeekend(dateObj)) {
            setStatus({ type: 'error', message: 'We are closed on weekends. Please select a weekday.' });
            return;
        }

        if (isHoliday(dateObj)) {
            setStatus({ type: 'error', message: 'We are closed on holidays. Please select another date.' });
            return;
        }

        if (bookedSlots.length >= allTimeSlots.length) {
            setStatus({ type: 'error', message: 'This date is currently unavailable for scheduling. Please select another day.' });
            return;
        }

        if (!validateTime(formData.date, formData.time)) {
            setStatus({ type: 'error', message: 'Please select a time between 9:00 AM and 5:00 PM MST.' });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: 'Call scheduled successfully! We will contact you shortly.' });
                setFormData({ name: '', email: '', phone: '', date: '', time: '' });
            } else {
                setStatus({ type: 'error', message: data.error || 'Something went wrong.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to send request.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="section">
            <div className="container" style={{ maxWidth: '600px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Schedule a Call</h2>
                <div style={{ padding: '30px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="date" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Date</label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="time" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Time (MST)</label>
                                <select
                                    id="time"
                                    name="time"
                                    required
                                    value={formData.time}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">Select a time</option>
                                    {allTimeSlots.map(timeSlot => {
                                        const isBooked = bookedSlots.includes(timeSlot);
                                        const [h, m] = timeSlot.split(':').map(Number);
                                        const period = h >= 12 ? 'PM' : 'AM';
                                        const displayH = h % 12 || 12;
                                        const label = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;

                                        if (isBooked) return null;

                                        return (
                                            <option key={timeSlot} value={timeSlot}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {status.message && (
                            <div style={{
                                padding: '10px',
                                borderRadius: '4px',
                                backgroundColor: status.type === 'error' ? '#ffebee' : '#e8f5e9',
                                color: status.type === 'error' ? '#c62828' : '#2e7d32',
                                textAlign: 'center'
                            }}>
                                {status.message}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'Scheduling...' : 'Schedule Now'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
