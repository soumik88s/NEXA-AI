import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../lib/api';
import { Conversation } from '../types';

interface HistoryViewProps {
  onSelectConversation: (conv: Conversation) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await api.chat.getConversations();
      setConversations(res.conversations || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.chat.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Delete conversation error:', err);
    }
  };

  const handleTogglePin = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.chat.updateConversation(conv.id, { isPinned: !conv.isPinned });
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, isPinned: res.conversation.isPinned } : c))
      );
    } catch (err) {
      console.error('Pin toggle error:', err);
    }
  };

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage?.content && c.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by date: Today, Yesterday, Previous 7 days, Older
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;

  const groups = {
    today: filtered.filter((c) => new Date(c.updatedAt).getTime() >= todayStart),
    yesterday: filtered.filter(
      (c) => new Date(c.updatedAt).getTime() >= yesterdayStart && new Date(c.updatedAt).getTime() < todayStart
    ),
    pastWeek: filtered.filter(
      (c) => new Date(c.updatedAt).getTime() >= weekStart && new Date(c.updatedAt).getTime() < yesterdayStart
    ),
    older: filtered.filter((c) => new Date(c.updatedAt).getTime() < weekStart),
  };

  const renderSection = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 px-1">{title}</div>
        <div className="space-y-2">
          {list.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className="p-4 rounded-xl glass-panel border border-white/5 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white group-hover:bg-zinc-800 transition-colors mt-0.5 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">{conv.title}</span>
                    {conv.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-[11px] text-zinc-400 mt-1 truncate max-w-xl">
                      {conv.lastMessage.content}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500 font-mono">
                    <span>{conv.model}</span>
                    <span>•</span>
                    <span>{conv.messageCount || 0} messages</span>
                    <span>•</span>
                    <span>{new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleTogglePin(conv, e)}
                  className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${
                    conv.isPinned ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                  title={conv.isPinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDelete(conv.id, e)}
                  className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1">
            <History className="w-4 h-4" />
            <span>CONVERSATION HISTORY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Previous AI Sessions</h1>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past conversations..."
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 font-sans"
          />
        </div>
      </div>

      {/* Sections */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500 font-mono">Loading conversation history...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-xs text-zinc-500">No matching conversations found.</div>
      ) : (
        <div className="space-y-6">
          {renderSection('Today', groups.today)}
          {renderSection('Yesterday', groups.yesterday)}
          {renderSection('Previous 7 Days', groups.pastWeek)}
          {renderSection('Older', groups.older)}
        </div>
      )}
    </div>
  );
};
