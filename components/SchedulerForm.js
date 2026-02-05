'use client';

import { useState } from 'react';

export default function SchedulerForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        reason: ''
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const timeSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Thank You!</h2>
                <p>Your call has been scheduled. We have sent a confirmation email to the team.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="btn-primary"
                    style={{ marginTop: '30px' }}
                >
                    Schedule Another
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Name</label>
                <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email</label>
                    <input
                        type="email"
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phone</label>
                    <input
                        type="tel"
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Preferred Date</label>
                    <input
                        type="date"
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Time (MST)</label>
                    <select
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    >
                        <option value="">Select a time</option>
                        {timeSlots.map(t => (
                            <option key={t} value={t}>{t} MST</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Reason for Call</label>
                <textarea
                    rows="4"
                    style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
            </div>

            <button type="submit" className="btn-primary" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Scheduling...' : 'Confirm Schedule'}
            </button>

            {status === 'error' && (
                <p style={{ color: 'red', marginTop: '10px' }}>Something went wrong. Please try again.</p>
            )}
        </form>
    );
}
