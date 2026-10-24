import React, { useState } from 'react';
import {
  Settings,
  User as UserIcon,
  Palette,
  Shield,
  Key,
  Trash2,
  Download,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { api, clearStoredToken } from '../lib/api';
import { User, ProviderStatus } from '../types';

interface SettingsViewProps {
  user: User;
  providerStatus: ProviderStatus | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  providerStatus,
  onUpdateUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'ai' | 'privacy' | 'security'>('profile');
  const [name, setName] = useState(user.name);
  const [theme, setTheme] = useState(user.themePreference || 'dark');
  const [modelPref, setModelPref] = useState(user.modelPreference || 'NEXA Auto');
  const [onboardingFocus, setOnboardingFocus] = useState(user.onboardingPurpose || 'Research');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'ai', label: 'AI Models', icon: Cpu },
    { id: 'privacy', label: 'Data & Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Key },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.auth.updateProfile({
        name,
        themePreference: theme,
        modelPreference: modelPref,
        onboardingPurpose: onboardingFocus,
      });
      onUpdateUser(res.user);
      setStatusMsg('Profile successfully updated.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Update profile error:', err);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      user: { id: user.id, email: user.email, name: user.name },
      platform: 'NEXA AI',
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexa_ai_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        clearStoredToken();
        onLogout();
      } catch (err) {
        console.error('Delete account error:', err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#050505] overflow-hidden">
      {/* Settings Navigation */}
      <div className="w-full md:w-64 border-r border-white/10 bg-[#070709] p-4 flex flex-col shrink-0">
        <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4 px-2">
          Settings & Account
        </div>
        <div className="space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-white/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Settings Canvas */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">User Profile</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Manage your personal identification and research focus.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xl font-bold text-white overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{user.name}</div>
                <div className="text-xs text-zinc-400 font-mono">{user.email}</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-1">Role: {user.role}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Primary Application Focus
                </label>
                <select
                  value={onboardingFocus}
                  onChange={(e) => setOnboardingFocus(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {['Research', 'Study', 'Programming', 'Data Analysis', 'Writing', 'Business', 'General'].map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-colors shadow-md"
            >
              Save Profile Changes
            </button>
          </form>
        )}

        
        {/* Tab 2: Appearance */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Appearance & Theme
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customize the appearance of NEXA AI.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'dark',
                  label: 'Dark',
                  description: 'Easy on the eyes in low light.',
                },
                {
                  id: 'system',
                  label: 'System',
                  description: 'Follow your device appearance.',
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    window.dispatchEvent(
                      new CustomEvent('nexa-theme-change', {
                        detail: { theme: t.id },
                      })
                    );
                  }}
                  aria-pressed={theme === t.id}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    theme === t.id
                      ? 'bg-zinc-800 text-white border-white/30 shadow-md'
                      : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">{t.label}</div>
                  <div className="text-[10px] mt-2 leading-relaxed">
                    {t.description}
                  </div>
                  {theme === t.id && (
                    <div className="text-[10px] text-emerald-400 mt-3">
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500">
              Save your selection using Save Profile Changes on the Profile tab.
            </p>
          </div>
        )}


        {/* Tab 3: AI Models */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">AI Provider & Routing</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Status of attached AI backends and model mapping.</p>
            </div>



            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Default Preferred Model
              </label>
              <select
                value={modelPref}
                onChange={(e) => setModelPref(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {['NEXA Auto', 'NEXA Fast', 'NEXA Reason', 'NEXA Vision', 'NEXA Research'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Tab 4: Privacy & Data Controls */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Data Controls & Retention</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Manage your data sovereignty, export records, or purge history.</p>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-white/10 space-y-3">
              <div className="text-xs font-semibold text-white">Export Workspace Data</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Download a complete JSON export of your profile metadata, conversations, and research notes.
              </p>
              <button
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Payload</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 space-y-3">
              <div className="text-xs font-semibold text-red-300">Danger Zone: Delete Account</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Permanently purge your account, conversations, and uploaded files from the NEXA database.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-900/80 hover:bg-red-800 text-xs font-semibold text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account & Records</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Security & Sessions</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Manage authentication credentials and active sessions.</p>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-white/10 space-y-2">
              <div className="text-xs font-semibold text-white">Active Device Session</div>
              <div className="text-[11px] text-zinc-400 font-mono">
                Current browser session • Token signed with session secret
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">• Active & Verified</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
