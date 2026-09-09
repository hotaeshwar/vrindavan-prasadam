import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');

// Ensure data directory and file exist
function getLocalBookings() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf-8');
      return [];
    }
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(fileContent || '[]');
  } catch (error) {
    console.error('Error reading local bookings file:', error);
    return [];
  }
}

function saveLocalBookings(bookings) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing local bookings file:', error);
    return false;
  }
}

// GET /api/bookings - Fetch all bookings
export async function GET() {
  try {
    const bookings = getLocalBookings();
    // Sort newest first
    bookings.sort((a, b) => {
      const timeA = new Date(a.createdClientTime || a.createdAt || 0).getTime();
      const timeB = new Date(b.createdClientTime || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, bookings }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ success: false, bookings: [], error: error.message }, { status: 500 });
  }
}

// POST /api/bookings - Add or update a booking
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || !body.bookingId) {
      return NextResponse.json({ success: false, error: 'Invalid booking data' }, { status: 400 });
    }

    const bookings = getLocalBookings();
    const existingIndex = bookings.findIndex(b => b.bookingId === body.bookingId || b.id === body.bookingId);

    const newBooking = {
      ...body,
      id: body.bookingId,
      status: body.status || 'Confirmed',
      createdClientTime: body.createdClientTime || new Date().toISOString(),
      createdAtFormatted: body.createdAtFormatted || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      bookings[existingIndex] = { ...bookings[existingIndex], ...newBooking };
    } else {
      bookings.unshift(newBooking);
    }

    saveLocalBookings(bookings);

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/bookings - Delete a booking
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 });
    }

    let bookings = getLocalBookings();
    bookings = bookings.filter(b => b.bookingId !== id && b.id !== id);
    saveLocalBookings(bookings);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('DELETE /api/bookings error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/bookings - Update status
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status required' }, { status: 400 });
    }

    const bookings = getLocalBookings();
    const target = bookings.find(b => b.bookingId === id || b.id === id);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toISOString();
      saveLocalBookings(bookings);
      return NextResponse.json({ success: true, booking: target });
    } else {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('PATCH /api/bookings error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
