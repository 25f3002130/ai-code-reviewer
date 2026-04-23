'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useChatStore } from '@/lib/store/chat-store';
import { useChat } from '@/hooks/use-chat';
import { ChatLayout } from '@/components/chat/chat-layout';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    createConversation,
    loadConversation,
    getConversations,
  } = useChatStore();

  const { sendMessage, isGenerating, error, clearError } = useChat();

  // Load or create conversation
  useEffect(() => {
    if (id === 'new') {
      const newConv = createConversation();
      router.replace(`/chat/${newConv.id}`, { scroll: false });
    } else {
      loadConversation(id);
      setCurrentConversation(id);
    }
  }, [id, createConversation, loadConversation, setCurrentConversation, router]);

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === id);

  const handleSend = (message: string) => {
    sendMessage(message);
  };

  const handleNewChat = () => {
    router.push('/chat/new');
  };

  const handleSelectConversation = (convId: string) => {
    router.push(`/chat/${convId}`);
  };

  return (
    <ChatLayout
      sidebar={null}
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
      currentConversationId={currentConversationId}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {currentConversation?.title || 'New Conversation'}
            </h1>
            <p className="text-sm text-gray-400">
              {currentConversation?.messages.length || 0} messages
            </p>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">
              Dismiss
            </button>
          </div>
        )}

        {/* Messages */}
        <ChatMessages
          messages={currentConversation?.messages || []}
          isLoading={isGenerating}
        />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isLoading={isGenerating}
        />
      </div>
    </ChatLayout>
  );
}
