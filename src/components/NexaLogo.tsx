import React from 'react';

interface NexaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const NexaLogo: React.FC<NexaLogoProps> = ({ className = '', size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const textSizes = {
    sm: 'text-sm font-semibold tracking-wider',
    md: 'text-base font-bold tracking-wider',
    lg: 'text-xl font-bold tracking-widest',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimal Monochrome Orbit Symbol */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        <div className="absolute inset-0 rounded-full border border-white/20 animate-[spin_12s_linear_infinite]" />
        <div className="absolute inset-1 rounded-full border border-dashed border-white/30" />
        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`text-white font-mono uppercase ${textSizes[size]}`}>NEXA</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-zinc-300 tracking-wider">
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] text-zinc-500 font-sans tracking-wide">
            One Intelligence. Every Possibility.
          </span>
        )}
      </div>
    </div>
  );
};
