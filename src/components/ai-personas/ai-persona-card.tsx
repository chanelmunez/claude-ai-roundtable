'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { AIModel } from '@/lib/types';

interface AIPersonaCardProps {
  aiModel: AIModel;
  isCurrentTurn?: boolean;
  lastResponseTime?: number;
  className?: string;
}

export function AIPersonaCard({ 
  aiModel, 
  isCurrentTurn = false, 
  lastResponseTime,
  className = '' 
}: AIPersonaCardProps) {
  const getProviderIcon = () => {
    const icons = {
      openai: '🧠',
      anthropic: '🎭', 
      gemini: '💎',
      groq: '⚡',
      llama: '🦙',
      huggingface: '🤗',
      mistral: '🌬️'
    };
    return icons[aiModel.provider] || '🤖';
  };

  const cardVariants = {
    idle: { 
      scale: 1, 
      borderColor: aiModel.color + '40',
      boxShadow: `0 0 0 0 ${aiModel.color}40`
    },
    active: { 
      scale: 1.05, 
      borderColor: aiModel.color,
      boxShadow: `0 0 20px 5px ${aiModel.color}40`
    },
    typing: {
      scale: 1.02,
      borderColor: aiModel.color,
      boxShadow: `0 0 15px 3px ${aiModel.color}60`,
      transition: {
        boxShadow: {
          repeat: Infinity,
          repeatType: "reverse" as const,
          duration: 1
        }
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      animate={
        aiModel.isTyping ? 'typing' : 
        isCurrentTurn ? 'active' : 'idle'
      }
      transition={{ duration: 0.3 }}
      className={`relative ${className}`}
    >
      <Card 
        className="relative overflow-hidden border-2 glass-effect"
        style={{ 
          borderColor: isCurrentTurn || aiModel.isTyping ? aiModel.color : `${aiModel.color}40`,
          backgroundColor: `${aiModel.color}10`
        }}
      >
        <CardContent className="p-4 text-center">
          {/* Status Indicator */}
          <div className="absolute top-2 right-2">
            {aiModel.isTyping ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4" style={{ color: aiModel.color }} />
              </motion.div>
            ) : (
              <div 
                className={`w-3 h-3 rounded-full ${
                  aiModel.isActive ? 'bg-green-400' : 'bg-gray-400'
                }`} 
              />
            )}
          </div>

          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Avatar className="w-16 h-16 mx-auto mb-3 border-2" style={{ borderColor: aiModel.color }}>
              <AvatarFallback 
                className="text-2xl"
                style={{ backgroundColor: `${aiModel.color}20`, color: aiModel.color }}
              >
                {getProviderIcon()}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Model Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm truncate">
              {aiModel.name}
            </h3>
            
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ 
                backgroundColor: `${aiModel.color}20`,
                color: aiModel.color,
                borderColor: `${aiModel.color}40`
              }}
            >
              {aiModel.persona}
            </Badge>

            {/* Provider Badge */}
            <Badge variant="outline" className="text-xs">
              {aiModel.provider.toUpperCase()}
            </Badge>

            {/* Response Time */}
            {lastResponseTime && (
              <div className="text-xs text-muted-foreground">
                {lastResponseTime}ms
              </div>
            )}
          </div>

          {/* Turn Indicator */}
          {isCurrentTurn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: aiModel.color }}
            />
          )}

          {/* Typing Indicator */}
          {aiModel.isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
            >
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: aiModel.color }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}