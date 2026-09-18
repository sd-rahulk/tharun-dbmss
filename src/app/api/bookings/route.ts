import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createBooking } from '@/lib/services';

export async function POST(request: Request) {
  const user = getSessionUser();
  if (!user || user.role !== 'PASSENGER' || !user.passenger_id) return NextResponse.json({ error: 'Passenger sign-in is required to book.' }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, booking: createBooking({ ...body, passengerId: user.passenger_id }) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Booking failed.' }, { status: 400 });
  }
}
