import React from 'react';
import {
  MessageSquare,
  Compass,
  Database,
  BarChart2,
  FileText,
  FolderGit2,
  History,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
} from 'lucide-react';
import { NexaLogo } from './NexaLogo';
import { User, ProviderStatus } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  providerStatus?: ProviderStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
  user,
}) => {
  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: null },
    { id: 'research', label: 'Research', icon: Compass, badge: 'Deep' },
    { id: 'data', label: 'Global Data', icon: Database, badge: 'Catalog' },
    { id: 'analysis', label: 'Data Analysis', icon: BarChart2, badge: null },
    { id: 'files', label: 'Files', icon: FileText, badge: null },
    { id: 'projects', label: 'Projects', icon: FolderGit2, badge: null },
    { id: 'history', label: 'History', icon: History, badge: null },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-white/10 bg-[#070709] transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header: Logo + Toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
        {!isCollapsed && <NexaLogo size="sm" />}
        {isCollapsed && <NexaLogo size="sm" showTagline={false} className="justify-center mx-auto" />}

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Collapse open button if collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          className="mx-auto my-2 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* New Chat Primary Action */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-all shadow-md active:scale-98 ${
            isCollapsed ? 'p-2.5' : 'py-2.5 px-4 text-xs tracking-wide'
          }`}
          title="New Chat Session"
        >
          <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg text-xs font-medium transition-all group ${
                isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-zinc-800/90 text-white border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Area: Settings & Profile */}
      <div className="p-2.5 border-t border-white/5 space-y-1">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors ${
            isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
          } ${currentView === 'settings' ? 'bg-zinc-800 text-white' : ''}`}
          title="Settings & Privacy"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>

        {/* User Card */}
        {user && (
          <div
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-900/80 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-white overflow-hidden shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-medium text-white truncate">{user.name}</div>
                <div className="text-[10px] text-zinc-500 truncate font-mono">{user.email}</div>
              </div>
            )}
            {!isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
          </div>
        )}
      </div>
    </aside>
  );
};
