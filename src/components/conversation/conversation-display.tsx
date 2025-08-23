'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './message-bubble';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Users, Clock } from 'lucide-react';
import type { Message, AIModel, Session } from '@/lib/types';

interface ConversationDisplayProps {
  session: Session | null;
  messages: Message[];
  aiModels: AIModel[];
  className?: string;
}

export function ConversationDisplay({
  session,
  messages,
  aiModels,
  className = ''
}: ConversationDisplayProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'end' 
    });
  }, [messages]);

  const getAIModelForMessage = (message: Message): AIModel | undefined => {
    return aiModels.find(ai => ai.id === message.aiModelId);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const conversationStats = {
    totalMessages: messages.length,
    uniqueParticipants: new Set(messages.map(m => m.aiModelId)).size,
    averageResponseTime: messages.length > 0
      ? Math.round(messages.reduce((sum, m) => sum + (m.responseTime || 0), 0) / messages.length)
      : 0,
    lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : null
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-auburn-orange" />
            <span>Conversation</span>
            {session && (
              <Badge variant="outline" className="ml-2">
                {session.mode.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{conversationStats.totalMessages}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{conversationStats.uniqueParticipants}</span>
            </div>
            {conversationStats.averageResponseTime > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{conversationStats.averageResponseTime}ms</span>
              </div>
            )}
          </div>
        </div>

        {session && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              <strong>Topic:</strong> {session.topic}
            </p>
            {conversationStats.lastActivity && (
              <p className="text-xs text-muted-foreground mt-1">
                Last activity: {formatTime(conversationStats.lastActivity)}
              </p>
            )}
          </div>
        )}
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {session ? 'The conversation is about to begin...' : 'No active conversation'}
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => {
                  const aiModel = getAIModelForMessage(message);
                  const isLatest = index === messages.length - 1;
                  
                  return (
                    <motion.div
                      key={message.id}
                      layout
                      layoutId={message.id}
                    >
                      <MessageBubble
                        message={message}
                        aiModel={aiModel}
                        isLatest={isLatest}
                        className="mb-4"
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}