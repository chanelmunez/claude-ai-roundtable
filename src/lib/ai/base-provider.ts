import type { AIProvider, ConversationContext, AIResponse, ConversationMode } from '@/lib/types';

export abstract class BaseAIProvider {
  abstract provider: AIProvider;
  abstract apiKey: string;
  abstract model: string;

  abstract generateResponse(
    context: ConversationContext,
    mode: ConversationMode,
    aiModelId: string
  ): Promise<AIResponse>;

  protected buildPrompt(
    context: ConversationContext,
    mode: ConversationMode,
    persona: string
  ): string {
    const modeInstructions = {
      witty: 'Respond with wit, humor, and clever observations. Be engaging and entertaining while staying relevant to the topic.',
      comedic: 'Focus on humor, jokes, and funny observations. Keep the tone light and amusing.',
      serious: 'Maintain a professional, thoughtful tone. Focus on substantial insights and meaningful contributions.',
      academic: 'Adopt a scholarly approach with well-reasoned arguments, citations when relevant, and analytical depth.'
    };

    const contextMessages = context.messages
      .slice(-10) // Keep last 10 messages for context
      .map(msg => `${msg.aiModelId}: ${msg.content}`)
      .join('\n');

    return `You are "${persona}", an AI participant in a roundtable discussion about "${context.currentTopic}".

CONVERSATION MODE: ${mode.toUpperCase()}
${modeInstructions[mode]}

PERSONA INSTRUCTIONS:
- Embody the "${persona}" perspective and personality
- Keep responses to 2-3 sentences maximum for flow
- Be conversational and engaging
- Add to the discussion meaningfully
- Don't repeat what others have already said

RECENT CONVERSATION:
${contextMessages || 'No previous messages'}

Respond as ${persona} in ${mode} mode:`;
  }

  protected calculateResponseTime(startTime: number): number {
    return Date.now() - startTime;
  }
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: AIProvider,
    public retryable: boolean = true,
    public fallbackProvider?: AIProvider
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}