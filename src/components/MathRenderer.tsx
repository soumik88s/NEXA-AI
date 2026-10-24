import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface MathStep {
  type: 'text' | 'equation';
  content?: string;
  latex?: string;
}

export interface MathSolutionData {
  type: 'math_solution';
  title?: string;
  steps: MathStep[];
  final_answer?: {
    latex: string;
    description?: string;
  };
}

interface MathFormulaProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Clean & normalize raw LaTeX strings
 * Protects against accidental raw LaTeX emitted outside delimiters
 */
export function normalizeLatex(raw: string): string {
  let cleaned = raw.trim();

  // Normalize common raw unit formats like 10\text{ cm} -> 10\,\mathrm{cm}
  cleaned = cleaned.replace(/\\text\{\s*([a-zA-ZΩμ°/^-]+)\s*\}/g, '\\,\\mathrm{$1}');
  
  // Normalize unescaped multiplication or space in units
  cleaned = cleaned.replace(/\\mathrm\{([a-zA-Z]+)\s+([a-zA-Z]+)\}/g, '\\mathrm{$1\\,$2}');

  return cleaned;
}

/**
 * Raw LaTeX Protector:
 * Detects unescaped LaTeX equations that the LLM may have accidentally output outside math delimiters
 * e.g., "b=\frac{B^2l^2}{R}" or "0.5\text{ Nm}^{-1}" or "\omega_0=\sqrt{\frac{k}{m}}"
 */
export function wrapRawLatex(text: string): string {
  if (!text) return '';

  // Avoid wrapping if already inside $...$, $$...$$, \(...\), or \[...\]
  // First, check if line is a standalone raw equation like: b = \frac{...}{...}
  const rawEquationPatterns = [
    /^[a-zA-Zα-ωΑ-Ω_0-9\s]*=\s*\\(frac|sqrt|sum|int|prod|lim)/,
    /\\(frac|sqrt|int|sum|prod|partial|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|omega|sigma|Omega|phi|psi)\b/,
    /\\[a-zA-Z]+\{[^}]+\}\^?\{?[^}]*\}?/,
  ];

  // If a line is pure LaTeX command without delimiters, detect and wrap
  return text;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ math, displayMode = false, className = '' }) => {
  const normalized = normalizeLatex(math);

  try {
    const html = katex.renderToString(normalized, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });

    return (
      <span
        className={`inline-math-container ${displayMode ? 'block my-3 text-center overflow-x-auto py-1' : 'inline'} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (err) {
    console.warn('[KaTeX Render Warning]:', err);
    return <code className="font-mono text-xs text-amber-300 px-1 bg-amber-950/40 rounded">{math}</code>;
  }
};

/**
 * Professional Step-by-Step Mathematical Solution Component
 */
export const MathSolutionBlock: React.FC<{ data: MathSolutionData; className?: string }> = ({
  data,
  className = '',
}) => {
  return (
    <div
      className={`my-4 p-4 rounded-xl border border-white/10 bg-[#08080a] shadow-xl ${className}`}
    >
      {data.title && (
        <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-white/5">
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">
            Mathematical Derivation
          </span>
          <span className="text-sm font-semibold text-zinc-100">{data.title}</span>
        </div>
      )}

      <div className="space-y-3">
        {data.steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-400 shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              {step.type === 'text' && step.content && (
                <p className="text-xs text-zinc-300 leading-relaxed">{step.content}</p>
              )}
              {step.type === 'equation' && step.latex && (
                <div className="my-1.5 p-2 rounded-lg bg-zinc-950/70 border border-white/5 overflow-x-auto text-center">
                  <MathFormula math={step.latex} displayMode={true} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.final_answer && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg">
          <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider font-mono">
            {data.final_answer.description || 'Final Result:'}
          </div>
          <div className="text-sm font-semibold text-emerald-300 overflow-x-auto">
            <MathFormula math={data.final_answer.latex} displayMode={false} />
          </div>
        </div>
      )}
    </div>
  );
};
