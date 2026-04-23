'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/store/chat-store';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2, ChevronLeft } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  currentConversationId: string | null;
}

export function ChatSidebar({
  isOpen,
  onClose,
  onSelectConversation,
  onNewChat,
  currentConversationId,
}: ChatSidebarProps) {
  const { conversations, getConversations, deleteConversation } = useChatStore();

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-slate-900 border-r border-white/10
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <Button
            onClick={onNewChat}
            className="w-full justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </Button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <GlassCard
                key={conv.id}
                hover
                className={`
                  p-3 cursor-pointer group
                  ${conv.id === currentConversationId ? 'bg-white/20 border-white/30' : ''}
                `}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {conv.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(conv.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Mobile close button */}
        <div className="p-4 border-t border-white/10 lg:hidden">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Close
          </Button>
        </div>
      </aside>
    </>
  );
}
