import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, Brain, Cpu, Eye, Compass, Check, ShieldCheck } from 'lucide-react';

export interface ModelInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  speed: 'Ultra Fast' | 'Fast' | 'Standard' | 'Deep';
  speedBars: number;
  icon: any;
  capabilities: string[];
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'NEXA Auto',
    name: 'NEXA Auto',
    tagline: 'Adaptive Intelligence',
    description: 'Dynamic intent routing optimizing latency and reasoning depth automatically.',
    speed: 'Fast',
    speedBars: 4,
    icon: Cpu,
    capabilities: ['General Query', 'Synthesis', 'Multimodal', 'Code'],
  },
  {
    id: 'NEXA Fast',
    name: 'NEXA Fast',
    tagline: 'Low Latency Stream',
    description: 'High-throughput stream processing for rapid inquiries, edits, and drafting.',
    speed: 'Ultra Fast',
    speedBars: 5,
    icon: Zap,
    capabilities: ['Instant Speed', 'Summarization', 'Translation', 'Extraction'],
  },
  {
    id: 'NEXA Reason',
    name: 'NEXA Reason',
    tagline: 'Deep Step-by-Step Logic',
    description: 'Advanced logical reasoning, mathematical formulation, and multi-step algorithms.',
    speed: 'Standard',
    speedBars: 3,
    icon: Brain,
    capabilities: ['Complex Math', 'Data Analysis', 'Formal Logic', 'System Architecture'],
  },
  {
    id: 'NEXA Vision',
    name: 'NEXA Vision',
    tagline: 'Multimodal Perception',
    description: 'Specialized visual encoder for charts, architectural diagrams, and image QA.',
    speed: 'Fast',
    speedBars: 4,
    icon: Eye,
    capabilities: ['Image QA', 'OCR Extraction', 'Chart Inspection', 'Visual Proofing'],
  },
  {
    id: 'NEXA Research',
    name: 'NEXA Research',
    tagline: 'Empirical Investigation',
    description: 'Evidence-backed synthesis with multi-source consensus and citation indexing.',
    speed: 'Deep',
    speedBars: 2,
    icon: Compass,
    capabilities: ['Web Grounding', 'Source Verification', 'Uncertainty Demarcation', 'Deep Syntheses'],
  },
];

interface ModelSelectorProps {
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  activeProviderName?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onSelectModel,
  activeProviderName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = AVAILABLE_MODELS.find((m) => m.id === currentModel) || AVAILABLE_MODELS[0];
  const IconComponent = selected.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/10 text-xs text-zinc-200 transition-all shadow-sm"
        aria-label="Select AI Model"
      >
        <IconComponent className="w-3.5 h-3.5 text-zinc-300" />
        <span className="font-medium tracking-wide">{selected.name}</span>
        <div className="flex items-center gap-0.5 ml-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className={`w-0.5 h-2 rounded-full ${
                bar <= selected.speedBars ? 'bg-white' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-84 rounded-xl glass-panel p-2 z-50 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-mono uppercase tracking-wider">Select Architecture</span>
          </div>

          <div className="mt-1 space-y-1">
            {AVAILABLE_MODELS.map((model) => {
              const MIcon = model.icon;
              const isCurrent = model.id === currentModel;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start justify-between gap-3 ${
                    isCurrent
                      ? 'bg-zinc-800/90 border border-white/15'
                      : 'hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded-md mt-0.5 ${
                        isCurrent ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <MIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{model.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">({model.speed})</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{model.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {model.capabilities.slice(0, 3).map((cap) => (
                          <span
                            key={cap}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/50 text-zinc-300"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-white shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
