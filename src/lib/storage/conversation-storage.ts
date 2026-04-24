'use client';

import { Conversation } from '@/types/chat';

const STORAGE_KEY = 'ai-code-reviewer-conversations';

function getUserStorageKey(userId: string): string {
  return `${STORAGE_KEY}-${userId}`;
}

export function saveConversation(conversation: Conversation, userId: string): void {
  try {
    const conversations = getAllConversations(userId);
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

export function getConversation(id: string, userId: string): Conversation | null {
  try {
    const conversations = getAllConversations(userId);
    return conversations.find(c => c.id === id && c.userId === userId) || null;
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return null;
  }
}

export function getAllConversations(userId: string): Conversation[] {
  try {
    const stored = localStorage.getItem(getUserStorageKey(userId));
    if (!stored) return [];
    return JSON.parse(stored) as Conversation[];
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return [];
  }
}

export function deleteConversation(id: string, userId: string): void {
  try {
    const conversations = getAllConversations(userId);
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete conversation:', error);
  }
}

export function clearAllConversations(userId: string): void {
  localStorage.removeItem(getUserStorageKey(userId));
}
