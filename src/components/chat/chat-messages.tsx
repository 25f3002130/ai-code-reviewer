'use client';

import { Message } from '@/types/chat';

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
        <div className="p-12 text-center max-w-md bg-black border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
          <div className="w-20 h-20 bg-white flex items-center justify-center mx-auto mb-8">
            <Code2 className="w-10 h-10 text-black" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">
            READY FOR REVIEW
          </h3>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
            INPUT CODE BELOW. 
            AI ANALYSIS INITIALIZED.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'assistant' && (
            <div className="w-10 h-10 bg-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-black" />
            </div>
          )}

          <div
            className={`
              max-w-[85%] lg:max-w-[75%] p-8 border-4
              ${message.role === 'user'
                ? 'bg-zinc-900 border-zinc-700 text-white'
                : 'bg-black border-white text-white shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)]'
              }
            `}
          >
            {message.role === 'user' ? (
              <div className="whitespace-pre-wrap font-mono text-sm font-bold">
                {message.content}
              </div>
            ) : (
              <div className="font-bold">
                <FormattedMessage content={message.content} />
              </div>
            )}

            <div className={`text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>

          {message.role === 'user' && (
            <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-zinc-400" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-4 justify-start">
          <div className="w-10 h-10 bg-white flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-black" />
          </div>
          <div className="bg-black border-2 border-white p-6 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-zinc-700 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
