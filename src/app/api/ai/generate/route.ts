import { NextRequest, NextResponse } from 'next/server';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { ContextManager } from '@/lib/ai/context-manager';
import type { ConversationMode } from '@/lib/types';
import { saveMessage } from '@/lib/database/session-repository';

const orchestrator = new AIOrchestrator();
const contextManager = new ContextManager();

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aiModelId, messages, topic, mode, sessionId } = body;

    if (!aiModelId || !topic || !mode || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, aiModelId, topic, mode' },
        { status: 400 }
      );
    }

    // Build context for the AI
    const context = contextManager.rollContext(
      messages || [],
      aiModelId,
      topic,
      mode as ConversationMode
    );

    // Generate response
    const response = await orchestrator.generateResponse(
      aiModelId,
      context,
      mode as ConversationMode
    );

    const persisted = await saveMessage({
      sessionId,
      aiModelId,
      content: response.content,
      responseTime: response.responseTime
    });

    return NextResponse.json({
      ...response,
      messageId: persisted.id,
      timestamp: persisted.timestamp.toISOString()
    });
  } catch (error) {
    console.error('AI generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const availableAIs = orchestrator.getAvailableAIs();
    return NextResponse.json({ ais: availableAIs });
  } catch (error) {
    console.error('Error getting available AIs:', error);
    return NextResponse.json(
      { error: 'Failed to get available AIs' },
      { status: 500 }
    );
  }
}
