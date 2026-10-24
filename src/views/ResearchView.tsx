import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  BookOpen,
  Clock,
  Layers,
} from 'lucide-react';
import { api } from '../lib/api';
import { ResearchSession } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const ResearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [pastSessions, setPastSessions] = useState<ResearchSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await api.research.list();
      setPastSessions(res.sessions || []);
      if (res.sessions && res.sessions.length > 0 && !activeSession) {
        setActiveSession(res.sessions[0]);
      }
    } catch (err: any) {
      console.error('Failed to load research sessions:', err);
    }
  };

  const handleStartResearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.research.start({ query: q });
      setActiveSession(res.session);
      setPastSessions((prev) => [res.session, ...prev.filter((s) => s.id !== res.session.id)]);
      setQuery('');
    } catch (err: any) {
      setError(err.message || 'Failed to complete research investigation');
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    'What are the major causes and quantifiable forcing agents of modern climate change?',
    'How do sovereign debt levels impact emerging market GDP growth trajectories?',
    'What are the proven clinical efficacy rates of universal health coverage interventions?',
    'What are the grid stability limits for high-penetration wind and solar energy systems?',
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#050505] overflow-hidden">
      {/* Left Column: Research Sessions Archive & New Query */}
      <div className="w-full md:w-80 border-r border-white/10 bg-[#070709] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-white tracking-wide">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>DEEP RESEARCH</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Empirical multi-source evidence gathering and synthesis.
          </p>
        </div>

        {/* Previous Investigations */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-zinc-500 px-2 py-1">
            Recent Syntheses
          </div>
          {pastSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">No previous research sessions.</div>
          ) : (
            pastSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  activeSession?.id === session.id
                    ? 'bg-zinc-800 text-white border border-white/15 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
                }`}
              >
                <div className="text-xs font-semibold line-clamp-1">{session.topic}</div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{session.sources?.length || 0} sources</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Research Content Canvas */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Research Input Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-[#070709]/60 backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
            <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
              Launch Empirical Investigation
            </label>
            <div className="flex items-center gap-2 glass-input rounded-xl p-1.5">
              <Search className="w-4 h-4 text-zinc-400 ml-2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartResearch()}
                placeholder="Enter research query (e.g. causes of climate change, macroeconomic debt thresholds)..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none px-2 py-1 font-sans"
              />
              <button
                onClick={() => handleStartResearch()}
                disabled={!query.trim() || loading}
                className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Suggested quick pills */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Suggested:</span>
              {suggestedQueries.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStartResearch(s)}
                  className="text-[11px] text-zinc-400 hover:text-white px-2.5 py-1 rounded-full bg-zinc-900 border border-white/5 hover:border-white/20 transition-colors truncate max-w-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Session Content */}
        <div className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-200 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
              <h3 className="text-base font-semibold text-white">Conducting Multi-Source Research</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Formulating semantic taxonomy, gathering authoritative sources from verified repositories, and demarcating scientific uncertainties...
              </p>
            </div>
          ) : activeSession ? (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Session Header */}
              <div className="border-b border-white/10 pb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] font-mono text-emerald-400 mb-3">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Intergovernmental Grounding</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {activeSession.topic}
                </h1>
                <p className="text-xs text-zinc-400 mt-2 font-mono">
                  Query: "{activeSession.query}"
                </p>
              </div>

              {/* Research Plan Timeline */}
              {activeSession.plan && activeSession.plan.length > 0 && (
                <div className="p-4 rounded-xl glass-panel border border-white/10">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Execution Plan & Verification Taxonomy</span>
                  </h3>
                  <div className="space-y-2">
                    {activeSession.plan.map((step) => (
                      <div key={step.step} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-zinc-500 mr-2">Step {step.step}:</span>
                          <span>{step.task}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Authoritative Sources Gathered */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Primary Gathered Evidence ({activeSession.sources?.length || 0})</span>
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {activeSession.sources?.map((source) => (
                    <div
                      key={source.id}
                      className="p-4 rounded-xl glass-panel border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-white hover:underline flex items-center gap-1.5"
                          >
                            <span>{source.title}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-400" />
                          </a>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                            <span className="text-zinc-200">{source.publisher}</span>
                            {source.date && <span>• {source.date}</span>}
                            <span>• Type: {source.sourceType}</span>
                            <span className="text-emerald-400">
                              • Reliability: {(source.reliability * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <blockquote className="mt-2.5 pl-3 border-l-2 border-zinc-700 text-xs text-zinc-300 italic">
                        "{source.excerpt}"
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesis Breakdown */}
              <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 border-b border-white/5 pb-3">
                  <Layers className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold">Consensus Synthesis & Findings</span>
                </div>

                <MarkdownRenderer content={activeSession.synthesis || ''} />
              </div>

              {/* Uncertainty Boundaries */}
              {activeSession.uncertainty && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200/90">
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Identified Margins of Uncertainty & Variance</span>
                  </div>
                  <p className="leading-relaxed text-zinc-300">{activeSession.uncertainty}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-zinc-500">
              Select or enter an empirical query above to initiate deep multi-source research.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
