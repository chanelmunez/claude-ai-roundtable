'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TopicIntroductionPanel } from './topic-introduction-panel';
import { AIPersonaCard } from '@/components/ai-personas/ai-persona-card';
import { ConversationDisplay } from '@/components/conversation/conversation-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Users, 
  Crown
} from 'lucide-react';
import { useConversationStore } from '@/stores/conversation-store';
import type { ConversationMode, AIModel, Message } from '@/lib/types';

export function RoundtableInterface() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTurnAI, setCurrentTurnAI] = useState<string | null>(null);
  
  const {
    currentSession,
    isActive,
    createSession,
    addMessage,
    updateAIStatus,
    endSession
  } = useConversationStore();

  // Fetch available AIs
  const { data: availableAIs = [] } = useQuery({
    queryKey: ['available-ais'],
    queryFn: async () => {
      const response = await fetch('/api/ai/generate');
      if (!response.ok) throw new Error('Failed to fetch AIs');
      const data = await response.json();
      return data.ais as AIModel[];
    }
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async ({ topic, mode, selectedAIs }: {
      topic: string;
      mode: ConversationMode;
      selectedAIs: string[];
    }) => {
      const response = await fetch('/api/roundtable/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode, selectedAIs })
      });
      if (!response.ok) throw new Error('Failed to start conversation');
      return response.json();
    },
    onSuccess: (data) => {
      createSession(data.session.topic, data.session.mode, data.participants);
      // Start the conversation by selecting first AI
      setTimeout(() => {
        generateNextResponse();
      }, 1000);
    }
  });

  // Generate AI response mutation
  const generateResponseMutation = useMutation({
    mutationFn: async ({ aiModelId, messages, topic, mode }: {
      aiModelId: string;
      messages: Message[];
      topic: string;
      mode: ConversationMode;
    }) => {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModelId, messages, topic, mode })
      });
      if (!response.ok) throw new Error('Failed to generate response');
      return response.json();
    },
    onSuccess: (response) => {
      // Add the new message
      const message: Message = {
        id: crypto.randomUUID(),
        content: response.content,
        aiModelId: response.aiModelId,
        timestamp: new Date(),
        responseTime: response.responseTime
      };
      
      addMessage(message);
      updateAIStatus(response.aiModelId, { isTyping: false });
      setCurrentTurnAI(null);
      
      // Continue conversation after a brief pause
      setTimeout(() => {
        generateNextResponse();
      }, 2000);
    },
    onError: (error) => {
      console.error('Generation error:', error);
      if (currentTurnAI) {
        updateAIStatus(currentTurnAI, { isTyping: false });
      }
      setCurrentTurnAI(null);
      setIsGenerating(false);
    }
  });

  const generateNextResponse = () => {
    if (!currentSession || !isActive) return;

    // Simple round-robin selection for now
    const activeParticipants = currentSession.participants.filter(ai => ai.isActive);
    if (activeParticipants.length === 0) return;

    // Find next AI (excluding the last speaker)
    const lastMessage = currentSession.messages[currentSession.messages.length - 1];
    const availableAIs = lastMessage 
      ? activeParticipants.filter(ai => ai.id !== lastMessage.aiModelId)
      : activeParticipants;
    
    const nextAI = availableAIs[Math.floor(Math.random() * availableAIs.length)];
    
    setCurrentTurnAI(nextAI.id);
    updateAIStatus(nextAI.id, { isTyping: true });
    setIsGenerating(true);

    generateResponseMutation.mutate({
      aiModelId: nextAI.id,
      messages: currentSession.messages,
      topic: currentSession.topic,
      mode: currentSession.mode
    });
  };

  const handleStartConversation = (topic: string, mode: ConversationMode, selectedAIs: string[]) => {
    startConversationMutation.mutate({ topic, mode, selectedAIs });
  };

  const handleEndConversation = () => {
    endSession();
    setCurrentTurnAI(null);
    setIsGenerating(false);
  };

  const handlePauseResume = () => {
    if (isGenerating) {
      setIsGenerating(false);
      if (currentTurnAI) {
        updateAIStatus(currentTurnAI, { isTyping: false });
      }
      setCurrentTurnAI(null);
    } else {
      generateNextResponse();
    }
  };

  // Auto-stop conversation after 20 messages for demo
  useEffect(() => {
    if (currentSession && currentSession.messages.length >= 20) {
      setIsGenerating(false);
      setCurrentTurnAI(null);
    }
  }, [currentSession?.messages.length, currentSession]);

  const conversationStats = currentSession ? {
    totalMessages: currentSession.messages.length,
    participants: currentSession.participants.length,
    activeParticipants: currentSession.participants.filter(ai => ai.isActive).length,
    progress: Math.min((currentSession.messages.length / 20) * 100, 100) // Max 20 messages for demo
  } : null;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Topic & Control Panel */}
        <div className="lg:sticky lg:top-4 lg:h-fit lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto space-y-4 pb-4">
          {!currentSession ? (
            <TopicIntroductionPanel
              onStartConversation={handleStartConversation}
              availableAIs={availableAIs}
              isLoading={startConversationMutation.isPending}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-accent" />
                  <span>Session Control</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Topic</h3>
                  <p className="text-sm text-muted-foreground">{currentSession.topic}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{currentSession.mode.toUpperCase()}</Badge>
                  <Badge variant="outline">
                    {conversationStats?.activeParticipants}/{conversationStats?.participants} Active
                  </Badge>
                </div>

                {conversationStats && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{conversationStats.totalMessages}/20 messages</span>
                    </div>
                    <Progress value={conversationStats.progress} className="h-2" />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={handlePauseResume}
                    variant="outline"
                    className="flex-1"
                    disabled={generateResponseMutation.isPending}
                  >
                    {isGenerating ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleEndConversation}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Participants Grid */}
          {currentSession && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-accent" />
                  <span>Participants</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <AnimatePresence>
                    {currentSession.participants.map(ai => (
                      <motion.div
                        key={ai.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <AIPersonaCard
                          aiModel={ai}
                          isCurrentTurn={currentTurnAI === ai.id}
                          lastResponseTime={
                            currentSession.messages
                              .filter(m => m.aiModelId === ai.id)
                              .pop()?.responseTime
                          }
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Conversation Display */}
        <div className="lg:col-span-2 lg:min-h-screen">
          <ConversationDisplay
            session={currentSession}
            messages={currentSession?.messages || []}
            aiModels={currentSession?.participants || []}
            className="h-[calc(100vh-2rem)] lg:h-auto lg:min-h-[calc(100vh-2rem)]"
          />
        </div>
      </div>
    </div>
  );
}