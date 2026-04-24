'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useChatStore } from '@/lib/store/chat-store';
import { useChat } from '@/hooks/use-chat';
import { useRateLimit } from '@/hooks/use-rate-limit';
import { useAuth } from '@/lib/firebase/auth-context';
import { ChatLayout } from '@/components/chat/chat-layout';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import { UserMenu } from '@/components/chat/user-menu';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const processedIdRef = useRef<string | null>(null);
  const { user, loading } = useAuth();

  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    createConversation,
    loadConversation,
  } = useChatStore();

  const {
    sendMessage,
    isGenerating,
    error,
    clearError,
    providerStatus
  } = useChat();

  const { remaining, dailyLimit, hourlyLimit } = useRateLimit();

  // Redirect to sign-in if not authenticated (with a slight delay to allow auth state to resolve)
  useEffect(() => {
    if (!loading && !user) {
      const timeout = setTimeout(() => {
        if (!user) router.replace('/signin');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, router]);

  // Ensure user profile exists in Firestore
  useEffect(() => {
    const ensureUserProfile = async () => {
      if (!user || loading) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            name: user.displayName || 'Anonymous',
            email: user.email || '',
            provider: user.providerData[0]?.providerId || 'unknown',
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        // Silent fail
      }
    };

    ensureUserProfile();
  }, [user, loading]);

  // Load or create conversation
  useEffect(() => {
    if (!user) return;

    // Avoid double processing the same ID in the same mount cycle
    if (processedIdRef.current === id && id !== 'new') return;

    if (id === 'new') {
      // Only create if we haven't already initiated a creation in this mount
      if (processedIdRef.current !== 'new') {
        processedIdRef.current = 'new';
        const newConv = createConversation(user.uid);
        // Set a timeout or use replace immediately to move away from 'new'
        router.replace(`/chat/${newConv.id}`, { scroll: false });
      }
    } else {
      processedIdRef.current = id;
      loadConversation(id, user.uid);
      setCurrentConversation(id);
    }
  }, [id, createConversation, loadConversation, setCurrentConversation, router, user]);

  // Show loading while auth state is being determined
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === id);

  const handleSend = (message: string, model?: string) => {
    sendMessage(message, model);
  };

  const handleNewChat = () => {
    router.push('/chat/new');
  };

  const handleSelectConversation = (convId: string) => {
    router.push(`/chat/${convId}`);
  };

  return (
    <ChatLayout
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
      currentConversationId={currentConversationId}
    >
      <div className="flex-1 flex flex-col min-h-0 bg-black">
        {/* Chat header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 border-b-4 border-white bg-black">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
              SESS_LOG // {currentConversation?.title || 'NEW_SESSION'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1">
              MSG_COUNT: {currentConversation?.messages.length || 0}
            </p>
          </div>
          <UserMenu />
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-6 p-6 bg-black border-4 border-red-600 text-red-500 font-black text-xs shadow-[6px_6px_0px_0px_rgba(220,38,38,0.2)] flex items-center justify-between uppercase tracking-widest">
            <span>CRITICAL_ERROR // {error}</span>
            <button onClick={clearError} className="hover:text-white transition-colors underline">
              DISMISS
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
          providerStatus={providerStatus}
          quotaRemaining={{
            daily: remaining.daily,
            hourly: remaining.hourly,
            dailyLimit,
            hourlyLimit,
          }}
        />
      </div>
    </ChatLayout>
  );
}
