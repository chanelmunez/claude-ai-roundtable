'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import type { Message, AIModel } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
  aiModel?: AIModel;
  isLatest?: boolean;
  className?: string;
}

export function MessageBubble({ 
  message, 
  aiModel, 
  isLatest = false,
  className = '' 
}: MessageBubbleProps) {
  const getProviderIcon = (provider?: string) => {
    const icons = {
      openai: '🧠',
      anthropic: '🎭', 
      gemini: '💎',
      groq: '⚡',
      llama: '🦙',
      huggingface: '🤗',
      mistral: '🌬️'
    };
    return provider ? icons[provider as keyof typeof icons] || '🤖' : '🤖';
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const formatResponseTime = (responseTime?: number) => {
    if (!responseTime) return '';
    return responseTime < 1000 ? `${responseTime}ms` : `${(responseTime / 1000).toFixed(1)}s`;
  };

  const bubbleVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.9 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20
      }
    },
    latest: {
      opacity: 1,
      y: 0,
      scale: 1,
      boxShadow: aiModel?.color ? `0 0 20px ${aiModel.color}40` : '0 0 20px rgba(0,0,0,0.1)',
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20,
        boxShadow: { duration: 2, ease: "easeOut" as const }
      }
    }
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate={isLatest ? "latest" : "visible"}
      className={`flex items-start space-x-3 ${className}`}
    >
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Avatar 
          className="w-10 h-10 border-2" 
          style={{ borderColor: aiModel?.color || '#6B7280' }}
        >
          <AvatarFallback 
            className="text-sm"
            style={{ 
              backgroundColor: aiModel?.color ? `${aiModel.color}20` : '#F3F4F6',
              color: aiModel?.color || '#6B7280'
            }}
          >
            {getProviderIcon(aiModel?.provider)}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-1">
          <span 
            className="font-medium text-sm truncate"
            style={{ color: aiModel?.color || '#6B7280' }}
          >
            {aiModel?.persona || message.aiModelId}
          </span>
          
          {aiModel?.provider && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              {aiModel.provider.toUpperCase()}
            </Badge>
          )}
          
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>

          {message.responseTime && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatResponseTime(message.responseTime)}</span>
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <Card 
          className="glass-effect border"
          style={{ 
            borderLeftColor: aiModel?.color || '#6B7280',
            borderLeftWidth: '3px',
            backgroundColor: aiModel?.color ? `${aiModel.color}05` : '#F9FAFB'
          }}
        >
          <CardContent className="p-3">
            <motion.p 
              className="text-sm leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {message.content}
            </motion.p>
          </CardContent>
        </Card>

        {/* Latest Message Indicator */}
        {isLatest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2"
          >
            <Badge 
              className="text-xs px-2 py-1"
              style={{ 
                backgroundColor: aiModel?.color || '#6B7280',
                color: 'white'
              }}
            >
              Latest Response
            </Badge>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}