'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/store/chat-store';

export default function ChatRootPage() {
  const router = useRouter();
  const { createConversation } = useChatStore();
  const hasCreated = useRef(false);

  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;
    
    const newConv = createConversation();
    router.replace(`/chat/${newConv.id}`);
  }, [createConversation, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white border-t-transparent animate-spin"></div>
    </div>
  );
}
