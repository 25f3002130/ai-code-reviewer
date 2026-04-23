'use client';

import { useState, ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatSidebar } from './chat-sidebar';

interface ChatLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  currentConversationId: string | null;
}

export function ChatLayout({
  children,
  sidebar,
  onNewChat,
  onSelectConversation,
  currentConversationId,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950">
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        currentConversationId={currentConversationId}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white">AI Code Reviewer</h1>
        </header>

        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
