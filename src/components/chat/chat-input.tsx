'use client';

import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading = false, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-white/10 p-4 bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your code here for review... (Shift+Enter for new line)"
            disabled={disabled || isLoading}
            rows={4}
            className="
              w-full resize-none
              bg-white/5 border border-white/10 rounded-xl
              px-4 py-3 pr-32
              text-gray-100 placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              font-mono text-sm
            "
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || isLoading || disabled}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Reviewing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Review
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          AI-powered code reviews only. Paste code or ask code-related questions.
        </p>
      </div>
    </div>
  );
}
