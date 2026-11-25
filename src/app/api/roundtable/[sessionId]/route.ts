import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getSession, updateSessionStatus } from '@/lib/database/session-repository';
import type { SessionStatus } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'end_session':
        await updateSessionStatus(sessionId, 'completed');
        break;
      case 'archive_session':
        await updateSessionStatus(sessionId, 'archived');
        break;
      case 'update_status': {
        const nextStatus = (data?.status ?? 'completed') as SessionStatus;
        await updateSessionStatus(sessionId, nextStatus);
        break;
      }
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const session = await getSession(sessionId);

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    await deleteSession(sessionId);

    return NextResponse.json({
      success: true,
      message: `Session ${sessionId} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
