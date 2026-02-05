'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [blackoutDates, setBlackoutDates] = useState([]);
    const [newDate, setNewDate] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleLogin = (e) => {
        e.preventDefault();
        // The password will be validated on the server for actions
        // but for UI visibility we'll just set it.
        // We'll use a fetch to verify if you want, but for now let's just proceed.
        setIsLoggedIn(true);
    };

    const fetchBlackoutDates = async () => {
        try {
            const res = await fetch('/api/schedule?type=blackout_list');
            if (res.ok) {
                const data = await res.json();
                setBlackoutDates(data.blackoutDates || []);
            }
        } catch (error) {
            console.error('Failed to fetch blackout dates');
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchBlackoutDates();
        }
    }, [isLoggedIn]);

    const toggleBlackout = async (date, isBlackout) => {
        setStatus({ type: '', message: '' });
        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle_blackout',
                    date,
                    isBlackout,
                    adminPassword: password
                }),
            });

            if (res.ok) {
                setStatus({ type: 'success', message: `Updated ${date}` });
                fetchBlackoutDates();
            } else {
                const data = await res.json();
                setStatus({ type: 'error', message: data.error || 'Unauthorized' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to update' });
        }
    };

    if (!isLoggedIn) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
                <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px' }}>
                    <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Login</h1>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="Enter Admin Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1>Manage Days Off</h1>
                <button onClick={() => setIsLoggedIn(false)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>Logout</button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h3>Add a Day Off</h3>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
                    />
                    <button
                        onClick={() => toggleBlackout(newDate, true)}
                        className="btn-primary"
                        disabled={!newDate}
                    >
                        Mark as Day Off
                    </button>
                </div>
                {status.message && (
                    <p style={{ marginTop: '10px', color: status.type === 'error' ? 'red' : 'green' }}>{status.message}</p>
                )}
            </div>

            <div>
                <h3>Blackout Dates</h3>
                {blackoutDates.length === 0 ? (
                    <p style={{ color: '#666' }}>No days off scheduled yet.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {blackoutDates.sort().map(date => (
                            <li key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee' }}>
                                <span>{date}</span>
                                <button
                                    onClick={() => toggleBlackout(date, false)}
                                    style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
