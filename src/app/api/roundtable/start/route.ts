import { NextRequest, NextResponse } from 'next/server';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import type { ConversationMode } from '@/lib/types';

const orchestrator = new AIOrchestrator();

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, mode, selectedAIs } = body;

    if (!topic || !mode) {
      return NextResponse.json(
        { error: 'Topic and mode are required' },
        { status: 400 }
      );
    }

    // Get available AIs
    const availableAIs = orchestrator.getAvailableAIs();
    
    // Filter to selected AIs if provided, otherwise use all
    const participants = selectedAIs && selectedAIs.length > 0
      ? availableAIs.filter(ai => selectedAIs.includes(ai.id))
      : availableAIs.slice(0, 6); // Limit to 6 for better UX

    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No valid AI participants found' },
        { status: 400 }
      );
    }

    // Create session
    const session = {
      id: crypto.randomUUID(),
      topic,
      mode: mode as ConversationMode,
      messages: [],
      participants,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    return NextResponse.json({
      session,
      participants,
      message: 'Roundtable session created successfully'
    });
  } catch (error) {
    console.error('Error starting roundtable:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start roundtable session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}