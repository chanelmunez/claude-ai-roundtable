import type { AIModel, Message } from '@/lib/types';

export class TurnManager {
  private usedAIs = new Set<string>();
  private conversationRounds = 0;
  private lastSpeaker: string | null = null;

  /**
   * Selects the next AI to speak using intelligent randomization
   */
  selectNextAI(availableAIs: AIModel[]): AIModel | null {
    if (availableAIs.length === 0) return null;

    // Filter out inactive AIs
    const activeAIs = availableAIs.filter(ai => ai.isActive);
    if (activeAIs.length === 0) return null;

    // First turn - completely random
    if (this.conversationRounds === 0 && this.usedAIs.size === 0) {
      return this.getRandomAI(activeAIs);
    }

    // Get AIs that haven't spoken this round
    const unusedAIs = activeAIs.filter(ai => !this.usedAIs.has(ai.id));

    // If all AIs have been used this round, reset and start new round
    if (unusedAIs.length === 0) {
      this.resetRound();
      return this.selectNextAI(availableAIs);
    }

    // Prefer AIs that haven't spoken recently, but add some randomness
    const weightedAIs = this.calculateAIWeights(unusedAIs);
    return this.selectWeightedRandomAI(weightedAIs);
  }

  /**
   * Marks an AI as having spoken this round
   */
  markAIAsUsed(aiId: string): void {
    this.usedAIs.add(aiId);
    this.lastSpeaker = aiId;
  }

  /**
   * Checks if all active AIs have spoken this round
   */
  isRoundComplete(availableAIs: AIModel[]): boolean {
    const activeAICount = availableAIs.filter(ai => ai.isActive).length;
    return this.usedAIs.size >= activeAICount;
  }

  /**
   * Starts a new conversation round
   */
  resetRound(): void {
    this.usedAIs.clear();
    this.conversationRounds++;
  }

  /**
   * Gets current round information
   */
  getCurrentRoundInfo(): {
    round: number;
    usedAIsThisRound: string[];
    lastSpeaker: string | null;
  } {
    return {
      round: this.conversationRounds,
      usedAIsThisRound: Array.from(this.usedAIs),
      lastSpeaker: this.lastSpeaker
    };
  }

  /**
   * Analyzes conversation turn patterns
   */
  analyzeTurnPatterns(messages: Message[]): {
    averageTurnLength: number;
    turnDistribution: Map<string, number>;
    longestStreak: { aiId: string; count: number };
    mostRecentSpeakers: string[];
  } {
    if (messages.length === 0) {
      return {
        averageTurnLength: 0,
        turnDistribution: new Map(),
        longestStreak: { aiId: '', count: 0 },
        mostRecentSpeakers: []
      };
    }

    // Calculate turn distribution
    const turnDistribution = new Map<string, number>();
    messages.forEach(msg => {
      turnDistribution.set(msg.aiModelId, (turnDistribution.get(msg.aiModelId) || 0) + 1);
    });

    // Find longest speaking streak
    let longestStreak = { aiId: '', count: 0 };
    let currentStreak = { aiId: '', count: 0 };

    messages.forEach(msg => {
      if (msg.aiModelId === currentStreak.aiId) {
        currentStreak.count++;
      } else {
        if (currentStreak.count > longestStreak.count) {
          longestStreak = { ...currentStreak };
        }
        currentStreak = { aiId: msg.aiModelId, count: 1 };
      }
    });

    // Check final streak
    if (currentStreak.count > longestStreak.count) {
      longestStreak = { ...currentStreak };
    }

    // Get most recent speakers (last 5)
    const mostRecentSpeakers = messages
      .slice(-5)
      .map(msg => msg.aiModelId);

    const averageTurnLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length;

    return {
      averageTurnLength,
      turnDistribution,
      longestStreak,
      mostRecentSpeakers
    };
  }

  /**
   * Suggests next speaker based on conversation flow
   */
  suggestNextSpeaker(availableAIs: AIModel[], messages: Message[]): {
    suggestion: AIModel | null;
    reason: string;
    confidence: number;
  } {
    const activeAIs = availableAIs.filter(ai => ai.isActive);
    
    if (activeAIs.length === 0) {
      return {
        suggestion: null,
        reason: 'No active AIs available',
        confidence: 0
      };
    }

    const analysis = this.analyzeTurnPatterns(messages);
    
    // Find underrepresented AIs
    const underrepresentedAIs = activeAIs.filter(ai => {
      const turnCount = analysis.turnDistribution.get(ai.id) || 0;
      const averageTurns = messages.length / activeAIs.length;
      return turnCount < averageTurns * 0.8; // Less than 80% of average
    });

    // Priority 1: Give underrepresented AIs a chance
    if (underrepresentedAIs.length > 0) {
      const suggestion = this.getRandomAI(underrepresentedAIs);
      return {
        suggestion,
        reason: 'Balancing conversation participation',
        confidence: 0.8
      };
    }

    // Priority 2: Avoid consecutive turns by same AI
    const recentSpeakers = analysis.mostRecentSpeakers;
    if (recentSpeakers.length > 0) {
      const lastSpeaker = recentSpeakers[recentSpeakers.length - 1];
      const otherAIs = activeAIs.filter(ai => ai.id !== lastSpeaker);
      
      if (otherAIs.length > 0) {
        const suggestion = this.getRandomAI(otherAIs);
        return {
          suggestion,
          reason: 'Avoiding consecutive turns',
          confidence: 0.6
        };
      }
    }

    // Fallback: Random selection
    const suggestion = this.getRandomAI(activeAIs);
    return {
      suggestion,
      reason: 'Random selection',
      confidence: 0.3
    };
  }

  private getRandomAI(ais: AIModel[]): AIModel {
    const randomIndex = Math.floor(Math.random() * ais.length);
    return ais[randomIndex];
  }

  private calculateAIWeights(ais: AIModel[]): Array<{ ai: AIModel; weight: number }> {
    return ais.map(ai => ({
      ai,
      weight: 1.0 // Equal weights for now, could be enhanced with more sophisticated scoring
    }));
  }

  private selectWeightedRandomAI(weightedAIs: Array<{ ai: AIModel; weight: number }>): AIModel {
    const totalWeight = weightedAIs.reduce((sum, item) => sum + item.weight, 0);
    const randomValue = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const item of weightedAIs) {
      currentWeight += item.weight;
      if (randomValue <= currentWeight) {
        return item.ai;
      }
    }
    
    // Fallback to last AI (shouldn't happen)
    return weightedAIs[weightedAIs.length - 1].ai;
  }

  /**
   * Reset all turn management state
   */
  reset(): void {
    this.usedAIs.clear();
    this.conversationRounds = 0;
    this.lastSpeaker = null;
  }
}