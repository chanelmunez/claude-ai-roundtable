import { BaseAIProvider, AIProviderError } from './base-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GeminiProvider } from './gemini-provider';
import { GroqProvider } from './groq-provider';
import type { AIModel, AIProvider, ConversationContext, AIResponse, ConversationMode, Message } from '@/lib/types';
import { AI_PROVIDERS } from '@/lib/types';

export class AIOrchestrator {
  private providers: Map<string, BaseAIProvider> = new Map();
  private usedAIsThisRound = new Set<string>();
  private conversationRounds = 0;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize OpenAI providers
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      AI_PROVIDERS.openai.models.forEach((model, index) => {
        const persona = AI_PROVIDERS.openai.personas[index];
        const aiModelId = `${model}-${persona.toLowerCase().replace(/\s+/g, '-')}`;
        this.providers.set(aiModelId, new OpenAIProvider(openaiKey, model));
      });
    }

    // Initialize Anthropic providers
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      AI_PROVIDERS.anthropic.models.forEach((model, index) => {
        const persona = AI_PROVIDERS.anthropic.personas[index];
        const aiModelId = `${model}-${persona.toLowerCase().replace(/\s+/g, '-')}`;
        this.providers.set(aiModelId, new AnthropicProvider(anthropicKey, model));
      });
    }

    // Initialize Gemini providers
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      AI_PROVIDERS.gemini.models.forEach((model, index) => {
        const persona = AI_PROVIDERS.gemini.personas[index];
        const aiModelId = `${model}-${persona.toLowerCase().replace(/\s+/g, '-')}`;
        this.providers.set(aiModelId, new GeminiProvider(geminiKey, model));
      });
    }

    // Initialize Groq providers
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      AI_PROVIDERS.groq.models.forEach((model, index) => {
        const persona = AI_PROVIDERS.groq.personas[index];
        const aiModelId = `${model}-${persona.toLowerCase().replace(/\s+/g, '-')}`;
        this.providers.set(aiModelId, new GroqProvider(groqKey, model));
      });
    }
  }

  selectNextAI(availableAIs: AIModel[]): AIModel | null {
    // Filter out AIs that have been used this round
    const unusedAIs = availableAIs.filter(ai => !this.usedAIsThisRound.has(ai.id));
    
    // If all AIs have been used, reset the round
    if (unusedAIs.length === 0) {
      this.resetUsedAIs();
      this.conversationRounds++;
      return this.selectNextAI(availableAIs);
    }

    // Randomly select from unused AIs
    const randomIndex = Math.floor(Math.random() * unusedAIs.length);
    return unusedAIs[randomIndex];
  }

  buildRollingContext(messages: Message[], targetAI: string): ConversationContext {
    // Exclude messages from the target AI to prevent self-reference
    const filteredMessages = messages.filter(msg => msg.aiModelId !== targetAI);
    
    return {
      messages: filteredMessages,
      currentTopic: '', // This will be set by the session
      mode: 'witty' as ConversationMode, // This will be set by the session
      participatingAIs: Array.from(new Set(filteredMessages.map(msg => msg.aiModelId)))
    };
  }

  async generateResponse(
    aiModelId: string,
    context: ConversationContext,
    mode: ConversationMode
  ): Promise<AIResponse> {
    const provider = this.providers.get(aiModelId);
    
    if (!provider) {
      throw new AIProviderError(`No provider found for AI model: ${aiModelId}`, 'openai', false);
    }

    try {
      const response = await provider.generateResponse(context, mode, aiModelId);
      this.markAIAsUsed(aiModelId);
      return response;
    } catch (error) {
      if (error instanceof AIProviderError && error.fallbackProvider) {
        // Try fallback provider
        return this.tryFallbackProvider(error.fallbackProvider, aiModelId, context, mode);
      }
      throw error;
    }
  }

  private async tryFallbackProvider(
    fallbackProvider: AIProvider,
    originalAiModelId: string,
    context: ConversationContext,
    mode: ConversationMode
  ): Promise<AIResponse> {
    // Find a fallback AI model from the specified provider
    const fallbackAIs = Array.from(this.providers.entries())
      .filter(([, provider]) => provider.provider === fallbackProvider)
      .map(([aiId]) => aiId);

    if (fallbackAIs.length === 0) {
      throw new AIProviderError(`No fallback provider available: ${fallbackProvider}`, fallbackProvider, false);
    }

    const fallbackAiId = fallbackAIs[0];
    const fallbackProviderInstance = this.providers.get(fallbackAiId);
    
    if (!fallbackProviderInstance) {
      throw new AIProviderError(`Fallback provider not initialized: ${fallbackProvider}`, fallbackProvider, false);
    }

    return fallbackProviderInstance.generateResponse(context, mode, originalAiModelId);
  }

  markAIAsUsed(aiModelId: string) {
    this.usedAIsThisRound.add(aiModelId);
  }

  resetUsedAIs() {
    this.usedAIsThisRound.clear();
  }

  getAvailableAIs(): AIModel[] {
    const aiModels: AIModel[] = [];

    // Create AI models from all initialized providers
    for (const [aiModelId, provider] of this.providers) {
      const [providerName] = aiModelId.split('-');
      const persona = this.extractPersona(aiModelId, provider.provider);
      const color = this.getColorForAI(aiModelId, provider.provider);

      aiModels.push({
        id: aiModelId,
        provider: provider.provider,
        name: `${providerName.toUpperCase()} (${persona})`,
        persona,
        color,
        isActive: true,
        isTyping: false
      });
    }

    return aiModels;
  }

  private extractPersona(aiModelId: string, provider: AIProvider): string {
    const parts = aiModelId.split('-');
    
    switch (provider) {
      case 'openai':
        return parts.slice(2).join(' ').replace(/\b\w/g, l => l.toUpperCase());
      case 'anthropic':
        return parts.slice(3).join(' ').replace(/\b\w/g, l => l.toUpperCase());
      case 'gemini':
      case 'groq':
        return parts.slice(2).join(' ').replace(/\b\w/g, l => l.toUpperCase());
      default:
        return 'Unknown Persona';
    }
  }

  private getColorForAI(aiModelId: string, provider: AIProvider): string {
    const providerConfig = AI_PROVIDERS[provider];
    const persona = this.extractPersona(aiModelId, provider);
    const personaIndex = providerConfig.personas.findIndex(p => 
      p.toLowerCase() === persona.toLowerCase()
    );
    
    return providerConfig.colors[personaIndex] || providerConfig.colors[0];
  }
}
