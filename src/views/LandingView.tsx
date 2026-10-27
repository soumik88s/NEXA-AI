import React, { useState } from 'react';
import {
  MessageSquare,
  Compass,
  Database,
  BarChart2,
  FileText,
  Wrench,
  FolderGit2,
  Shield,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  Globe2,
  Layers,
  Code2,
} from 'lucide-react';
import { NexaLogo } from '../components/NexaLogo';

interface LandingViewProps {
  onStart: () => void;
  onLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart, onLogin }) => {
  const [demoInput, setDemoInput] = useState('Analyze global renewable energy shares and correlate with GDP');

  const capabilities = [
    {
      icon: MessageSquare,
      title: 'AI Chat Intelligence',
      desc: 'Multimodal conversational intelligence with streaming tokens, code execution, and modular model routing.',
    },
    {
      icon: Compass,
      title: 'Deep Research Engine',
      desc: 'Autonomous multi-step research synthesis with verified citations from official multilateral bodies.',
    },
    {
      icon: Database,
      title: 'Global Data Catalog',
      desc: 'Index and discover authoritative datasets from the World Bank, WHO, NASA, Eurostat, IMF, and NOAA.',
    },
    {
      icon: BarChart2,
      title: 'Real Data Analysis',
      desc: 'Zero-hallucination statistical profiling, missing-value analysis, duplicate detection, and reactive charts.',
    },
    {
      icon: FileText,
      title: 'Document & Vision Intelligence',
      desc: 'Upload CSV, JSON, TXT, PDF, and image assets for instant extraction, summarization, and query answering.',
    },
    {
      icon: Wrench,
      title: 'Modular Tool Framework',
      desc: 'Sandboxed calculators, code interpreters, dataset searchers, and visual chart generators.',
    },
    {
      icon: FolderGit2,
      title: 'Project Workspaces',
      desc: 'Organize related chats, source files, statistical datasets, and research sessions into unified projects.',
    },
    {
      icon: Shield,
      title: 'Security & Integrity',
      desc: 'Clear boundary separation between verified facts, AI synthesis, and analytical uncertainties.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-zinc-800 selection:text-white font-sans overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-white/[0.04] to-transparent blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[300px] bg-zinc-800/[0.03] blur-[100px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 h-16 border-b border-white/5 bg-[#050505]/70 backdrop-blur-xl px-6 max-w-7xl mx-auto flex items-center justify-between">
        <NexaLogo size="md" showTagline={false} />

        <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="#global-data" className="hover:text-white transition-colors">
            Global Data
          </a>
          <a href="#research" className="hover:text-white transition-colors">
            Research
          </a>
          <a href="#security" className="hover:text-white transition-colors">
            Security
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 border border-white/5 transition-all"
          >
            Sign In
          </button>
          <button
            onClick={onStart}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95"
          >
            Start Creating
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-5xl mx-auto text-center">
        {/* Release Tag */}
       

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          One Intelligence. <br />
          <span className="font-serif-display italic font-normal text-zinc-300">
            Every Possibility.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Think, research, analyze, create, and work with information in one intelligent workspace.
          Discover global datasets, run empirical data analysis, and conduct multi-source research.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-all shadow-xl active:scale-98"
          >
            <span>Start Creating</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#features"
            className="px-5 py-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 transition-all"
          >
            Explore Capabilities
          </a>
        </div>

        {/* Interactive Workspace Preview */}
        <div className="mt-14 rounded-2xl glass-panel border border-white/15 p-2 shadow-2xl overflow-hidden max-w-4xl mx-auto text-left">
          {/* Mock Window Controls */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-zinc-950/60">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            </div>
            <span className="text-[11px] font-mono text-zinc-500"></span>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
              
              
            </div>
          </div>

          {/* Mock Chat Output */}
          <div className="p-6 space-y-4 bg-[#08080a]/90">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-mono text-zinc-300 shrink-0">
                U
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-200 max-w-xl">
                Compare renewable energy shares from Eurostat with NASA surface temperature anomalies from 2020 to 2026.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black text-[10px] font-bold shrink-0">
                N
              </div>
              <div className="p-4 rounded-xl glass-panel-subtle border border-white/10 text-xs text-zinc-300 max-w-2xl space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 border-b border-white/5 pb-2">
                  <span className="text-white font-semibold">NEXA AI</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px]">Grounded: NASA GISS + Eurostat</span>
                </div>
                <p>
                  Cross-referencing verified data shows atmospheric surface temperature anomalies reaching{' '}
                  <strong className="text-white">+1.28°C</strong> in 2024, while European Union renewable electricity
                  shares crossed <strong className="text-white">52%</strong> in progressive grids (Denmark at 64.2%, Germany at 52.8%).
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                  <div className="p-2 rounded bg-zinc-900/60 border border-white/5">
                    <div className="text-[10px] text-zinc-500 font-mono">NASA GISS Anomaly</div>
                    <div className="text-sm font-semibold text-white mt-0.5">+1.22°C (2025)</div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-white/5">
                    <div className="text-[10px] text-zinc-500 font-mono">Eurostat Leader</div>
                    <div className="text-sm font-semibold text-white mt-0.5">Sweden (66.0%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Input Bar */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                className="flex-1 bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
              <button
                onClick={onStart}
                className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Core Systems</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
            Engineered for Precision, Grounding, and Speed.
          </h2>
          <p className="text-zinc-400 text-sm mt-3">
            Every module in NEXA AI works seamlessly together—connect chat insights directly to datasets, files, and research.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 w-fit text-zinc-300 group-hover:text-white group-hover:bg-zinc-800 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mt-4 tracking-wide">{cap.title}</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Global Data Showcase Section */}
      <section id="global-data" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Global Data System</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 tracking-tight">
              Authoritative Global Datasets, Indexed and Verifiable.
            </h2>
            <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
              Explore curated data records from the World Bank, World Health Organization, NASA Goddard Institute,
              IMF, NOAA, and Eurostat. Filter by geographic coverage, format (CSV, JSON, GeoJSON, Parquet, API),
              and launch directly into statistical analysis.
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                'Standardized schema definitions with typed column definitions',
                'One-click "Use in Analysis" pipeline loading',
                'Direct links to official public repositories and open licenses',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onStart}
              className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-all"
            >
              <span>Explore Data Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dataset Card Preview */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl glass-panel border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-white">World Development Indicators (WDI)</span>
                <span className="text-[10px]">

                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">
                Primary World Bank collection of cross-country development metrics covering 217 economies and 1,400+ indicators.
              </p>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500 font-mono">
                           
              </div>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-white">GISTEMP Surface Temperature Index</span>
                <span className="text-[10px]">
                
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">
                NASA Goddard Institute for Space Studies global surface temperature anomalies relative to the 1951-1980 baseline.
              </p>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500 font-mono">
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Grounding Section */}
      <section id="security" className="relative z-10 py-16 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="rounded-2xl glass-panel border border-white/10 p-8 sm:p-12 text-center max-w-4xl mx-auto">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-zinc-300">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Grounded AI. No Hallucinated Metrics.
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-3 max-w-xl mx-auto leading-relaxed">
            NEXA AI explicitly isolates empirical facts, AI syntheses, and margins of uncertainty. When analyzing
            datasets, every percentage, duplicate count, and outlier is calculated directly from your raw data.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={onStart}
              className="px-6 py-3 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl active:scale-98"
            >
              Get Started with NEXA AI
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6 max-w-7xl mx-auto border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <NexaLogo size="sm" showTagline={false} />
          <span></span>
        </div>
        <div className="flex items-center gap-6">
          <span>One Intelligence. Every Possibility.</span>
        </div>
      </footer>
    </div>
  );
};
