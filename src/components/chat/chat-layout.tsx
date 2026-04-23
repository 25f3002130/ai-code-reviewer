'use client';

import { useState, ReactNode } from 'react';
import { Menu } from 'lucide-react';

import { ChatSidebar } from './chat-sidebar';
import { UserMenu } from './user-menu';

interface ChatLayoutProps {
  children: ReactNode;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  currentConversationId: string | null;
}

export function ChatLayout({
  children,
  onNewChat,
  onSelectConversation,
  currentConversationId,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-black">
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        currentConversationId={currentConversationId}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b-2 border-white bg-black">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 border-2 border-white text-white hover:bg-white hover:text-black transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-black uppercase tracking-tighter text-white">ZINC×NH</h1>
          </div>
          <UserMenu />
        </header>

        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
