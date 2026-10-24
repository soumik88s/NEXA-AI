import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Compass,
  Database,
  Wrench,
  Globe2,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Check,
  Share2,
  Calculator,
  Terminal,
  FileText,
  X,
  ExternalLink,
  Download,
  Edit3,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Conversation, Message, ToolCall, Citation } from '../types';
import { api } from '../lib/api';

interface ChatViewProps {
  activeConversation: Conversation | null;
  activeModel: string;
  onSelectModel: (model: string) => void;
  onConversationCreated: (conv: Conversation) => void;
  onNavigateToWorkspace: (view: string, payload?: any) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  activeConversation,
  activeModel,
  onConversationCreated,
  onNavigateToWorkspace,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingTools, setStreamingTools] = useState<ToolCall[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      api.chat
        .getConversation(activeConversation.id)
        .then((res) => {
          setMessages(res.messages || []);
        })
        .catch((err) => console.error('Failed to load conversation:', err));
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Auto-scroll on new tokens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if ((!text && attachments.length === 0) || isStreaming) return;

    setInputValue('');
    const currentAttachments = [...attachments];
    setAttachments([]);

    setIsStreaming(true);
    setStreamingContent('');
    setStreamingTools([]);

    // Optimistically push user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversation?.id || 'new',
      role: 'user',
      content: text,
      attachments: currentAttachments,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    await api.streamChat(
      {
        conversationId: activeConversation?.id,
        content: text,
        model: activeModel,
        attachments: currentAttachments,
      },
      {
        onInit: (conv, userMsg) => {
          if (!activeConversation) {
            onConversationCreated(conv);
          }
          setMessages((prev) => prev.map((m) => (m.id === tempUserMsg.id ? userMsg : m)));
        },
        onChunk: (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        },
        onToolCall: (toolCall) => {
          setStreamingTools((prev) => [...prev, toolCall]);
        },
        onDone: (assistantMsg) => {
          setMessages((prev) => [...prev, assistantMsg]);
          setIsStreaming(false);
          setStreamingContent('');
          setStreamingTools([]);
        },
        onError: (err) => {
          console.error('Stream error:', err);
          const errorMsg: Message = {
            id: `err-${Date.now()}`,
            conversationId: activeConversation?.id || 'err',
            role: 'assistant',
            content: `**Error:** ${err}`,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
          setIsStreaming(false);
          setStreamingContent('');
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, feedback: 'like' | 'dislike') => {
    try {
      await api.chat.sendFeedback(messageId, feedback);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
      );
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            content: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              content: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag Over Overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-white/40 pointer-events-none">
          <Paperclip className="w-12 h-12 text-white mb-2 animate-bounce" />
          <p className="text-sm font-semibold text-white">Drop file to attach to session</p>
          <p className="text-xs text-zinc-400">Supports CSV, JSON, TXT, Images, and Documents</p>
        </div>
      )}

      {/* Message List or Empty State */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center select-none animate-in fade-in duration-300">
            {/* Abstract Orbit Symbol */}
            <div className="relative w-16 h-16 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border border-white/20 animate-[spin_15s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-dashed border-white/30" />
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.9)]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              One Intelligence. <br />
              <span className="font-serif-display italic font-normal text-zinc-300">
                Every Possibility.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md">
              What do you want to work on? Research a topic, analyze a dataset, synthesize documents, or run calculations.
            </p>

            {/* Suggested Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full max-w-lg text-left">
              {[
                {
                  icon: Compass,
                  title: 'Research a topic',
                  text: 'Investigate the major causes of climate change and radiative forcing',
                },
                {
                  icon: Database,
                  title: 'Analyze a dataset',
                  text: 'Examine World Development Indicators and inspect missing data ratios',
                },
                {
                  icon: FileText,
                  title: 'Summarize a document',
                  text: 'Extract the executive findings from an uploaded policy benchmark',
                },
                {
                  icon: Terminal,
                  title: 'Help me build something',
                  text: 'Write a modular streaming data pipeline with TypeScript interfaces',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(item.text);
                      textareaRef.current?.focus();
                    }}
                    className="p-3.5 rounded-xl glass-panel border border-white/5 hover:border-white/20 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-zinc-400 group-hover:text-white text-xs font-semibold mb-1">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors line-clamp-2">
                      {item.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Message Role Label */}
              <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-zinc-500">
                {msg.role === 'user' ? (
                  <span>You</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-zinc-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                    NEXA AI
                    {msg.model && <span className="text-[10px] text-zinc-500">({msg.model})</span>}
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 max-w-[90%] sm:max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 text-white border border-white/10'
                    : 'glass-panel text-zinc-200 border border-white/10 shadow-lg'
                }`}
              >
                {/* Render Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.attachments.map((att, aIdx) => (
                      <div
                        key={aIdx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/90 border border-white/10 text-xs"
                      >
                        {att.mimeType?.startsWith('image/') ? (
                          <img
                            src={att.content || att.url}
                            alt={att.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <FileText className="w-5 h-5 text-zinc-400" />
                        )}
                        <div className="text-left">
                          <div className="text-white font-medium truncate max-w-[140px]">{att.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'Attached file'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tool Invocations */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {msg.toolCalls.map((tc, tcIdx) => (
                      <div
                        key={tcIdx}
                        className="p-3 rounded-xl bg-zinc-950/70 border border-white/10 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 text-zinc-400 text-[11px] mb-1.5">
                          {tc.tool === 'calculator' && <Calculator className="w-3.5 h-3.5 text-emerald-400" />}
                          {tc.tool === 'dataset_search' && <Database className="w-3.5 h-3.5 text-blue-400" />}
                          {tc.tool !== 'calculator' && tc.tool !== 'dataset_search' && (
                            <Wrench className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          <span className="text-white font-medium">Tool Invoked: {tc.tool}</span>
                          <span className={`${tc.status === 'failed' ? 'text-red-400' : 'text-emerald-400'} text-[10px]`}>
                            • {tc.status === 'failed' ? 'Error' : 'Completed'}
                          </span>
                        </div>

                        <div className="text-zinc-300 text-[11px]">
                          Input: {JSON.stringify(tc.input)}
                        </div>
                        {tc.output && (
                          <div className="text-zinc-400 text-[11px] mt-0.5">
                            Output: {JSON.stringify(tc.output)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Content */}
                <MarkdownRenderer content={msg.content} />

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">Verified Sources</span>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cit, cIdx) => (
                        <a
                          key={cIdx}
                          href={cit.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-[11px] text-zinc-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                          <span>[{cIdx + 1}] {cit.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Controls (Copy, Feedback, Regenerate) */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 px-1 text-zinc-500 text-xs">
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="hover:text-white p-1 rounded transition-colors"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleFeedback(msg.id, 'like')}
                    className={`hover:text-white p-1 rounded transition-colors ${
                      msg.feedback === 'like' ? 'text-white' : ''
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(msg.id, 'dislike')}
                    className={`hover:text-white p-1 rounded transition-colors ${
                      msg.feedback === 'dislike' ? 'text-white' : ''
                    }`}
                    title="Poor response"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Live Streaming Response Indicator */}
        {isStreaming && (
          <div className="flex flex-col items-start space-y-1.5">
            <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-zinc-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              NEXA AI
              <span className="text-[10px] text-zinc-500">Streaming tokens...</span>
            </div>

            <div className="rounded-2xl p-4 glass-panel text-zinc-200 border border-white/10 shadow-lg max-w-[85%]">
              {streamingTools.length > 0 && (
                <div className="space-y-2 mb-3">
                  {streamingTools.map((tc, tcIdx) => (
                    <div
                      key={tcIdx}
                      className="p-2.5 rounded-lg bg-zinc-950/70 border border-white/10 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 text-white text-[11px]">
                        <Wrench className="w-3.5 h-3.5 text-purple-400" />
                        <span>Tool Executing: {tc.tool}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {streamingContent ? (
                <MarkdownRenderer content={streamingContent} />
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Synthesizing response...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 max-w-4xl mx-auto w-full z-20">
        {/* Attachment preview tags */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-zinc-900/90 border border-white/10">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-200 border border-white/5"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate max-w-[120px]">{att.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="hover:text-red-400 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Large Premium Glass Input Container */}
        <div className="glass-input rounded-2xl p-2.5 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send, Shift + Enter for newline)"
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none px-2 py-1 max-h-44 font-sans leading-relaxed"
          />

          {/* Input Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
            {/* Attachment Controls */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                title="Attach files (CSV, JSON, PDF, TXT)"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Attach</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                title="Attach images for vision analysis"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Vision</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToWorkspace('research')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                title="Launch Deep Research"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Research</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToWorkspace('data')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                title="Query Global Data Catalog"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Data</span>
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && attachments.length === 0) || isStreaming}
              className="p-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-white active:scale-95 shadow-md"
              title="Send message"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mt-2 px-1">
        </div>
      </div>
    </div>
  );
};
