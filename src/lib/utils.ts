export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function generateChatTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().slice(0, 50);
  return trimmed || 'New Conversation';
}

export function detectLanguage(code: string): string {
  if (code.includes('<?php')) return 'php';
  if (code.includes('function ') && code.includes('=>')) return 'javascript';
  if (code.includes('import ') && code.includes('from')) return 'javascript';
  if (code.includes('def ') || code.includes('import ')) return 'python';
  if (code.includes('func ') || code.includes('package ')) return 'go';
  if (code.includes('pub fn') || code.includes('let mut')) return 'rust';
  if (code.includes('public class') || code.includes('public static void')) return 'java';
  if (code.includes('#include') || code.includes('int main')) return 'cpp';
  if (code.includes('<!DOCTYPE html') || code.includes('<html')) return 'html';
  if (code.includes('{') && code.includes(':') && code.includes('}')) return 'json';
  return 'plaintext';
}
