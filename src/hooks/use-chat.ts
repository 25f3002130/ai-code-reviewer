import { useCallback, useState, useEffect } from 'react';
import { useChatStore } from '@/lib/store/chat-store';
import { useAuth } from '@/lib/firebase/auth-context';
import { reviewCode, getProviderStatus } from '@/lib/ai-providers/client';
import { CodeReviewResult } from '@/lib/ai-providers/types';
import { Message } from '@/types/chat';
import { generateId, detectLanguage, isTechnicalQuery } from '@/lib/utils';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export function useChat() {
  const { user } = useAuth();
  const {
    currentConversationId,
    addMessage,
    createConversation,
  } = useChatStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState(getProviderStatus());

  // Update status periodically if limited
  useEffect(() => {
    const hasLimited = providerStatus.some(p => !p.available);
    if (!hasLimited) return;

    const interval = setInterval(() => {
      setProviderStatus(getProviderStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, [providerStatus]);

  const sendMessage = useCallback(async (content: string, model?: string) => {
    if (!content.trim()) return;
    if (!user) {
      setError('You must be logged in to send messages');
      return;
    }

    let conversationId = currentConversationId;

    // Create new conversation if none exists
    if (!conversationId) {
      const newConv = createConversation(user.uid);
      conversationId = newConv.id;
    }

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      codeLanguage: detectLanguage(content),
    };

    addMessage(conversationId, userMessage, user.uid);

    // Local Intent Check
    if (!isTechnicalQuery(content)) {
      const refusalMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: "PROTOCOL_REFUSAL // I AM OPTIMIZED FOR TECHNICAL ANALYSIS AND CODE REVIEW. PLEASE PROVIDE A PROGRAMMING-RELATED QUERY OR CODE SNIPPET TO PROCEED.",
        timestamp: Date.now(),
      };
      setTimeout(() => {
        addMessage(conversationId, refusalMessage, user.uid);
        setIsGenerating(false);
      }, 500);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get code review from AI (with user rate limiting)
      const result = await reviewCode(content, user.uid);
      setProviderStatus(getProviderStatus());

      // Add assistant response
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: result.review,
        timestamp: Date.now(),
      };

      addMessage(conversationId, assistantMessage, user.uid);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get code review';
      setError(errorMessage);
      setProviderStatus(getProviderStatus());

      // Add error message to conversation
      const errorMessageObj: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorMessage}\n\n${errorMessage.includes('limit') ? 'Your personal rate limit helps ensure fair usage for all 1000+ users. Wait for the limit to reset, then try again.' : 'Tip: If rate limited, wait a moment and try again.'}`,
        timestamp: Date.now(),
      };

      addMessage(conversationId, errorMessageObj, user.uid);
    } finally {
      setIsGenerating(false);
    }
  }, [currentConversationId, addMessage, createConversation, user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentConversationId,
    isGenerating,
    error,
    providerStatus,
    sendMessage,
    clearError,
  };
}
