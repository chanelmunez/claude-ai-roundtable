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
    keys: [
      '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',
      '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'
    ],
    models: ['gpt-4', 'gpt-3.5-turbo'],
    personas: ['Creative Thinker', 'Analytical Mind'],
    colors: ['#10B981', '#3B82F6']
  },
  anthropic: {
    keys: [
      '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',
      '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'
    ],
    models: ['claude-3-opus', 'claude-3-sonnet'],
    personas: ['Philosophical Guide', 'Pragmatic Advisor'],
    colors: ['#8B5CF6', '#EC4899']
  },
  gemini: {
    keys: [
      'AIzaSyBW0uN-YOX2Aonfmx_wtB4l1teh-BATYoI',
      'AIzaSyAdpkSBK5FOtkdtSNQ-w8dsv9g49j1HkPc'
    ],
    models: ['gemini-pro'],
    personas: ['Curious Explorer', 'Detail Seeker'],
    colors: ['#F59E0B', '#EF4444']
  },
  groq: {
    keys: ['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'],
    models: ['mixtral-8x7b', 'llama2-70b'],
    personas: ['Swift Responder', 'Logic Engine'],
    colors: ['#06B6D4', '#84CC16']
  },
  llama: {
    keys: ['LA-4de8d97d8a274ab78e910e005464a50e9a61c95222684e6caebb410ebecb6ef6'],
    models: ['llama-2-70b'],
    personas: ['Open Mind'],
    colors: ['#F97316']
  },
  huggingface: {
    keys: ['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'],
    models: ['microsoft/DialoGPT-large'],
    personas: ['Community Voice'],
    colors: ['#FBBF24']
  },
  mistral: {
    keys: ['o4jcAoz5ftRUWB1jOmhxiRa5CvQJLTSX'],
    models: ['mistral-large'],
    personas: ['European Perspective'],
    colors: ['#A855F7']
  }
} as const;