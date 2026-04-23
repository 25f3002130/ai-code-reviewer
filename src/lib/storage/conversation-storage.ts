import { Conversation } from '@/types/chat';

const STORAGE_KEY = 'ai-code-reviewer-conversations';

export function saveConversation(conversation: Conversation): void {
  try {
    const conversations = getAllConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

export function getConversation(id: string): Conversation | null {
  try {
    const conversations = getAllConversations();
    return conversations.find(c => c.id === id) || null;
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return null;
  }
}

export function getAllConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Conversation[];
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return [];
  }
}

export function deleteConversation(id: string): void {
  try {
    const conversations = getAllConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete conversation:', error);
  }
}

export function clearAllConversations(): void {
  localStorage.removeItem(STORAGE_KEY);
}
