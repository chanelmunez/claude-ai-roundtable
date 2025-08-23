import type { Message, ConversationContext, ConversationMode } from '@/lib/types';

export class ContextManager {
  private readonly MAX_CONTEXT_MESSAGES = 10;
  private readonly MAX_CONTEXT_LENGTH = 2000; // characters

  /**
   * Creates a rolling context for an AI, excluding its own previous messages
   */
  rollContext(messages: Message[], currentAI: string, topic: string, mode: ConversationMode): ConversationContext {
    // Filter out messages from the current AI to prevent self-reference
    const filteredMessages = messages
      .filter(msg => msg.aiModelId !== currentAI)
      .slice(-this.MAX_CONTEXT_MESSAGES); // Keep only recent messages

    // Truncate if context is too long
    const truncatedMessages = this.maintainContextLength(filteredMessages);

    return {
      messages: truncatedMessages,
      currentTopic: topic,
      mode,
      participatingAIs: Array.from(new Set(filteredMessages.map(msg => msg.aiModelId)))
    };
  }

  /**
   * Maintains context within token/character limits
   */
  maintainRelevancy(context: string, maxLength: number): string {
    if (context.length <= maxLength) {
      return context;
    }

    // Truncate from the beginning, keeping the most recent content
    const truncated = context.slice(context.length - maxLength);
    
    // Try to start from a complete sentence
    const sentenceStart = truncated.indexOf('. ') + 2;
    return sentenceStart > 1 ? truncated.slice(sentenceStart) : truncated;
  }

  /**
   * Tracks conversation state and flow
   */
  trackConversationState(sessionId: string, messages: Message[]): {
    totalMessages: number;
    participantCount: number;
    averageResponseTime: number;
    lastActivity: Date | null;
    conversationFlow: Array<{ aiId: string; timestamp: Date }>;
  } {
    const participantCount = new Set(messages.map(msg => msg.aiModelId)).size;
    const averageResponseTime = messages.length > 0
      ? messages.reduce((sum, msg) => sum + (msg.responseTime || 0), 0) / messages.length
      : 0;
    
    const lastActivity = messages.length > 0
      ? messages[messages.length - 1].timestamp
      : null;

    const conversationFlow = messages.map(msg => ({
      aiId: msg.aiModelId,
      timestamp: msg.timestamp
    }));

    return {
      totalMessages: messages.length,
      participantCount,
      averageResponseTime,
      lastActivity,
      conversationFlow
    };
  }

  /**
   * Analyzes conversation for potential issues
   */
  analyzeConversation(messages: Message[]): {
    hasRecentActivity: boolean;
    isDominatedByOneAI: boolean;
    averageMessageLength: number;
    conversationHealth: 'healthy' | 'stagnant' | 'dominated' | 'sparse';
  } {
    if (messages.length === 0) {
      return {
        hasRecentActivity: false,
        isDominatedByOneAI: false,
        averageMessageLength: 0,
        conversationHealth: 'sparse'
      };
    }

    const now = new Date();
    const lastMessage = messages[messages.length - 1];
    const timeSinceLastMessage = now.getTime() - lastMessage.timestamp.getTime();
    const hasRecentActivity = timeSinceLastMessage < 5 * 60 * 1000; // 5 minutes

    // Check if one AI dominates the conversation
    const aiMessageCounts = new Map<string, number>();
    messages.forEach(msg => {
      aiMessageCounts.set(msg.aiModelId, (aiMessageCounts.get(msg.aiModelId) || 0) + 1);
    });

    const maxMessages = Math.max(...aiMessageCounts.values());
    const totalAIs = aiMessageCounts.size;
    const isDominatedByOneAI = totalAIs > 1 && maxMessages > messages.length * 0.6;

    const averageMessageLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length;

    let conversationHealth: 'healthy' | 'stagnant' | 'dominated' | 'sparse' = 'healthy';
    if (messages.length < 3) {
      conversationHealth = 'sparse';
    } else if (!hasRecentActivity) {
      conversationHealth = 'stagnant';
    } else if (isDominatedByOneAI) {
      conversationHealth = 'dominated';
    }

    return {
      hasRecentActivity,
      isDominatedByOneAI,
      averageMessageLength,
      conversationHealth
    };
  }

  /**
   * Generates conversation insights
   */
  generateInsights(messages: Message[]): {
    mostActiveAI: string | null;
    fastestResponder: string | null;
    mostEngagingTopic: string | null;
    conversationMomentum: 'high' | 'medium' | 'low';
  } {
    if (messages.length === 0) {
      return {
        mostActiveAI: null,
        fastestResponder: null,
        mostEngagingTopic: null,
        conversationMomentum: 'low'
      };
    }

    // Find most active AI
    const aiMessageCounts = new Map<string, number>();
    messages.forEach(msg => {
      aiMessageCounts.set(msg.aiModelId, (aiMessageCounts.get(msg.aiModelId) || 0) + 1);
    });
    const mostActiveAI = Array.from(aiMessageCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Find fastest responder
    const aiResponseTimes = new Map<string, number[]>();
    messages.forEach(msg => {
      if (msg.responseTime) {
        const times = aiResponseTimes.get(msg.aiModelId) || [];
        times.push(msg.responseTime);
        aiResponseTimes.set(msg.aiModelId, times);
      }
    });
    
    const avgResponseTimes = Array.from(aiResponseTimes.entries())
      .map(([aiId, times]) => [aiId, times.reduce((a, b) => a + b, 0) / times.length])
      .sort((a, b) => (a[1] as number) - (b[1] as number));
    const fastestResponder = avgResponseTimes[0]?.[0] as string || null;

    // Assess conversation momentum based on message frequency
    const recentMessages = messages.slice(-5);
    const timeSpan = recentMessages.length > 1
      ? recentMessages[recentMessages.length - 1].timestamp.getTime() - recentMessages[0].timestamp.getTime()
      : 0;
    
    let conversationMomentum: 'high' | 'medium' | 'low' = 'low';
    if (timeSpan > 0) {
      const messagesPerMinute = (recentMessages.length / timeSpan) * 60 * 1000;
      if (messagesPerMinute > 2) conversationMomentum = 'high';
      else if (messagesPerMinute > 0.5) conversationMomentum = 'medium';
    }

    return {
      mostActiveAI,
      fastestResponder,
      mostEngagingTopic: null, // Could be enhanced with topic analysis
      conversationMomentum
    };
  }

  private maintainContextLength(messages: Message[]): Message[] {
    let totalLength = 0;
    const validMessages: Message[] = [];

    // Add messages from most recent, stopping when we hit length limit
    for (let i = messages.length - 1; i >= 0; i--) {
      const messageLength = messages[i].content.length;
      if (totalLength + messageLength > this.MAX_CONTEXT_LENGTH) {
        break;
      }
      validMessages.unshift(messages[i]);
      totalLength += messageLength;
    }

    return validMessages;
  }
}