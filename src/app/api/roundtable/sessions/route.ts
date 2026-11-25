import { NextResponse } from 'next/server';
import { listSessions } from '@/lib/database/session-repository';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const sessions = await listSessions(100);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
