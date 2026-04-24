import { create } from 'zustand';
import { Conversation, Message } from '@/types/chat';
import { generateId, generateChatTitle } from '@/lib/utils';
import {
  saveConversation,
  getConversation,
  getAllConversations,
  deleteConversation,
} from '@/lib/storage/conversation-storage';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createConversation: (userId: string) => Conversation;
  loadConversation: (id: string, userId: string) => void;
  deleteConversation: (id: string, userId: string) => void;
  addMessage: (conversationId: string, message: Message, userId: string) => void;
  updateCurrentConversation: (conversation: Conversation, userId: string) => void;
  setCurrentConversation: (id: string | null) => void;
  getConversations: (userId: string) => Conversation[];
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,

  createConversation: (userId: string) => {
    const newConversation: Conversation = {
      id: generateId(),
      userId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveConversation(newConversation, userId);

    set(state => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: newConversation.id,
    }));

    return newConversation;
  },

  loadConversation: (id: string, userId: string) => {
    const conversation = getConversation(id, userId);
    if (conversation) {
      set(state => ({
        currentConversationId: id,
        conversations: state.conversations.some(c => c.id === id)
          ? state.conversations
          : [conversation, ...state.conversations],
      }));
    }
  },

  deleteConversation: (id: string, userId: string) => {
    deleteConversation(id, userId);

    set(state => ({
      conversations: state.conversations.filter(c => c.id !== id),
      currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
    }));
  },

  addMessage: (conversationId: string, message: Message, userId: string) => {
    set(state => {
      const updatedConversations = state.conversations.map(conv => {
        if (conv.id === conversationId) {
          const updatedMessages = [...conv.messages, message];

          // Update title if this is the first message
          let updatedTitle = conv.title;
          if (conv.messages.length === 0 && message.role === 'user') {
            updatedTitle = generateChatTitle(message.content);
          }

          return {
            ...conv,
            title: updatedTitle,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
        }
        return conv;
      });

      // Save to localStorage
      const updatedConversation = updatedConversations.find(c => c.id === conversationId);
      if (updatedConversation) {
        saveConversation(updatedConversation, userId);
      }

      return {
        conversations: updatedConversations.sort((a, b) => b.updatedAt - a.updatedAt),
      };
    });
  },

  updateCurrentConversation: (conversation: Conversation, userId: string) => {
    saveConversation(conversation, userId);

    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversation.id ? conversation : c
      ).sort((a, b) => b.updatedAt - a.updatedAt),
    }));
  },

  setCurrentConversation: (id: string | null) => {
    set({ currentConversationId: id });
  },

  getConversations: (userId: string) => {
    const stored = getAllConversations(userId);
    set({ conversations: stored.sort((a, b) => b.updatedAt - a.updatedAt) });
    return stored;
  },
}));
