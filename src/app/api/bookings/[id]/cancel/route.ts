import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { cancelBooking } from '@/lib/services';

export async function POST(_: Request, context: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'PASSENGER' || !user.passenger_id) return NextResponse.json({ error: 'Passenger sign-in is required.' }, { status: 401 });
  try {
    await cancelBooking(Number(context.params.id), user.passenger_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Cancellation failed.' }, { status: 400 });
  }
}
