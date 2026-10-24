import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  Send,
} from 'lucide-react';
import { api } from '../lib/api';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../lib/utils';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const FilesView: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiActionLoading, setAiActionLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await api.files.list();
      setFiles(res.files || []);
      if (res.files && res.files.length > 0 && !selectedFile) {
        setSelectedFile(res.files[0]);
      }
    } catch (err: any) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await api.files.upload({
            name: file.name,
            mimeType: file.type,
            size: file.size,
            content: reader.result as string,
          });
          setFiles((prev) => [res.file, ...prev]);
          setSelectedFile(res.file);
        } catch (err: any) {
          setError(err.message || 'File upload failed');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.files.delete(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (selectedFile?.id === id) {
        setSelectedFile(null);
        setAiResult(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const handleSummarize = async () => {
    if (!selectedFile) return;
    setAiActionLoading(true);
    setAiResult(null);
    try {
      const res = await api.files.summarize(selectedFile.id);
      setAiResult(res.summary);
    } catch (err: any) {
      setError(err.message || 'Summarization failed');
    } finally {
      setAiActionLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedFile || !question.trim()) return;
    setAiActionLoading(true);
    try {
      const res = await api.files.ask(selectedFile.id, question);
      setAiResult(res.answer);
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Document QA failed');
    } finally {
      setAiActionLoading(false);
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('image')) return ImageIcon;
    if (mime.includes('csv') || mime.includes('sheet') || mime.includes('excel')) return FileSpreadsheet;
    if (mime.includes('json') || mime.includes('code') || mime.includes('javascript')) return FileCode;
    return FileText;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#050505] overflow-hidden">
      {/* Left Column: File Catalog */}
      <div className="w-full md:w-80 border-r border-white/10 bg-[#070709] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white tracking-wide">FILES & MULTIMODAL</div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{files.length} documents uploaded</p>
          </div>
          <label className="p-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer shadow-sm">
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* File Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="p-6 text-center text-xs text-zinc-500 font-mono">Loading document library...</div>
          ) : files.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No files uploaded yet. Click Upload to import CSV, JSON, TXT, or image assets.
            </div>
          ) : (
            files.map((file) => {
              const Icon = getFileIcon(file.mimeType);
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    setSelectedFile(file);
                    setAiResult(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-zinc-800 text-white border border-white/15 shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 mt-0.5 text-zinc-300 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">{file.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {formatBytes(file.size)} • {formatDate(file.createdAt)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteFile(file.id, e)}
                    className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors shrink-0"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Selected File Inspector & AI Intelligence */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-200 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {selectedFile ? (
          <>
            {/* File Header */}
            <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
                  <span>{selectedFile.mimeType}</span>
                  <span>•</span>
                  <span>{formatBytes(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="text-emerald-400">Status: {selectedFile.status}</span>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">{selectedFile.name}</h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSummarize}
                  disabled={aiActionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Summarize</span>
                </button>
              </div>
            </div>

            {/* AI Q&A Bar for Document */}
            <div className="p-4 rounded-xl glass-panel border border-white/10 space-y-3">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Ask Questions About This File
              </label>
              <div className="flex items-center gap-2 glass-input rounded-xl p-1.5">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="e.g. Extract the primary recommendations or find anomalies..."
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none px-3 py-1 font-sans"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || aiActionLoading}
                  className="p-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AI Output Card */}
              {aiActionLoading ? (
                <div className="p-4 rounded-xl bg-zinc-950/70 text-xs text-zinc-400 font-mono flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Analyzing file contents with NEXA AI...</span>
                </div>
              ) : aiResult ? (
                <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 mt-2">
                  <div className="text-[10px] font-mono uppercase text-zinc-500 mb-2">AI Extraction Result</div>
                  <MarkdownRenderer content={aiResult} />
                </div>
              ) : null}
            </div>

            {/* File Raw Text / Content Preview */}
            <div className="rounded-xl border border-white/10 glass-panel overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-white/10 text-xs font-mono text-zinc-400">
                Document Preview (First 50,000 characters)
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto max-h-96 leading-relaxed whitespace-pre-wrap">
                {selectedFile.extractedText || '[Binary or unparsed file content]'}
              </pre>
            </div>
          </>
        ) : (
          <div className="py-24 text-center text-xs text-zinc-500">
            Select an uploaded file from the library or click Upload to process documents.
          </div>
        )}
      </div>
    </div>
  );
};
