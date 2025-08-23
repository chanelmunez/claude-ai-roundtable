import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider, AIProviderError } from './base-provider';
import type { AIProvider, ConversationContext, AIResponse, ConversationMode } from '@/lib/types';

export class AnthropicProvider extends BaseAIProvider {
  provider: AIProvider = 'anthropic';
  private client: Anthropic;

  constructor(public apiKey: string, public model: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async generateResponse(
    context: ConversationContext,
    mode: ConversationMode,
    aiModelId: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const persona = this.extractPersonaFromId(aiModelId);
      const prompt = this.buildPrompt(context, mode, persona);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 150,
        temperature: mode === 'comedic' ? 0.9 : mode === 'witty' ? 0.8 : mode === 'serious' ? 0.3 : 0.5,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
      
      if (!content) {
        throw new AIProviderError('Empty response from Anthropic', this.provider);
      }

      return {
        content,
        aiModelId,
        responseTime: this.calculateResponseTime(startTime),
        tokens: message.usage.input_tokens + message.usage.output_tokens
      };
    } catch (error) {
      const isRetryable = this.isRetryableError(error);
      throw new AIProviderError(
        `Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        isRetryable,
        'openai' // Fallback to OpenAI
      );
    }
  }

  private extractPersonaFromId(aiModelId: string): string {
    // Extract persona from aiModelId format: "claude-3-sonnet-philosophical-guide"
    const parts = aiModelId.split('-');
    return parts.slice(3).join(' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('rate') || 
             error.message.includes('server') ||
             error.message.includes('timeout') ||
             error.message.includes('overloaded');
    }
    return false;
  }
}