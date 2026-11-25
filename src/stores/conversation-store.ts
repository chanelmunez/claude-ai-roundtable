import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ConversationState, Session, Message, AIModel, SessionStatus } from '@/lib/types';

interface ConversationStore extends ConversationState {
  // Actions
  setSession: (session: Session) => void;
  addMessage: (message: Message) => void;
  setCurrentTurn: (aiModelId: string | null) => void;
  markAIAsUsed: (aiModelId: string) => void;
  resetUsedAIs: () => void;
  incrementRound: () => void;
  updateAIStatus: (aiModelId: string, updates: Partial<Pick<AIModel, 'isActive' | 'isTyping'>>) => void;
  updateSessionStatus: (status: SessionStatus) => void;
  endSession: () => void;
  clearSession: () => void;
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
        setSession: (session) => {
          set({
            currentSession: session,
            isActive: session.status === 'active',
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

        updateSessionStatus: (status) => {
          const state = get();
          if (!state.currentSession) return;

          set({
            currentSession: {
              ...state.currentSession,
              status
            },
            isActive: status === 'active'
          });
        },

        endSession: () => {
          set({
            isActive: false,
            currentTurn: null,
            usedAIsThisRound: new Set(),
            conversationRounds: 0
          });
        },

        clearSession: () => {
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
