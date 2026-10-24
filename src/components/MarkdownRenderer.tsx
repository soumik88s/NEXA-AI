import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { MathFormula, MathSolutionBlock, MathSolutionData, normalizeLatex } from './MathRenderer';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed ${className}`}>
      {renderCustomMarkdown(content)}
    </div>
  );
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  // Check if this is a structured math_solution JSON
  if (language === 'json' || language === '') {
    try {
      const parsed = JSON.parse(code.trim());
      if (parsed?.type === 'math_solution' && Array.isArray(parsed.steps)) {
        return <MathSolutionBlock data={parsed as MathSolutionData} />;
      }
    } catch {
      // not a math json, continue as standard code
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-lg border border-white/10 bg-[#09090b] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-white/5 text-xs text-zinc-400">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] font-mono leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderCustomMarkdown(raw: string) {
  if (!raw) return null;

  // 1. Separate code blocks (```...```) from the rest
  const parts = raw.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)```$/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);
      return <CodeBlock key={index} code={code} language={language} />;
    }

    // 2. Process display math blocks: $$ ... $$ or \[ ... \]
    return <DisplayMathAndTextBlock key={index} text={part} />;
  });
}

/**
 * Handles display mathematics: $$...$$ and \[...\]
 */
function DisplayMathAndTextBlock({ text }: { text: string }) {
  // Regex to split by $$...$$ or \[...\]
  const mathBlockRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
  const segments = text.split(mathBlockRegex);

  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.startsWith('$$') && seg.endsWith('$$')) {
          const formula = seg.slice(2, -2).trim();
          return <MathFormula key={idx} math={formula} displayMode={true} />;
        }
        if (seg.startsWith('\\[') && seg.endsWith('\\]')) {
          const formula = seg.slice(2, -2).trim();
          return <MathFormula key={idx} math={formula} displayMode={true} />;
        }

        return <TextBlock key={idx} text={seg} />;
      })}
    </>
  );
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table check: lines containing pipe |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      tableLines.push(line);
      continue;
    } else if (inTable) {
      elements.push(renderTable(tableLines, `table-${i}`));
      tableLines = [];
      inTable = false;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-white mt-4 mb-2 tracking-wide">
          {renderFormattedInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-semibold text-white mt-5 mb-2.5 tracking-tight">
          {renderFormattedInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-white mt-6 mb-3 tracking-tight">
          {renderFormattedInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="my-2.5 pl-3 border-l-2 border-zinc-600 text-zinc-400 italic text-xs">
          {renderFormattedInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 text-zinc-300">
          <span className="text-zinc-500 mt-1">•</span>
          <div className="flex-1">{renderFormattedInline(line.trim().slice(2))}</div>
        </div>
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        elements.push(
          <div key={i} className="flex items-start gap-2 my-1 text-zinc-300">
            <span className="text-zinc-500 font-mono text-xs mt-0.5">{numMatch[1]}.</span>
            <div className="flex-1">{renderFormattedInline(numMatch[2])}</div>
          </div>
        );
      }
    } else if (line.trim().length === 0) {
      elements.push(<div key={i} className="h-2" />);
    } else {
      // Check if this entire line is a raw equation like: b = \frac{B^2l^2}{R} or b = (0.1)^2/10
      const isStandaloneRawLatex =
        /^[a-zA-Zα-ωΑ-Ω_0-9\s()]*=\s*\\(frac|sqrt|sum|int|prod|lim)/.test(line.trim()) ||
        /^[a-zA-Zα-ωΑ-Ω_0-9\s()]*=\s*10\^/.test(line.trim());

      if (isStandaloneRawLatex) {
        elements.push(
          <div key={i} className="my-2">
            <MathFormula math={line.trim()} displayMode={true} />
          </div>
        );
      } else {
        elements.push(
          <p key={i} className="my-1 text-zinc-200">
            {renderFormattedInline(line)}
          </p>
        );
      }
    }
  }

  if (tableLines.length > 0) {
    elements.push(renderTable(tableLines, 'table-end'));
  }

  return <>{elements}</>;
}

function renderTable(tableLines: string[], key: string) {
  if (tableLines.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .trim()
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

  const headers = parseRow(tableLines[0]);
  const dataStart = tableLines[1].includes('---') ? 2 : 1;
  const rows = tableLines.slice(dataStart).map(parseRow);

  return (
    <div key={key} className="my-3.5 overflow-x-auto rounded-lg border border-white/10 bg-zinc-950/60 shadow">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-zinc-900/80">
            {headers.map((h, idx) => (
              <th key={idx} className="p-2.5 font-semibold text-zinc-200">
                {renderFormattedInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r, rIdx) => (
            <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors">
              {r.map((cell, cIdx) => (
                <td key={cIdx} className="p-2.5 text-zinc-300 font-sans">
                  {renderFormattedInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Parses inline formatting:
 * 1. \( ... \) -> KaTeX inline
 * 2. $ ... $ -> KaTeX inline (excluding plain currency)
 * 3. Raw LaTeX protection (e.g. \frac{...}{...}, \sqrt{...}, 10\text{ cm}, 0.5\text{ Nm}^{-1}, \omega, \alpha)
 * 4. Markdown bold (**...**), italic (*...*), code (`...`), links, images
 */
function renderFormattedInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split regex handles:
  // - Images: ![alt](url)
  // - Explicit inline math: \(...\)
  // - Dollar inline math: $...$
  // - Bold: **...**
  // - Italic: *...*
  // - Inline code: `...`
  // - Raw LaTeX units/commands: e.g. (\d+\s*\\text\{[^}]+\}) or (\\\w+\{[^}]+\})
  const inlineTokenRegex =
    /(!\[.*?\]\(.*?\)|\\\(.*?\\\)|(?<!\$)\$(?!\$)(?:\\\$|[^\$])+?\$(?!\$)|\*\*.*?\*\*|\*.*?\*|`.*?`|\b\d+(?:\.\d+)?\\text\{[^\}]+\}|\\[a-zA-Z]+(?:\{[^\}]*\})*(?:\^[0-9{}-]+)?(?:_[0-9{}-]+)?)/g;

  const parts = text.split(inlineTokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Markdown image ![alt](url)
    if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const alt = match[1];
        const src = match[2];
        return (
          <span key={idx} className="block my-3">
            <img
              src={src}
              alt={alt}
              className="max-h-96 w-auto rounded-xl border border-white/10 shadow-lg object-contain bg-zinc-950"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {alt && <span className="block mt-1 text-xs text-zinc-400 italic text-center">{alt}</span>}
          </span>
        );
      }
    }

    // 2. Inline math with \( ... \)
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const formula = part.slice(2, -2);
      return <MathFormula key={idx} math={formula} displayMode={false} />;
    }

    // 3. Inline math with $ ... $
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const formula = part.slice(1, -1);
      // Ensure it's not a standalone dollar currency amount like "$50"
      if (!/^\d+(\.\d+)?$/.test(formula.trim())) {
        return <MathFormula key={idx} math={formula} displayMode={false} />;
      }
    }

    // 4. Raw LaTeX unit protection: e.g. 10\text{ cm} or 0.5\text{ Nm}^{-1} or 10\ \Omega
    if (/^\d+(?:\.\d+)?\\text\{/.test(part) || /^\\\w+/.test(part)) {
      // Normalize and render via KaTeX
      return <MathFormula key={idx} math={part} displayMode={false} />;
    }

    // 5. Bold **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {renderFormattedInline(part.slice(2, -2))}
        </strong>
      );
    }

    // 6. Italic *...*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="italic text-zinc-300">
          {renderFormattedInline(part.slice(1, -1))}
        </em>
      );
    }

    // 7. Inline code `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 font-mono text-[12px] text-zinc-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
