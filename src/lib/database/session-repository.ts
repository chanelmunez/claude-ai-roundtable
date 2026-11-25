import type {
  AIModel,
  ConversationMode,
  Message,
  Session,
  SessionStatus,
  SessionSummary
} from '@/lib/types';
import { getSupabaseClient } from './supabase-client';

interface SessionRow {
  id: string;
  topic: string;
  mode: ConversationMode;
  status: SessionStatus;
  created_at: string;
  last_activity: string;
}

interface MessageRow {
  id: string;
  session_id: string;
  ai_model_id: string;
  content: string;
  timestamp: string;
  response_time: number | null;
}

interface ParticipantRow {
  session_id: string;
  ai_model_id: string;
  provider: string;
  name: string;
  persona: string;
  color: string;
  is_active: boolean | number;
}

function mapSession(row: SessionRow, participants: AIModel[], messages: Message[]): Session {
  return {
    id: row.id,
    topic: row.topic,
    mode: row.mode,
    status: row.status,
    participants,
    messages,
    createdAt: new Date(row.created_at),
    lastActivity: new Date(row.last_activity)
  };
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    aiModelId: row.ai_model_id,
    content: row.content,
    timestamp: new Date(row.timestamp),
    responseTime: row.response_time ?? undefined
  };
}

function mapParticipant(row: ParticipantRow): AIModel {
  return {
    id: row.ai_model_id,
    provider: row.provider as AIModel['provider'],
    name: row.name,
    persona: row.persona,
    color: row.color,
    isActive: Boolean(row.is_active),
    isTyping: false
  };
}

export async function createSession({
  topic,
  mode,
  participants
}: {
  topic: string;
  mode: ConversationMode;
  participants: AIModel[];
}): Promise<Session> {
  const supabase = getSupabaseClient();
  const sessionId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const { error: sessionError } = await supabase.from('sessions').insert({
    id: sessionId,
    topic,
    mode,
    status: 'active',
    created_at: timestamp,
    last_activity: timestamp
  });

  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`);
  }

  const participantRows = participants.map((participant) => ({
    session_id: sessionId,
    ai_model_id: participant.id,
    provider: participant.provider,
    name: participant.name,
    persona: participant.persona,
    color: participant.color,
    is_active: participant.isActive
  }));

  const { error: participantError } = await supabase
    .from('session_participants')
    .insert(participantRows);

  if (participantError) {
    throw new Error(`Failed to add participants: ${participantError.message}`);
  }

  return {
    id: sessionId,
    topic,
    mode,
    status: 'active',
    participants,
    messages: [],
    createdAt: new Date(timestamp),
    lastActivity: new Date(timestamp)
  };
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const supabase = getSupabaseClient();

  const { data: sessionRow, error: sessionError } = await supabase
    .from<SessionRow>('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(`Failed to fetch session: ${sessionError.message}`);
  }

  if (!sessionRow) {
    return null;
  }

  const [{ data: participantRows, error: participantError }, { data: messageRows, error: messageError }] = await Promise.all([
    supabase
      .from<ParticipantRow>('session_participants')
      .select('*')
      .eq('session_id', sessionId),
    supabase
      .from<MessageRow>('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })
  ]);

  if (participantError) {
    throw new Error(`Failed to load participants: ${participantError.message}`);
  }

  if (messageError) {
    throw new Error(`Failed to load messages: ${messageError.message}`);
  }

  const participants = (participantRows ?? []).map(mapParticipant);
  const messages = (messageRows ?? []).map(mapMessage);

  return mapSession(sessionRow, participants, messages);
}

type SessionSummaryRow = SessionRow & { messages: Array<{ count: number }> };

export async function listSessions(limit = 25): Promise<SessionSummary[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from<SessionSummaryRow>('sessions')
    .select('id, topic, mode, status, created_at, last_activity, messages(count)')
    .order('last_activity', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list sessions: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    topic: row.topic,
    mode: row.mode,
    status: row.status,
    createdAt: new Date(row.created_at),
    lastActivity: new Date(row.last_activity),
    messageCount: Array.isArray(row.messages) && row.messages.length > 0
      ? row.messages[0]?.count ?? 0
      : 0
  }));
}

export async function saveMessage({
  sessionId,
  aiModelId,
  content,
  responseTime,
  timestamp
}: {
  sessionId: string;
  aiModelId: string;
  content: string;
  responseTime?: number;
  timestamp?: Date;
}): Promise<Message> {
  const supabase = getSupabaseClient();
  const id = crypto.randomUUID();
  const finalTimestamp = timestamp ?? new Date();

  const { error: insertError } = await supabase.from('messages').insert({
    id,
    session_id: sessionId,
    ai_model_id: aiModelId,
    content,
    timestamp: finalTimestamp.toISOString(),
    response_time: responseTime ?? null
  });

  if (insertError) {
    throw new Error(`Failed to save message: ${insertError.message}`);
  }

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ last_activity: finalTimestamp.toISOString() })
    .eq('id', sessionId);

  if (updateError) {
    throw new Error(`Failed to update session activity: ${updateError.message}`);
  }

  return {
    id,
    aiModelId,
    content,
    timestamp: finalTimestamp,
    responseTime
  };
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to update session status: ${error.message}`);
  }
}

export async function deleteSession(sessionId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
}
