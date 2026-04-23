import { useCallback, useState } from 'react';
import { useChatStore } from '@/lib/store/chat-store';
import { reviewCode } from '@/lib/huggingface/api';
import { Message } from '@/types/chat';
import { generateId, detectLanguage } from '@/lib/utils';

export function useChat() {
  const {
    currentConversationId,
    addMessage,
    updateCurrentConversation,
    createConversation,
  } = useChatStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
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
    setIsGenerating(true);
    setError(null);

    try {
      // Get code review from AI
      const result = await reviewCode(content);

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

      // Add error message to conversation
      const errorMessageObj: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
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
    sendMessage,
    clearError,
  };
}
