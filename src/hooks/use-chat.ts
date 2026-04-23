import { useCallback, useState, useEffect } from 'react';
import { useChatStore } from '@/lib/store/chat-store';
import { reviewCode, getProviderStatus } from '@/lib/ai-providers';
import { Message } from '@/types/chat';
import { generateId, detectLanguage, isTechnicalQuery } from '@/lib/utils';

export function useChat() {
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

    let conversationId = currentConversationId;

    // Create new conversation if none exists
    if (!conversationId) {
      const newConv = createConversation();
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

    addMessage(conversationId, userMessage);
    
    // Local Intent Check
    if (!isTechnicalQuery(content)) {
      const refusalMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: "PROTOCOL_REFUSAL // I AM OPTIMIZED FOR TECHNICAL ANALYSIS AND CODE REVIEW. PLEASE PROVIDE A PROGRAMMING-RELATED QUERY OR CODE SNIPPET TO PROCEED.",
        timestamp: Date.now(),
      };
      setTimeout(() => {
        addMessage(conversationId, refusalMessage);
        setIsGenerating(false);
      }, 500);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get code review from AI
      const result = await reviewCode(content, model);
      setProviderStatus(getProviderStatus());

      // Add assistant response
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: result.review,
        timestamp: Date.now(),
      };

      addMessage(conversationId, assistantMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get code review';
      setError(errorMessage);
      setProviderStatus(getProviderStatus());

      // Add error message to conversation
      const errorMessageObj: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorMessage}\n\nTip: If rate limited, wait a moment and try again. The system will automatically fall back to alternative providers.`,
        timestamp: Date.now(),
      };

      addMessage(conversationId, errorMessageObj);
    } finally {
      setIsGenerating(false);
    }
  }, [currentConversationId, addMessage, createConversation]);

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
