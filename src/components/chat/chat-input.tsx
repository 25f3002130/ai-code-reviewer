'use client';

import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Zap, ChevronDown, AlertCircle } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, model?: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  providerStatus?: Array<{ name: string; available: boolean; resetAt?: number }>;
}

const MODELS = [
  { id: 'gemini', name: 'GEMINI_2.0' },
  { id: 'groq', name: 'GROQ_LLAMA_3.3' },
  { id: '', name: 'AUTO_FALLBACK' },
];

export function ChatInput({ 
  onSend, 
  isLoading = false, 
  disabled = false,
  providerStatus = []
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim(), selectedModel || undefined);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const limitedProviders = providerStatus.filter(p => !p.available);

  return (
    <div className="p-8 bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="relative group">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="INPUT SOURCE CODE..."
            disabled={disabled || isLoading}
            rows={4}
            className="
              w-full resize-none
              bg-zinc-900 border-2 border-zinc-800
              px-6 py-5 pb-16
              text-white placeholder-zinc-700
              focus:outline-none focus:border-white
              disabled:opacity-50 disabled:cursor-not-allowed
              font-mono text-sm font-bold
              transition-all
            "
          />

          {/* Model Selector Dropdown */}
          <div className="absolute left-4 bottom-4">
            <div className="relative inline-block">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading || disabled}
                className="
                  appearance-none bg-black border-2 border-zinc-800 
                  text-[10px] font-black uppercase tracking-widest text-zinc-500
                  px-3 py-1 pr-8
                  hover:border-white hover:text-white
                  focus:outline-none focus:border-white
                  cursor-pointer transition-all
                  rounded-none
                "
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
            </div>
          </div>

          <div className="absolute right-4 bottom-4 flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || isLoading || disabled}
              className="px-6 py-2.5 min-h-0 h-auto text-xs"
            >
              {isLoading ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-pulse mr-2" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-2" />
                  REVIEW
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dynamic Status / Rate Limit Alert */}
        <div className="mt-4 flex flex-col items-center gap-2">
          {limitedProviders.length > 0 ? (
            <div className="flex items-center gap-2 px-4 py-2 border-2 border-red-600 bg-red-950/20 text-red-500 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {`RATE_LIMIT_ACTIVE // ${limitedProviders.map(p => p.name.toUpperCase()).join(' & ')} // RETRY_SOON`}
              </span>
            </div>
          ) : (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              {`SYSTEM_STATUS: READY | AI_ENGINE: ACTIVE`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
