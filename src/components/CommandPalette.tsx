import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  Compass,
  Database,
  FileText,
  BarChart2,
  FolderGit2,
  Settings,
  Plus,
  ArrowRight,
  Calculator,
  Wand2,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onNewChat: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNewChat,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    {
      id: 'new-chat',
      title: 'New Chat Session',
      category: 'Actions',
      icon: Plus,
      run: () => {
        onNewChat();
        onClose();
      },
    },
    {
      id: 'chat',
      title: 'AI Chat Workspace',
      category: 'Navigation',
      icon: MessageSquare,
      run: () => {
        onNavigate('chat');
        onClose();
      },
    },
    {
      id: 'research',
      title: 'Deep Research Workspace',
      category: 'Navigation',
      icon: Compass,
      run: () => {
        onNavigate('research');
        onClose();
      },
    },
    {
      id: 'data',
      title: 'Global Data Discovery Catalog',
      category: 'Navigation',
      icon: Database,
      run: () => {
        onNavigate('data');
        onClose();
      },
    },
    {
      id: 'analysis',
      title: 'Data Analysis & Charting',
      category: 'Navigation',
      icon: BarChart2,
      run: () => {
        onNavigate('analysis');
        onClose();
      },
    },
    {
      id: 'files',
      title: 'File Intelligence & Multimodal',
      category: 'Navigation',
      icon: FileText,
      run: () => {
        onNavigate('files');
        onClose();
      },
    },
    {
      id: 'projects',
      title: 'Projects & Workspaces',
      category: 'Navigation',
      icon: FolderGit2,
      run: () => {
        onNavigate('projects');
        onClose();
      },
    },
    // Tools category
    {
      id: 'tool-data-analyzer',
      title: 'Tool: Data Analyzer (Quality, Outliers, Distributions)',
      category: 'Tools',
      icon: BarChart2,
      run: () => {
        onNavigate('analysis');
        onClose();
      },
    },
    {
      id: 'tool-calculator',
      title: 'Tool: Calculator & Math Symbolic Engine',
      category: 'Tools',
      icon: Calculator,
      run: () => {
        onNavigate('chat');
        onClose();
      },
    },
    {
      id: 'tool-research',
      title: 'Tool: Multilateral Research & Synthesis',
      category: 'Tools',
      icon: Compass,
      run: () => {
        onNavigate('research');
        onClose();
      },
    },
    {
      id: 'tool-file-analysis',
      title: 'Tool: File Analysis & Document Vision',
      category: 'Tools',
      icon: FileText,
      run: () => {
        onNavigate('files');
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'Settings & Security',
      category: 'Navigation',
      icon: Settings,
      run: () => {
        onNavigate('settings');
        onClose();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl glass-panel border border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-zinc-950/60">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Type a command or search workspace... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">No matching commands found.</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.run}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-zinc-800/90 text-white border border-white/15'
                      : 'text-zinc-300 hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSelected ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.category}</div>
                    </div>
                  </div>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/5 bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Navigate with ↑ / ↓</span>
          <span>Select with ↵</span>
        </div>
      </div>
    </div>
  );
};
