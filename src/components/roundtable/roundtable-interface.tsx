'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TopicIntroductionPanel } from './topic-introduction-panel';
import { AIPersonaCard } from '@/components/ai-personas/ai-persona-card';
import { ConversationDisplay } from '@/components/conversation/conversation-display';
import { TopicBoard } from '@/components/roundtable/topic-board';
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
import type { ConversationMode, AIModel, Message, Session, SessionSummary } from '@/lib/types';

const deserializeSession = (session: Session): Session => ({
  ...session,
  createdAt: new Date(session.createdAt),
  lastActivity: new Date(session.lastActivity),
  messages: session.messages.map((message) => ({
    ...message,
    timestamp: new Date(message.timestamp)
  }))
});

const deserializeSummary = (summary: SessionSummary): SessionSummary => ({
  ...summary,
  createdAt: new Date(summary.createdAt),
  lastActivity: new Date(summary.lastActivity)
});

export function RoundtableInterface() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTurnAI, setCurrentTurnAI] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const {
    currentSession,
    isActive,
    setSession,
    addMessage,
    updateAIStatus,
    updateSessionStatus,
    endSession,
    clearSession
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

  // Fetch saved sessions from the backend
  const {
    data: storedSessions = [],
    isLoading: sessionsLoading,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['roundtable-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/roundtable/sessions', {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Failed to load saved sessions');
      const data = await response.json();
      return (data.sessions as SessionSummary[]).map(deserializeSummary);
    },
    refetchInterval: 15000
  });

  const loadSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/roundtable/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load session');
      return response.json();
    },
    onSuccess: (data) => {
      const hydratedSession = deserializeSession(data.session);
      setSession(hydratedSession);
      setIsGenerating(false);
      setCurrentTurnAI(null);
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
      const hydratedSession = deserializeSession(data.session);
      setSession(hydratedSession);
      queryClient.invalidateQueries({ queryKey: ['roundtable-sessions'] });
      // Start the conversation by selecting first AI
      setTimeout(() => {
        generateNextResponse();
      }, 1000);
    }
  });

  // Generate AI response mutation
  const generateResponseMutation = useMutation({
    mutationFn: async ({ aiModelId, messages, topic, mode, sessionId }: {
      aiModelId: string;
      messages: Message[];
      topic: string;
      mode: ConversationMode;
      sessionId: string;
    }) => {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModelId, messages, topic, mode, sessionId })
      });
      if (!response.ok) throw new Error('Failed to generate response');
      return response.json();
    },
    onSuccess: (response) => {
      // Add the new message
      const message: Message = {
        id: response.messageId || crypto.randomUUID(),
        content: response.content,
        aiModelId: response.aiModelId,
        timestamp: response.timestamp ? new Date(response.timestamp) : new Date(),
        responseTime: response.responseTime
      };
      
      addMessage(message);
      updateAIStatus(response.aiModelId, { isTyping: false });
      setCurrentTurnAI(null);
      
      queryClient.invalidateQueries({ queryKey: ['roundtable-sessions'] });

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
    if (!currentSession || !isActive || currentSession.status !== 'active') return;

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
      mode: currentSession.mode,
      sessionId: currentSession.id
    });
  };

  const handleStartConversation = (topic: string, mode: ConversationMode, selectedAIs: string[]) => {
    startConversationMutation.mutate({ topic, mode, selectedAIs });
  };

  const handleEndConversation = async () => {
    if (currentSession) {
      try {
        await fetch(`/api/roundtable/${currentSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'end_session' })
        });
        updateSessionStatus('completed');
        queryClient.invalidateQueries({ queryKey: ['roundtable-sessions'] });
      } catch (error) {
        console.error('Failed to end session', error);
      }
    }

    endSession();
    setCurrentTurnAI(null);
    setIsGenerating(false);
  };

  const handleResumeSession = async () => {
    if (!currentSession) return;
    try {
      await fetch(`/api/roundtable/${currentSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          data: { status: 'active' }
        })
      });
      updateSessionStatus('active');
      setIsGenerating(false);
      setTimeout(() => generateNextResponse(), 500);
      queryClient.invalidateQueries({ queryKey: ['roundtable-sessions'] });
    } catch (error) {
      console.error('Failed to resume session', error);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    loadSessionMutation.mutate(sessionId);
  };

  const handleArchiveSession = async (sessionId: string) => {
    try {
      await fetch(`/api/roundtable/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive_session' })
      });
      if (currentSession?.id === sessionId) {
        updateSessionStatus('archived');
        endSession();
        setIsGenerating(false);
      }
      queryClient.invalidateQueries({ queryKey: ['roundtable-sessions'] });
    } catch (error) {
      console.error('Failed to archive session', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/roundtable/${sessionId}`, { method: 'DELETE' });
      if (currentSession?.id === sessionId) {
        clearSession();
        setIsGenerating(false);
        setCurrentTurnAI(null);
      }
      queryClient.invalidateQueries({ queryKey: ['roundtable-sessions'] });
    } catch (error) {
      console.error('Failed to delete session', error);
    }
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
          <TopicIntroductionPanel
            onStartConversation={handleStartConversation}
            availableAIs={availableAIs}
            isLoading={startConversationMutation.isPending}
            className="shadow-sm"
          />

          {currentSession && (
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
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{currentSession.mode.toUpperCase()}</Badge>
                  <Badge variant="outline" className={`text-xs ${currentSession.status === 'active' ? 'border-emerald-300 text-emerald-600' : 'border-slate-300 text-slate-600'}`}>
                    {currentSession.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {conversationStats?.activeParticipants}/{conversationStats?.participants} Active
                  </Badge>
                </div>

                {conversationStats && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Message progress</span>
                      <span>{conversationStats.totalMessages}/20 messages</span>
                    </div>
                    <Progress value={conversationStats.progress} className="h-2" />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handlePauseResume}
                    variant="outline"
                    className="flex-1"
                    disabled={!isActive || currentSession.status !== 'active'}
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

                  {currentSession.status !== 'active' && (
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={handleResumeSession}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Reopen Topic
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <TopicBoard
            sessions={storedSessions}
            isLoading={sessionsLoading}
            onSelectSession={handleSelectSession}
            onArchiveSession={handleArchiveSession}
            onDeleteSession={handleDeleteSession}
            onRefresh={() => {
              void refetchSessions();
            }}
            activeSessionId={currentSession?.id}
          />

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
