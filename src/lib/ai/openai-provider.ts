import OpenAI from 'openai';
import { BaseAIProvider, AIProviderError } from './base-provider';
import type { AIProvider, ConversationContext, AIResponse, ConversationMode } from '@/lib/types';

export class OpenAIProvider extends BaseAIProvider {
  provider: AIProvider = 'openai';
  private client: OpenAI;

  constructor(public apiKey: string, public model: string) {
    super();
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(
    context: ConversationContext,
    mode: ConversationMode,
    aiModelId: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Find the AI model to get persona
      const persona = this.extractPersonaFromId(aiModelId);
      const prompt = this.buildPrompt(context, mode, persona);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: mode === 'comedic' ? 0.9 : mode === 'witty' ? 0.8 : mode === 'serious' ? 0.3 : 0.5,
      });

      const content = completion.choices[0]?.message?.content?.trim() || '';
      
      if (!content) {
        throw new AIProviderError('Empty response from OpenAI', this.provider);
      }

      return {
        content,
        aiModelId,
        responseTime: this.calculateResponseTime(startTime),
        tokens: completion.usage?.total_tokens
      };
    } catch (error) {
      const isRetryable = this.isRetryableError(error);
      throw new AIProviderError(
        `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        isRetryable,
        'anthropic' // Fallback to Anthropic
      );
    }
  }

  private extractPersonaFromId(aiModelId: string): string {
    // Extract persona from aiModelId format: "gpt-4-creative-thinker"
    const parts = aiModelId.split('-');
    return parts.slice(2).join(' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Rate limits and server errors are retryable
      return error.message.includes('rate') || 
             error.message.includes('server') ||
             error.message.includes('timeout');
    }
    return false;
  }
}