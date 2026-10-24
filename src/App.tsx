/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LandingView } from './views/LandingView';
import { AuthView } from './views/AuthView';
import { ChatView } from './views/ChatView';
import { ResearchView } from './views/ResearchView';
import { GlobalDataView } from './views/GlobalDataView';
import { DataAnalysisView } from './views/DataAnalysisView';
import { FilesView } from './views/FilesView';
import { ProjectsView } from './views/ProjectsView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CommandPalette } from './components/CommandPalette';
import { api, getStoredToken, clearStoredToken } from './lib/api';
import { User, Conversation, Dataset, ProviderStatus } from './types';

export default function App() {
  // Navigation: 'landing' | 'auth' | 'app'
  const [appSection, setAppSection] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Workspaces within 'app': 'chat' | 'research' | 'data' | 'analysis' | 'files' | 'projects' | 'history' | 'settings'
  const [currentView, setCurrentView] = useState<string>('chat');

  const handleNavigateView = (view: string) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      const url = view === 'chat' ? '/app' : `/app/${view}`;
      window.history.replaceState(null, '', url);
    }
  };

  // Application State
  const [user, setUser] = useState<User | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeModel, setActiveModel] = useState<string>('NEXA Auto');
  const [analysisDataset, setAnalysisDataset] = useState<Dataset | null>(null);

  // Layout UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Initialize Auth & Status
  useEffect(() => {
    // Check provider status
    api.chat
      .getProviderStatus()
      .then(setProviderStatus)
      .catch((err) => console.error('Provider status fetch error:', err));

    // Check stored user session
    const token = getStoredToken();
    if (token) {
      api.auth
        .me()
        .then((res) => {
          setUser(res.user);
          setActiveModel(res.user.modelPreference || 'NEXA Auto');
        })
        .catch(() => {
          // Token invalid or expired
          clearStoredToken();
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  const handleStartCreating = () => {
    if (user) {
      setAppSection('app');
    } else {
      setAuthMode('register');
      setAppSection('auth');
    }
  };

  const handleOpenLogin = () => {
    setAuthMode('login');
    setAppSection('auth');
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveModel(authenticatedUser.modelPreference || 'NEXA Auto');
    setAppSection('app');
    setCurrentView('chat');
  };

  const handleLogout = () => {
    clearStoredToken();
    api.auth.logout().catch(() => {});
    setUser(null);
    setAppSection('landing');
  };

  const handleNewChat = () => {
    setActiveConversation(null);
    setCurrentView('chat');
    setIsMobileSidebarOpen(false);
  };

  const handleUseDatasetInAnalysis = (dataset: Dataset) => {
    setAnalysisDataset(dataset);
    setCurrentView('analysis');
  };

  const handleOpenConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setCurrentView('chat');
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#050505] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      {/* 1. Landing View */}
      {appSection === 'landing' && (
        <LandingView onStart={handleStartCreating} onLogin={handleOpenLogin} />
      )}

      {/* 2. Authentication View */}
      {appSection === 'auth' && (
        <AuthView
          initialMode={authMode}
          onSuccess={handleAuthSuccess}
          onBackToHome={() => setAppSection('landing')}
        />
      )}

      {/* 3. Main Workspace Application Layout */}
      {appSection === 'app' && (
        <div className="flex-1 flex h-full overflow-hidden">
          {/* Desktop Left Sidebar */}
          <div className="hidden md:flex h-full shrink-0">
            <Sidebar
              currentView={currentView}
              onNavigate={(v) => setCurrentView(v)}
              onNewChat={handleNewChat}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              user={user}
              providerStatus={providerStatus}
            />
          </div>

          {/* Mobile Drawer Sidebar */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <div className="relative z-10 w-72 h-full bg-[#070709] border-r border-white/10 flex flex-col">
                <Sidebar
                  currentView={currentView}
                  onNavigate={(v) => {
                    setCurrentView(v);
                    setIsMobileSidebarOpen(false);
                  }}
                  onNewChat={handleNewChat}
                  isCollapsed={false}
                  onToggleCollapse={() => setIsMobileSidebarOpen(false)}
                  user={user}
                  providerStatus={providerStatus}
                />
              </div>
            </div>
          )}

          {/* Center Main Workspace Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <Navbar
              currentView={currentView}
              activeModel={activeModel}
              onSelectModel={setActiveModel}
              activeTitle={activeConversation?.title}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
              onShare={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Session link copied to clipboard.');
              }}
              activeProviderName={providerStatus?.activeProviderName}
            />

            {/* View Switcher */}
            <main className="flex-1 flex overflow-hidden">
              {currentView === 'chat' && (
                <ChatView
                  activeConversation={activeConversation}
                  activeModel={activeModel}
                  onSelectModel={setActiveModel}
                  onConversationCreated={(conv) => setActiveConversation(conv)}
                  onNavigateToWorkspace={(v) => setCurrentView(v)}
                />
              )}

              {currentView === 'research' && <ResearchView />}

              {currentView === 'data' && (
                <GlobalDataView onUseInAnalysis={handleUseDatasetInAnalysis} />
              )}

              {currentView === 'analysis' && (
                <DataAnalysisView initialDataset={analysisDataset} />
              )}

              {currentView === 'files' && <FilesView />}

              {currentView === 'projects' && (
                <ProjectsView
                  onOpenConversation={handleOpenConversation}
                  onNavigateToWorkspace={(v) => setCurrentView(v)}
                />
              )}

              {currentView === 'history' && (
                <HistoryView onSelectConversation={handleOpenConversation} />
              )}

              {currentView === 'settings' && user && (
                <SettingsView
                  user={user}
                  providerStatus={providerStatus}
                  onUpdateUser={setUser}
                  onLogout={handleLogout}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(v) => {
          setAppSection('app');
          setCurrentView(v);
        }}
        onNewChat={() => {
          setAppSection('app');
          handleNewChat();
        }}
      />
    </div>
  );
}
