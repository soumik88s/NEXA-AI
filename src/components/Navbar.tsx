import React from 'react';
import { Search, Share2, Menu } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface NavbarProps {
  currentView: string;
  activeModel: string;
  onSelectModel: (model: string) => void;
  activeTitle?: string;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar: () => void;
  onShare?: () => void;
  activeProviderName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeModel,
  onSelectModel,
  activeTitle,
  onOpenCommandPalette,
  onToggleMobileSidebar,
  onShare,
  activeProviderName,
}) => {
  const getWorkspaceTitle = () => {
    switch (currentView) {
      case 'chat':
        return activeTitle || 'AI Chat Workspace';
      case 'research':
        return 'Deep Research Workspace';
      case 'data':
        return 'Global Data Catalog';
      case 'analysis':
        return 'Data Analysis & Profiling';
      case 'files':
        return 'File Intelligence & Vision';
      case 'projects':
        return 'Projects & Workspaces';
      case 'history':
        return 'Conversation Archive';
      case 'settings':
        return 'Account & Preferences';
      default:
        return 'NEXA AI Workspace';
    }
  };

  return (
    <header className="h-14 border-b border-white/10 bg-[#070709]/80 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Mobile hamburger + Model Selector or View Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {currentView === 'chat' ? (
          <ModelSelector
            currentModel={activeModel}
            onSelectModel={onSelectModel}
            activeProviderName={activeProviderName}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tracking-wide">{getWorkspaceTitle()}</span>
          </div>
        )}

        {currentView === 'chat' && activeTitle && (
          <span className="hidden md:inline-block text-xs text-zinc-400 font-medium truncate max-w-xs pl-2 border-l border-white/10">
            {activeTitle}
          </span>
        )}
      </div>

      {/* Right: Command Search trigger + Share */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 text-xs text-zinc-400 transition-colors shadow-sm"
          title="Open command palette (Ctrl+K or Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Search or command...</span>
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-white/10 text-zinc-400">
            ⌘K
          </kbd>
        </button>

        {currentView === 'chat' && onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 transition-colors"
            title="Share session"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </div>
    </header>
  );
};
