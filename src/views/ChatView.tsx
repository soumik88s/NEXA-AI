import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Compass,
  Database,
  Wrench,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  Calculator,
  Terminal,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Conversation, Message, ToolCall } from '../types';
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

  // ------------------------------------------------------------
  // Load conversation
  // ------------------------------------------------------------
  useEffect(() => {
    if (activeConversation) {
      api.chat
        .getConversation(activeConversation.id)
        .then((res) => {
          setMessages(res.messages || []);
        })
        .catch((err) => {
          console.error('Failed to load conversation:', err);
        });
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // ------------------------------------------------------------
  // Auto scroll
  // ------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, streamingContent]);

  // ------------------------------------------------------------
  // Auto resize textarea
  // ------------------------------------------------------------
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [inputValue]);

  // ------------------------------------------------------------
  // Send message
  // ------------------------------------------------------------
  const handleSendMessage = async () => {
    const text = inputValue.trim();

    if ((!text && attachments.length === 0) || isStreaming) {
      return;
    }

    setInputValue('');

    const currentAttachments = [...attachments];
    setAttachments([]);

    setIsStreaming(true);
    setStreamingContent('');
    setStreamingTools([]);

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

          setMessages((prev) =>
            prev.map((m) => (m.id === tempUserMsg.id ? userMsg : m))
          );
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
          setStreamingTools([]);
        },
      }
    );
  };

  // ------------------------------------------------------------
  // Keyboard handling
  // ------------------------------------------------------------
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ------------------------------------------------------------
  // Copy
  // ------------------------------------------------------------
  const handleCopyMessage = (
    id: string,
    content: string
  ) => {
    navigator.clipboard.writeText(content);

    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // ------------------------------------------------------------
  // Feedback
  // ------------------------------------------------------------
  const handleFeedback = async (
    messageId: string,
    feedback: 'like' | 'dislike'
  ) => {
    try {
      await api.chat.sendFeedback(messageId, feedback);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, feedback }
            : m
        )
      );
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  // ------------------------------------------------------------
  // Add file
  // ------------------------------------------------------------
  const addFiles = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 6)}`,
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

  // ------------------------------------------------------------
  // File upload
  // ------------------------------------------------------------
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      return;
    }

    addFiles(Array.from(files));

    e.target.value = '';
  };

  // ------------------------------------------------------------
  // Drag and drop
  // ------------------------------------------------------------
  const handleDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault();

    setDragOver(false);

    const files = e.dataTransfer.files;

    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
  };

  // ------------------------------------------------------------
  // Suggested prompts
  // ------------------------------------------------------------
  const suggestedPrompts = [
    {
      icon: Compass,
      title: 'Research a topic',
      text:
        'Investigate the major causes of climate change and radiative forcing',
    },
    {
      icon: Database,
      title: 'Analyze a dataset',
      text:
        'Examine World Development Indicators and inspect missing data ratios',
    },
    {
      icon: FileText,
      title: 'Summarize a document',
      text:
        'Extract the executive findings from an uploaded policy benchmark',
    },
    {
      icon: Terminal,
      title: 'Help me build something',
      text:
        'Write a modular streaming data pipeline with TypeScript interfaces',
    },
  ];

  return (
    <div
      className="
        flex-1 flex flex-col h-full
        relative overflow-hidden
        bg-[#050505]
      "
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* ========================================================
          BACKGROUND AMBIENCE
      ======================================================== */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="
            absolute
            top-[-18%]
            left-[15%]
            w-[520px]
            h-[520px]
            rounded-full
            bg-white/[0.025]
            blur-[130px]
          "
        />

        <div
          className="
            absolute
            bottom-[-20%]
            right-[5%]
            w-[480px]
            h-[480px]
            rounded-full
            bg-white/[0.02]
            blur-[130px]
          "
        />

        <div
          className="
            absolute
            top-[35%]
            right-[35%]
            w-[250px]
            h-[250px]
            rounded-full
            bg-white/[0.012]
            blur-[100px]
          "
        />
      </div>

      {/* ========================================================
          DRAG OVERLAY
      ======================================================== */}

      {dragOver && (
        <div
          className="
            absolute inset-0
            z-50
            bg-black/85
            backdrop-blur-xl
            flex flex-col
            items-center
            justify-center
            border-2
            border-dashed
            border-white/30
            pointer-events-none
          "
        >
          <div
            className="
              w-20 h-20
              rounded-2xl
              bg-white/[0.05]
              border border-white/10
              flex items-center justify-center
              mb-5
              shadow-[0_0_60px_rgba(255,255,255,0.08)]
            "
          >
            <Paperclip
              className="
                w-9 h-9
                text-white
                animate-bounce
              "
            />
          </div>

          <p className="text-base font-semibold text-white">
            Drop your file here
          </p>

          <p className="text-xs text-zinc-500 mt-2">
            CSV, JSON, TXT, images and documents
          </p>
        </div>
      )}

      {/* ========================================================
          MESSAGE AREA
      ======================================================== */}

      <div
        className="
          relative z-10
          flex-1
          overflow-y-auto
          px-4
          py-8
          max-w-4xl
          mx-auto
          w-full
        "
      >
        {messages.length === 0 && !isStreaming ? (
          /* ====================================================
             EMPTY STATE
          ==================================================== */

          <div
            className="
              flex flex-col
              items-center
              justify-center
              min-h-[65vh]
              text-center
              select-none
              animate-in
              fade-in
              duration-500
            "
          >
            {/* NEXA ORBIT */}
            <div
              className="
                relative
                w-20 h-20
                flex items-center
                justify-center
                mb-8
              "
            >
              <div
                className="
                  absolute inset-0
                  rounded-full
                  border border-white/10
                  animate-[spin_18s_linear_infinite]
                "
              />

              <div
                className="
                  absolute inset-2
                  rounded-full
                  border border-dashed
                  border-white/20
                  animate-[spin_12s_linear_infinite_reverse]
                "
              />

              <div
                className="
                  absolute inset-5
                  rounded-full
                  bg-white/[0.04]
                  blur-md
                "
              />

              <div
                className="
                  relative
                  w-5 h-5
                  rounded-full
                  bg-white
                  shadow-[0_0_35px_rgba(255,255,255,0.85)]
                "
              >
                <div
                  className="
                    absolute inset-1
                    rounded-full
                    bg-zinc-300
                  "
                />
              </div>
            </div>

            {/* Heading */}
            <h2
              className="
                text-3xl
                sm:text-4xl
                font-semibold
                text-white
                tracking-tight
                leading-tight
              "
            >
              What will you create
              <br />

              <span
                className="
                  font-serif-display
                  italic
                  font-normal
                  text-zinc-500
                "
              >
                today?
              </span>
            </h2>

            <p
              className="
                text-sm
                text-zinc-500
                mt-4
                max-w-md
                leading-relaxed
              "
            >
            </p>

            {/* Suggested Prompts */}
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-3
                mt-9
                w-full
                max-w-xl
                text-left
              "
            >
              {suggestedPrompts.map((item, idx) => {
                const Icon = item.icon;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(item.text);

                      setTimeout(() => {
                        textareaRef.current?.focus();
                      }, 50);
                    }}
                    className="
                      group
                      relative
                      p-4
                      rounded-2xl
                      bg-white/[0.025]
                      border
                      border-white/[0.07]
                      hover:bg-white/[0.055]
                      hover:border-white/[0.15]
                      hover:-translate-y-0.5
                      text-left
                      transition-all
                      duration-300
                      overflow-hidden
                    "
                  >
                    {/* Hover gradient */}
                    <div
                      className="
                        absolute
                        inset-0
                        opacity-0
                        group-hover:opacity-100
                        bg-gradient-to-br
                        from-white/[0.06]
                        via-transparent
                        to-transparent
                        transition-opacity
                        duration-300
                        pointer-events-none
                      "
                    />

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="
                            w-8 h-8
                            rounded-lg
                            bg-white/[0.06]
                            border
                            border-white/[0.08]
                            flex
                            items-center
                            justify-center
                            group-hover:bg-white/[0.1]
                            transition-colors
                          "
                        >
                          <Icon
                            className="
                              w-4 h-4
                              text-zinc-400
                              group-hover:text-white
                              transition-colors
                            "
                          />
                        </div>

                        <span
                          className="
                            text-xs
                            font-semibold
                            text-zinc-300
                            group-hover:text-white
                            transition-colors
                          "
                        >
                          {item.title}
                        </span>
                      </div>

                      <p
                        className="
                          text-[11px]
                          leading-relaxed
                          text-zinc-500
                          group-hover:text-zinc-300
                          transition-colors
                        "
                      >
                        {item.text}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ====================================================
             MESSAGES
          ==================================================== */

          <div className="space-y-7">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`
                  flex flex-col
                  ${
                    msg.role === 'user'
                      ? 'items-end'
                      : 'items-start'
                  }
                  space-y-2
                `}
              >
                {/* Message Header */}

                {/* Message Bubble */}
                <div
                  className={`
                    rounded-2xl
                    p-4
                    max-w-[94%]
                    sm:max-w-[85%]
                    transition-all
                    duration-200
                    ${
                      msg.role === 'user'
                        ? `
                          bg-white/[0.07]
                          text-white
                          border
                          border-white/[0.08]
                          shadow-[0_8px_30px_rgba(0,0,0,0.18)]
                        `
                        : `
                          bg-white/[0.025]
                          text-zinc-200
                          border
                          border-white/[0.07]
                          shadow-[0_8px_35px_rgba(0,0,0,0.12)]
                        `
                    }
                  `}
                >
                  {/* Attachments */}
                  {msg.attachments &&
                    msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {msg.attachments.map(
                          (att, aIdx) => (
                            <div
                              key={aIdx}
                              className="
                                flex
                                items-center
                                gap-2
                                p-2
                                rounded-xl
                                bg-black/30
                                border
                                border-white/[0.08]
                                text-xs
                              "
                            >
                              {att.mimeType?.startsWith(
                                'image/'
                              ) ? (
                                <img
                                  src={
                                    att.content ||
                                    att.url
                                  }
                                  alt={att.name}
                                  className="
                                    w-11
                                    h-11
                                    object-cover
                                    rounded-lg
                                  "
                                />
                              ) : (
                                <div
                                  className="
                                    w-9 h-9
                                    rounded-lg
                                    bg-white/[0.05]
                                    flex
                                    items-center
                                    justify-center
                                  "
                                >
                                  <FileText
                                    className="
                                      w-4
                                      h-4
                                      text-zinc-400
                                    "
                                  />
                                </div>
                              )}

                              <div className="text-left">
                                <div
                                  className="
                                    text-white
                                    font-medium
                                    truncate
                                    max-w-[160px]
                                  "
                                >
                                  {att.name}
                                </div>

                                <div
                                  className="
                                    text-[10px]
                                    text-zinc-500
                                    font-mono
                                    mt-0.5
                                  "
                                >
                                  {att.size
                                    ? `${(
                                        att.size / 1024
                                      ).toFixed(1)} KB`
                                    : 'Attached file'}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {/* Tool Calls */}
                  {msg.toolCalls &&
                    msg.toolCalls.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {msg.toolCalls.map(
                          (tc, tcIdx) => (
                            <div
                              key={tcIdx}
                              className="
                                p-3
                                rounded-xl
                                bg-black/30
                                border
                                border-white/[0.08]
                                text-xs
                                font-mono
                              "
                            >
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-2
                                  mb-2
                                "
                              >
                                {tc.tool ===
                                  'calculator' && (
                                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                                )}

                                {tc.tool ===
                                  'dataset_search' && (
                                  <Database className="w-3.5 h-3.5 text-blue-400" />
                                )}

                                {tc.tool !==
                                  'calculator' &&
                                  tc.tool !==
                                    'dataset_search' && (
                                    <Wrench className="w-3.5 h-3.5 text-purple-400" />
                                  )}

                                <span className="text-white font-medium">
                                  {tc.tool}
                                </span>

                                <span
                                  className={
                                    tc.status ===
                                    'failed'
                                      ? 'text-red-400'
                                      : 'text-emerald-400'
                                  }
                                >
                                  •{' '}
                                  {tc.status ===
                                  'failed'
                                    ? 'Error'
                                    : 'Completed'}
                                </span>
                              </div>

                              <div className="text-zinc-400 text-[11px] break-all">
                                Input:{' '}
                                {JSON.stringify(
                                  tc.input
                                )}
                              </div>

                              {tc.output && (
                                <div className="text-zinc-500 text-[11px] mt-1 break-all">
                                  Output:{' '}
                                  {JSON.stringify(
                                    tc.output
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {/* Message Content */}
                  <div className="leading-relaxed">
                    <MarkdownRenderer
                      content={msg.content}
                    />
                  </div>

                  {/* Citations */}
                  {msg.citations &&
                    msg.citations.length > 0 && (
                      <div
                        className="
                          mt-5
                          pt-4
                          border-t
                          border-white/[0.06]
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            mb-2
                          "
                        >
                          <div
                            className="
                              w-1.5
                              h-1.5
                              rounded-full
                              bg-emerald-400
                            "
                          />

                          <span
                            className="
                              text-[10px]
                              font-mono
                              uppercase
                              tracking-wider
                              text-zinc-500
                            "
                          >
                            Verified Sources
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map(
                            (cit, cIdx) => (
                              <a
                                key={cIdx}
                                href={cit.url}
                                target="_blank"
                                rel="noreferrer"
                                className="
                                  flex
                                  items-center
                                  gap-1.5
                                  px-2.5
                                  py-1.5
                                  rounded-lg
                                  bg-white/[0.03]
                                  hover:bg-white/[0.07]
                                  border
                                  border-white/[0.07]
                                  text-[11px]
                                  text-zinc-400
                                  hover:text-white
                                  transition-all
                                "
                              >
                                <ExternalLink className="w-3 h-3" />

                                <span className="truncate max-w-[180px]">
                                  [{cIdx + 1}]{' '}
                                  {cit.title}
                                </span>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Message Controls */}
                {msg.role === 'assistant' && (
                  <div
                    className="
                      flex
                      items-center
                      gap-1
                      px-1
                      text-zinc-600
                    "
                  >
                    <button
                      onClick={() =>
                        handleCopyMessage(
                          msg.id,
                          msg.content
                        )
                      }
                      className="
                        p-1.5
                        rounded-lg
                        hover:bg-white/[0.05]
                        hover:text-white
                        transition-all
                      "
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        handleFeedback(
                          msg.id,
                          'like'
                        )
                      }
                      className={`
                        p-1.5
                        rounded-lg
                        hover:bg-white/[0.05]
                        hover:text-white
                        transition-all
                        ${
                          msg.feedback === 'like'
                            ? 'text-white bg-white/[0.05]'
                            : ''
                        }
                      `}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        handleFeedback(
                          msg.id,
                          'dislike'
                        )
                      }
                      className={`
                        p-1.5
                        rounded-lg
                        hover:bg-white/[0.05]
                        hover:text-white
                        transition-all
                        ${
                          msg.feedback === 'dislike'
                            ? 'text-white bg-white/[0.05]'
                            : ''
                        }
                      `}
                      title="Poor response"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ======================================================
            STREAMING STATE
        ====================================================== */}

        {isStreaming && (
          <div className="flex flex-col items-start mt-7 space-y-3">
            <div
              className="
                flex
                items-center
                gap-3
                px-1
              "
            >
              {/* Animated Orb */}
              <div
                className="
                  relative
                  flex
                  items-center
                  justify-center
                  w-6
                  h-6
                "
              >
                <span
                  className="
                    absolute
                    w-6
                    h-6
                    rounded-full
                    border
                    border-white/20
                    animate-ping
                  "
                />

                <span
                  className="
                    relative
                    w-2
                    h-2
                    rounded-full
                    bg-white
                    shadow-[0_0_12px_rgba(255,255,255,0.9)]
                  "
                />
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="
                    text-sm
                    text-zinc-400
                    font-medium
                  "
                >
                  Let me cook
                </span>

                <span className="flex gap-1">
                  <span
                    className="
                      w-1
                      h-1
                      rounded-full
                      bg-zinc-500
                      animate-bounce
                      [animation-delay:-0.3s]
                    "
                  />

                  <span
                    className="
                      w-1
                      h-1
                      rounded-full
                      bg-zinc-500
                      animate-bounce
                      [animation-delay:-0.15s]
                    "
                  />

                  <span
                    className="
                      w-1
                      h-1
                      rounded-full
                      bg-zinc-500
                      animate-bounce
                    "
                  />
                </span>
              </div>
            </div>

            {/* Streaming tools */}
            {streamingTools.length > 0 && (
              <div className="space-y-2">
                {streamingTools.map(
                  (tc, tcIdx) => (
                    <div
                      key={tcIdx}
                      className="
                        p-3
                        rounded-xl
                        bg-white/[0.025]
                        border
                        border-white/[0.07]
                        text-xs
                        font-mono
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          text-zinc-300
                        "
                      >
                        <Wrench
                          className="
                            w-3.5
                            h-3.5
                            text-purple-400
                          "
                        />

                        <span>
                          Tool executing:{' '}
                          {tc.tool}
                        </span>

                        <span className="flex gap-1 ml-1">
                          <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                          <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse [animation-delay:150ms]" />
                          <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse [animation-delay:300ms]" />
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Streaming content */}
            {streamingContent && (
              <div
                className="
                  max-w-[94%]
                  sm:max-w-[85%]
                  rounded-2xl
                  p-4
                  bg-white/[0.02]
                  border
                  border-white/[0.06]
                  text-zinc-300
                "
              >
                <MarkdownRenderer
                  content={streamingContent}
                />
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ========================================================
          INPUT AREA
      ======================================================== */}

      <div
        className="
          relative
          z-20
          p-3
          sm:p-4
          max-w-4xl
          mx-auto
          w-full
        "
      >
        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div
            className="
              flex
              flex-wrap
              gap-2
              mb-2
              p-2
              rounded-xl
              bg-white/[0.025]
              backdrop-blur-xl
              border
              border-white/[0.07]
            "
          >
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="
                  flex
                  items-center
                  gap-2
                  px-2.5
                  py-1.5
                  rounded-lg
                  bg-white/[0.05]
                  text-xs
                  text-zinc-300
                  border
                  border-white/[0.06]
                "
              >
                {att.mimeType?.startsWith(
                  'image/'
                ) ? (
                  <img
                    src={att.content}
                    alt={att.name}
                    className="
                      w-5
                      h-5
                      rounded
                      object-cover
                    "
                  />
                ) : (
                  <FileText
                    className="
                      w-3.5
                      h-3.5
                      text-zinc-400
                    "
                  />
                )}

                <span className="truncate max-w-[130px]">
                  {att.name}
                </span>

                <button
                  onClick={() =>
                    setAttachments((prev) =>
                      prev.filter(
                        (_, i) => i !== idx
                      )
                    )
                  }
                  className="
                    hover:text-red-400
                    transition-colors
                  "
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Premium Input */}
        <div
          className="
            relative
            rounded-2xl
            p-2.5
            bg-white/[0.035]
            backdrop-blur-2xl
            border
            border-white/[0.10]
            shadow-[0_15px_50px_rgba(0,0,0,0.35)]
            focus-within:border-white/[0.18]
            focus-within:shadow-[0_15px_60px_rgba(255,255,255,0.05)]
            transition-all
            duration-300
          "
        >
          {/* Top highlight */}
          <div
            className="
              absolute
              -top-px
              left-8
              right-8
              h-px
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
              pointer-events-none
            "
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) =>
              setInputValue(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask NEXA anything..."
            className="
              w-full
              bg-transparent
              text-sm
              text-white
              placeholder-zinc-600
              focus:outline-none
              resize-none
              px-2
              py-2
              max-h-44
              font-sans
              leading-relaxed
            "
          />

          {/* Controls */}
          <div
            className="
              flex
              items-center
              justify-between
              pt-2
              border-t
              border-white/[0.05]
              mt-1
            "
          >
            {/* Left controls */}
            <div className="flex items-center gap-0.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Attach */}
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="
                  flex
                  items-center
                  gap-1.5
                  px-2.5
                  py-1.5
                  rounded-lg
                  text-xs
                  text-zinc-500
                  hover:text-white
                  hover:bg-white/[0.05]
                  transition-all
                "
                title="Attach files"
              >
                <Paperclip className="w-3.5 h-3.5" />

                <span className="hidden sm:inline text-[11px]">
                  Attach
                </span>
              </button>

              {/* Vision */}
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="
                  flex
                  items-center
                  gap-1.5
                  px-2.5
                  py-1.5
                  rounded-lg
                  text-xs
                  text-zinc-500
                  hover:text-white
                  hover:bg-white/[0.05]
                  transition-all
                "
                title="Attach image"
              >
                <ImageIcon className="w-3.5 h-3.5" />

                <span className="hidden sm:inline text-[11px]">
                  Vision
                </span>
              </button>

              {/* Research */}
              <button
                type="button"
                onClick={() =>
                  onNavigateToWorkspace(
                    'research'
                  )
                }
                className="
                  flex
                  items-center
                  gap-1.5
                  px-2.5
                  py-1.5
                  rounded-lg
                  text-xs
                  text-zinc-500
                  hover:text-white
                  hover:bg-white/[0.05]
                  transition-all
                "
                title="Launch Deep Research"
              >
                <Compass className="w-3.5 h-3.5" />

                <span className="hidden sm:inline text-[11px]">
                  Research
                </span>
              </button>

              {/* Data */}
              <button
                type="button"
                onClick={() =>
                  onNavigateToWorkspace('data')
                }
                className="
                  flex
                  items-center
                  gap-1.5
                  px-2.5
                  py-1.5
                  rounded-lg
                  text-xs
                  text-zinc-500
                  hover:text-white
                  hover:bg-white/[0.05]
                  transition-all
                "
                title="Query Global Data Catalog"
              >
                <Database className="w-3.5 h-3.5" />

                <span className="hidden sm:inline text-[11px]">
                  Data
                </span>
              </button>
            </div>

            {/* Send */}
            <button
              onClick={handleSendMessage}
              disabled={
                (!inputValue.trim() &&
                  attachments.length === 0) ||
                isStreaming
              }
              className="
                group
                w-9
                h-9
                rounded-xl
                bg-white
                text-black
                flex
                items-center
                justify-center
                hover:bg-zinc-200
                active:scale-90
                disabled:opacity-30
                disabled:hover:bg-white
                transition-all
                duration-200
                shadow-[0_4px_20px_rgba(255,255,255,0.15)]
              "
              title="Send message"
            >
              <Send
                className="
                  w-4
                  h-4
                  stroke-[2.5]
                  group-hover:translate-x-0.5
                  group-hover:-translate-y-0.5
                  transition-transform
                "
              />
            </button>
          </div>
        </div>

        {/* Status */}
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            text-[10px]
            text-zinc-700
            mt-2.5
            px-1
          "
        >
          
        </div>
      </div>
    </div>
  );
};