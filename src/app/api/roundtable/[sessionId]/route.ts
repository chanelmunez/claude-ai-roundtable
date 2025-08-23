import { NextRequest, NextResponse } from 'next/server';
import { TurnManager } from '@/lib/ai/turn-manager';

const turnManager = new TurnManager();

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    // In a real app, you'd fetch from database
    // For now, return session state information
    const turnInfo = turnManager.getCurrentRoundInfo();
    
    return NextResponse.json({
      sessionId,
      turnInfo,
      status: 'active'
    });
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
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'add_message':
        // Handle adding a new message
        if (data.aiModelId) {
          turnManager.markAIAsUsed(data.aiModelId);
        }
        break;
        
      case 'reset_round':
        turnManager.resetRound();
        break;
        
      case 'end_session':
        turnManager.reset();
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      turnInfo: turnManager.getCurrentRoundInfo()
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
    // Reset turn manager
    turnManager.reset();
    
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