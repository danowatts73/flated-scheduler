import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import * as ics from 'ics';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'data', 'bookings.json');

// Helper to read bookings
const getBookings = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    try {
        return JSON.parse(fileData);
    } catch (e) {
        return [];
    }
};

// Helper to save bookings
const saveBooking = async (newBooking) => {
    // 1. File storage (Local fallback)
    try {
        const bookings = getBookings();
        bookings.push(newBooking);
        fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
    } catch (fsError) {
        console.error('File storage failed (likely on Vercel):', fsError.message);
    }

    // 2. Vercel KV (Persistent storage)
    try {
        const dateKey = `bookings:${newBooking.date}`;
        // Store as a list of bookings for that day
        await kv.lpush(dateKey, JSON.stringify(newBooking));
        console.log(`Saved booking to KV for date: ${newBooking.date}`);
    } catch (kvError) {
        console.error('Vercel KV storage failed:', kvError.message);
    }
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const dateKey = `bookings:${date}`;
        const bookings = await kv.lrange(dateKey, 0, -1);

        // Return only the times that are booked
        const bookedTimes = bookings.map(b => {
            try {
                return JSON.parse(b).time;
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        return NextResponse.json({ bookedTimes });
    } catch (error) {
        console.error('Availability check error:', error);
        return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, phone, date, time } = body;

        // Backend Validation
        // 0. Ensure all fields are present to prevent crashes (Internal Errors)
        if (!name || !email || !phone || !date || !time) {
            return NextResponse.json({ error: 'Missing required fields. Please ensure name, email, phone, date, and time are provided.' }, { status: 400 });
        }

        // 1. Time: 9 AM - 5 PM MST
        // This validates the time is within business hours in Mountain Time
        const [hours, minutes] = time.split(':').map(Number);

        if (hours < 9 || hours >= 17) {
            return NextResponse.json({ error: 'Please select a time between 9:00 AM and 5:00 PM Mountain Time.' }, { status: 400 });
        }

        // 1.1 Reject Lunch Hour (12:00 - 1:00 PM)
        if (time === "12:00" || time === "12:30") {
            return NextResponse.json({ error: 'The 12:00 PM - 1:00 PM lunch hour is not available for scheduling.' }, { status: 400 });
        }

        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getUTCDay(); // UTC day matches date string YYYY-MM-DD

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return NextResponse.json({ error: 'Scheduling is only available Monday through Friday.' }, { status: 400 });
        }

        // Simple Holiday Check
        const month = dateObj.getUTCMonth();
        const day = dateObj.getUTCDate();
        const isHoliday = (month === 0 && day === 1) || // New Year
            (month === 6 && day === 4) || // July 4th
            (month === 11 && day === 25); // Christmas

        if (isHoliday) {
            return NextResponse.json({ error: 'Scheduling is not available on holidays.' }, { status: 400 });
        }

        // Check for conflicts
        const bookings = getBookings();
        const conflict = bookings.find(b => b.date === date && b.time === time);
        if (conflict) {
            return NextResponse.json({ error: 'This time slot is already booked. Please choose another time.' }, { status: 400 });
        }

        // Save valid booking (Safe storage)
        await saveBooking({ name, email, phone, date, time, createdAt: new Date().toISOString() });

        // --- Email & Calendar Invite Integration ---
        try {
            // 1. Generate ICS File Content
            const [year, mon, d] = date.split('-').map(Number);
            const [h, m] = time.split(':').map(Number);

            // Note: ics library expects month 1-12
            const event = {
                start: [year, mon, d, h, m],
                duration: { minutes: 30 },
                title: `Call with Flated`,
                description: `Scheduled call with ${name}.\nPhone: ${phone}\nEmail: ${email}`,
                location: 'Phone Call',
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                organizer: { name: 'Flated Team', email: 'info@flated.com' },
                attendees: [
                    { name: name, email: email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
                    { name: 'Flated Info', email: 'info@flated.com', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
                    { name: 'Joe', email: 'joe@flated.com', rsvp: true, partstat: 'ACCEPTED', role: 'OPT-PARTICIPANT' },
                    { name: 'Hannah', email: 'hannah@flated.com', rsvp: true, partstat: 'ACCEPTED', role: 'OPT-PARTICIPANT' }
                ]
            };

            const { error, value } = ics.createEvent(event);

            if (error) {
                console.error('Error creating ICS event:', error);
            } else {
                // 2. Send Email with Attachment
                // Only try to send if we have user credentials
                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                    const transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Default to gmail if not set, commonly used
                        port: process.env.EMAIL_PORT || 587,
                        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        },
                    });

                    const mailOptions = {
                        from: `"Flated Scheduler" <${process.env.EMAIL_USER}>`,
                        to: `${email}, info@flated.com, joe@flated.com, hannah@flated.com`, // Send to customer + internal team
                        subject: 'Call Scheduled - Flated',
                        text: `Hello ${name},\n\nYour call has been scheduled for ${date} at ${time} MST.\n\nPlease find the calendar invite attached.\n\nBest,\nFlated Team`,
                        attachments: [
                            {
                                filename: 'invite.ics',
                                content: value,
                                contentType: 'text/calendar'
                            }
                        ]
                    };

                    await transporter.sendMail(mailOptions);
                    console.log('Email sent successfully with calendar invite.');
                } else {
                    console.log('Email credentials not set, skipping email sending.');
                }
            }

        } catch (emailError) {
            console.error('Email/Calendar Invite Error:', emailError);
            // Non-blocking error
        }

        // --- Existing Google Calendar API Integration (Optional / Legacy) ---
        try {
            // Auth with Service Account
            if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
                const auth = new google.auth.GoogleAuth({
                    credentials: {
                        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
                    },
                    scopes: ['https://www.googleapis.com/auth/calendar'],
                });

                const calendar = google.calendar({ version: 'v3', auth });

                // Construct DateTimes
                const startDateTime = `${date}T${time}:00`;
                // Fix End Time Calculation for MST (Manual logic reused from previous)
                const [h, m] = time.split(':').map(Number);
                let endH = h;
                let endM = m + 30;
                if (endM >= 60) {
                    endH += 1;
                    endM -= 60;
                }
                const endHStr = String(endH).padStart(2, '0');
                const endMStr = String(endM).padStart(2, '0');
                const endDateTime = `${date}T${endHStr}:${endMStr}:00`;

                const event = {
                    summary: `Call with ${name}`,
                    description: `Phone: ${phone}\nEmail: ${email}`,
                    start: {
                        dateTime: startDateTime,
                        timeZone: 'America/Denver',
                    },
                    end: {
                        dateTime: endDateTime,
                        timeZone: 'America/Denver',
                    },
                };

                await calendar.events.insert({
                    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
                    resource: event,
                });
            }
        } catch (calError) {
            console.error('Google Calendar API Error:', calError);
        }

        return NextResponse.json({ message: 'Success' }, { status: 200 });

    } catch (error) {
        console.error('CRITICAL: Unexpected Scheduling Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
