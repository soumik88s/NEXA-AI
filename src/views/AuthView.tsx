import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { NexaLogo } from '../components/NexaLogo';
import { api, setStoredToken } from '../lib/api';
import { User } from '../types';

interface AuthViewProps {
  initialMode?: 'login' | 'register' | 'forgot' | 'reset';
  onSuccess: (user: User) => void;
  onBackToHome: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onSuccess,
  onBackToHome,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [onboardingPurpose, setOnboardingPurpose] = useState('Research');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const purposeOptions = [
    'Research',
    'Study',
    'Programming',
    'Data Analysis',
    'Writing',
    'Business',
    'General',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.auth.login({ email, password });
        setStoredToken(res.token);
        onSuccess(res.user);
      } else if (mode === 'register') {
        const res = await api.auth.register({
          email,
          name,
          password,
          onboardingPurpose,
        });
        setStoredToken(res.token);
        onSuccess(res.user);
      } else if (mode === 'forgot') {
        const res = await api.auth.forgotPassword(email);
        setInfoMessage(res.message);
      } else if (mode === 'reset') {
        const res = await api.auth.resetPassword({ token: resetToken, newPassword: password });
        setInfoMessage(res.message);
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex items-center justify-center p-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl glass-panel border border-white/10 p-8 shadow-2xl relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <NexaLogo size="sm" />
          <button
            onClick={onBackToHome}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        {/* Mode Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' && 'Sign in to NEXA AI'}
            {mode === 'register' && 'Create your NEXA Account'}
            {mode === 'forgot' && 'Reset your Password'}
            {mode === 'reset' && 'Set New Password'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login' && 'Enter your credentials or use Instant Demo to explore.'}
            {mode === 'register' && 'Set up your intelligent workspace in seconds.'}
            {mode === 'forgot' && 'Enter your verified account email to recover access.'}
            {mode === 'reset' && 'Choose a strong password to secure your account.'}
          </p>
        </div>

        {/* Alert / Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Vance"
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && (
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.vance@institution.org"
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste reset token here"
                className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          )}

          {/* Onboarding Purpose Selection on Register */}
          {mode === 'register' && (
            <div className="pt-2">
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Primary Application Focus
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {purposeOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOnboardingPurpose(opt)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] text-left transition-colors border ${
                      onboardingPurpose === opt
                        ? 'bg-white text-black font-semibold border-white'
                        : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-all shadow-md active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot' && 'Send Recovery Email'}
                  {mode === 'reset' && 'Reset Password'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-white font-medium hover:underline ml-1"
              >
                Sign up
              </button>
            </>
          )}

          {mode === 'register' && (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-white font-medium hover:underline ml-1"
              >
                Sign in
              </button>
            </>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              onClick={() => setMode('login')}
              className="text-white font-medium hover:underline"
            >
              Back to Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
