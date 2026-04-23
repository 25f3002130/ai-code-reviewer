export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  codeLanguage?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface CodeReviewResponse {
  review: string;
  issues: string[];
  suggestions: string[];
  codeQuality: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}
