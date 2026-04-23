'use client';

import { Message } from '@/types/chat';
import { GlassCard } from '@/components/ui/glass-card';
import { FormattedMessage } from './chat-code-block';
import { User, Bot, Code2 } from 'lucide-react';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading = false }: ChatMessagesProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <GlassCard className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Ready to Review Code
          </h3>
          <p className="text-gray-400">
            Paste your code below and get instant AI-powered feedback on quality, bugs, and improvements.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}

          <GlassCard
            className={`
              max-w-[85%] lg:max-w-[75%] p-4
              ${message.role === 'user'
                ? 'bg-cyan-500/20 border-cyan-500/30'
                : 'bg-white/5 border-white/10'
              }
            `}
          >
            {message.role === 'user' ? (
              <div className="whitespace-pre-wrap text-gray-100 font-mono text-sm">
                {message.content}
              </div>
            ) : (
              <FormattedMessage content={message.content} />
            )}

            <div className={`text-xs text-gray-500 mt-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </GlassCard>

          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <GlassCard className="bg-white/5 border-white/10 p-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
