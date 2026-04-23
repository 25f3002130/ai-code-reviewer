'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/store/chat-store';

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
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-80 bg-black border-r-4 border-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-zinc-800">
          <Button
            onClick={onNewChat}
            className="w-full justify-center py-8 text-sm font-black uppercase tracking-[0.2em] border-4"
          >
            <Plus className="w-6 h-6 mr-3" />
            CREATE_NEW_SESSION
          </Button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="px-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">SESSIONS_LOG</h2>
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-zinc-700">
              <MessageSquare className="w-16 h-16 mx-auto mb-6 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">LOG_EMPTY</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
                className="cursor-pointer group"
              >
                <div
                  className={`
                    p-5 border-4 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
                    ${conv.id === currentConversationId
                      ? 'bg-white border-white text-black'
                      : 'bg-black border-white text-white hover:bg-zinc-900'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-black uppercase tracking-widest truncate">
                        {conv.title.toUpperCase() || 'UNTITLED_SESSION'}
                      </h3>
                      <p className={`text-[9px] font-bold mt-2 ${conv.id === currentConversationId ? 'text-zinc-600' : 'text-zinc-500'}`}>
                        {formatTimestamp(conv.updatedAt).toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className={`transition-colors p-1 ${conv.id === currentConversationId ? 'hover:text-red-600' : 'hover:text-red-500'}`}
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Affiliation */}
        <div className="p-6 border-t-2 border-zinc-900 bg-zinc-950/50">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 text-center">
            MADE BY NILGIRI HOUSE // IIT MADRAS
          </p>
        </div>

        {/* Mobile close button */}
        <div className="p-6 border-t-2 border-zinc-800 lg:hidden">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full justify-center py-4"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            DISMISS
          </Button>
        </div>
      </aside>
    </>
  );
}
