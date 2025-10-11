export type ConversationMode = 'witty' | 'comedic' | 'serious' | 'academic';

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'llama' | 'huggingface' | 'mistral';

export interface AIModel {
  id: string;
  provider: AIProvider;
  name: string;
  persona: string;
  color: string;
  isActive: boolean;
  isTyping: boolean;
  lastResponseTime?: number;
}

export interface Message {
  id: string;
  content: string;
  aiModelId: string;
  timestamp: Date;
  responseTime?: number;
}

export interface ConversationContext {
  messages: Message[];
  currentTopic: string;
  mode: ConversationMode;
  participatingAIs: string[];
}

export interface Session {
  id: string;
  topic: string;
  mode: ConversationMode;
  messages: Message[];
  participants: AIModel[];
  createdAt: Date;
  lastActivity: Date;
}

export interface AIResponse {
  content: string;
  aiModelId: string;
  responseTime: number;
  tokens?: number;
}

export interface ConversationState {
  currentSession: Session | null;
  isActive: boolean;
  currentTurn: string | null;
  usedAIsThisRound: Set<string>;
  conversationRounds: number;
}

export const AI_PROVIDERS = {
  openai: {
    keys: [],
    models: ['gpt-4', 'gpt-3.5-turbo'],
    personas: ['Creative Thinker', 'Analytical Mind'],
    colors: ['#10B981', '#3B82F6']
  },
  anthropic: {
    keys: [],
    models: ['claude-3-opus', 'claude-3-sonnet'],
    personas: ['Philosophical Guide', 'Pragmatic Advisor'],
    colors: ['#8B5CF6', '#EC4899']
  },
  gemini: {
    keys: [],
    models: ['gemini-pro'],
    personas: ['Curious Explorer', 'Detail Seeker'],
    colors: ['#F59E0B', '#EF4444']
  },
  groq: {
    keys: [],
    models: ['mixtral-8x7b', 'llama2-70b'],
    personas: ['Swift Responder', 'Logic Engine'],
    colors: ['#06B6D4', '#84CC16']
  },
  llama: {
    keys: [],
    models: ['llama-2-70b'],
    personas: ['Open Mind'],
    colors: ['#F97316']
  },
  huggingface: {
    keys: [],
    models: ['microsoft/DialoGPT-large'],
    personas: ['Community Voice'],
    colors: ['#FBBF24']
  },
  mistral: {
    keys: [],
    models: ['mistral-large'],
    personas: ['European Perspective'],
    colors: ['#A855F7']
  }
} as const;
