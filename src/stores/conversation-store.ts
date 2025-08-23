import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ConversationState, Session, Message, AIModel, ConversationMode } from '@/lib/types';

interface ConversationStore extends ConversationState {
  // Actions
  createSession: (topic: string, mode: ConversationMode, participants: AIModel[]) => void;
  addMessage: (message: Message) => void;
  setCurrentTurn: (aiModelId: string | null) => void;
  markAIAsUsed: (aiModelId: string) => void;
  resetUsedAIs: () => void;
  incrementRound: () => void;
  updateAIStatus: (aiModelId: string, updates: Partial<Pick<AIModel, 'isActive' | 'isTyping'>>) => void;
  endSession: () => void;
}

export const useConversationStore = create<ConversationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSession: null,
        isActive: false,
        currentTurn: null,
        usedAIsThisRound: new Set(),
        conversationRounds: 0,

        // Actions
        createSession: (topic, mode, participants) => {
          const session: Session = {
            id: crypto.randomUUID(),
            topic,
            mode,
            messages: [],
            participants,
            createdAt: new Date(),
            lastActivity: new Date()
          };

          set({
            currentSession: session,
            isActive: true,
            currentTurn: null,
            usedAIsThisRound: new Set(),
            conversationRounds: 0
          });
        },

        addMessage: (message) => {
          const state = get();
          if (!state.currentSession) return;

          const updatedSession = {
            ...state.currentSession,
            messages: [...state.currentSession.messages, message],
            lastActivity: new Date()
          };

          set({
            currentSession: updatedSession
          });
        },

        setCurrentTurn: (aiModelId) => {
          set({ currentTurn: aiModelId });
        },

        markAIAsUsed: (aiModelId) => {
          const state = get();
          const newUsedAIs = new Set(state.usedAIsThisRound);
          newUsedAIs.add(aiModelId);
          
          set({ usedAIsThisRound: newUsedAIs });
        },

        resetUsedAIs: () => {
          set({ usedAIsThisRound: new Set() });
        },

        incrementRound: () => {
          const state = get();
          set({ 
            conversationRounds: state.conversationRounds + 1,
            usedAIsThisRound: new Set()
          });
        },

        updateAIStatus: (aiModelId, updates) => {
          const state = get();
          if (!state.currentSession) return;

          const updatedParticipants = state.currentSession.participants.map(ai =>
            ai.id === aiModelId ? { ...ai, ...updates } : ai
          );

          const updatedSession = {
            ...state.currentSession,
            participants: updatedParticipants
          };

          set({ currentSession: updatedSession });
        },

        endSession: () => {
          set({
            currentSession: null,
            isActive: false,
            currentTurn: null,
            usedAIsThisRound: new Set(),
            conversationRounds: 0
          });
        }
      }),
      {
        name: 'conversation-store',
        partialize: (state) => ({
          currentSession: state.currentSession,
          conversationRounds: state.conversationRounds
        })
      }
    ),
    { name: 'ConversationStore' }
  )
);