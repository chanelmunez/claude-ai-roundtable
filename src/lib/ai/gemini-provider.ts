import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider, AIProviderError } from './base-provider';
import type { AIProvider, ConversationContext, AIResponse, ConversationMode } from '@/lib/types';

export class GeminiProvider extends BaseAIProvider {
  provider: AIProvider = 'gemini';
  private client: GoogleGenerativeAI;
  private genAI: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(public apiKey: string, public model: string) {
    super();
    this.client = new GoogleGenerativeAI(apiKey);
    this.genAI = this.client.getGenerativeModel({ model: this.model });
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

      const result = await this.genAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: mode === 'comedic' ? 0.9 : mode === 'witty' ? 0.8 : mode === 'serious' ? 0.3 : 0.5,
        }
      });

      const content = result.response.text()?.trim() || '';
      
      if (!content) {
        throw new AIProviderError('Empty response from Gemini', this.provider);
      }

      return {
        content,
        aiModelId,
        responseTime: this.calculateResponseTime(startTime),
        tokens: result.response.usageMetadata?.totalTokenCount
      };
    } catch (error) {
      const isRetryable = this.isRetryableError(error);
      throw new AIProviderError(
        `Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        isRetryable,
        'openai' // Fallback to OpenAI
      );
    }
  }

  private extractPersonaFromId(aiModelId: string): string {
    // Extract persona from aiModelId format: "gemini-pro-curious-explorer"
    const parts = aiModelId.split('-');
    return parts.slice(2).join(' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('quota') || 
             error.message.includes('server') ||
             error.message.includes('timeout') ||
             error.message.includes('rate');
    }
    return false;
  }
}