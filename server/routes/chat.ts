import { Router } from 'express';
import { db } from '../db/store';
import { authenticate } from './auth';
import { getAIProvider, getProviderStatus } from '../providers/ai/index';
import { Conversation, Message, ToolCall, Citation } from '../types';
import { executeTool, evaluateSafeMath } from '../tools/index';

export const chatRouter = Router();

// GET /api/conversations
chatRouter.get('/conversations', authenticate, (req: any, res) => {
  const userId = req.user.id;
  const projectId = req.query.projectId as string | undefined;
  const search = (req.query.search as string | undefined)?.toLowerCase();

  let list = Array.from(db.conversations.values()).filter((c) => c.userId === userId);

  if (projectId) {
    list = list.filter((c) => c.projectId === projectId);
  }

  if (search) {
    list = list.filter((c) => c.title.toLowerCase().includes(search));
  }

  // Sort by updatedAt desc
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Attach last message preview
  const enhanced = list.map((conv) => {
    const msgs = Array.from(db.messages.values())
      .filter((m) => m.conversationId === conv.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const lastMsg = msgs[msgs.length - 1];
    return {
      ...conv,
      messageCount: msgs.length,
      lastMessage: lastMsg ? { content: lastMsg.content.slice(0, 80), createdAt: lastMsg.createdAt } : null,
    };
  });

  return res.json({ conversations: enhanced });
});

// POST /api/conversations
chatRouter.post('/conversations', authenticate, (req: any, res) => {
  const { title, model, projectId, systemPrompt } = req.body;
  const userId = req.user.id;

  const conv: Conversation = {
    id: `conv-${Date.now()}`,
    userId,
    projectId: projectId || null,
    title: title || 'New Conversation',
    model: model || 'NEXA Auto',
    systemPrompt: systemPrompt || undefined,
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.conversations.set(conv.id, conv);
  return res.status(201).json({ conversation: conv });
});

// GET /api/conversations/:id
chatRouter.get('/conversations/:id', authenticate, (req: any, res) => {
  const conv = db.conversations.get(req.params.id);
  if (!conv || conv.userId !== req.user.id) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages = Array.from(db.messages.values())
    .filter((m) => m.conversationId === conv.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return res.json({ conversation: conv, messages });
});

// PATCH /api/conversations/:id
chatRouter.patch('/conversations/:id', authenticate, (req: any, res) => {
  const conv = db.conversations.get(req.params.id);
  if (!conv || conv.userId !== req.user.id) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const { title, isPinned, projectId, model } = req.body;
  if (title !== undefined) conv.title = title;
  if (isPinned !== undefined) conv.isPinned = isPinned;
  if (projectId !== undefined) conv.projectId = projectId;
  if (model !== undefined) conv.model = model;
  conv.updatedAt = new Date().toISOString();

  db.conversations.set(conv.id, conv);
  return res.json({ conversation: conv });
});

// DELETE /api/conversations/:id
chatRouter.delete('/conversations/:id', authenticate, (req: any, res) => {
  const conv = db.conversations.get(req.params.id);
  if (!conv || conv.userId !== req.user.id) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  db.conversations.delete(conv.id);
  // delete associated messages
  for (const [key, msg] of db.messages.entries()) {
    if (msg.conversationId === conv.id) {
      db.messages.delete(key);
    }
  }

  return res.json({ success: true, message: 'Conversation deleted' });
});

// POST /api/chat (Streaming SSE Endpoint)
chatRouter.post('/chat', authenticate, async (req: any, res) => {
  const { conversationId, content, model, attachments, enableTools } = req.body;
  const userId = req.user.id;

  if (!content && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message content or attachment is required' });
  }

  let conv: Conversation | undefined;
  if (conversationId) {
    conv = db.conversations.get(conversationId);
  }

  if (!conv) {
    // Generate intelligent title from first 6 words
    const titleSnippet = content ? content.trim().split(/\s+/).slice(0, 6).join(' ') : 'New Multimodal Session';
    conv = {
      id: `conv-${Date.now()}`,
      userId,
      projectId: req.body.projectId || null,
      title: titleSnippet,
      model: model || 'NEXA Auto',
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.conversations.set(conv.id, conv);
  }

  // Save User message
  const userMsg: Message = {
    id: `msg-${Date.now()}-u`,
    conversationId: conv.id,
    role: 'user',
    content: content || '',
    attachments: attachments || [],
    createdAt: new Date().toISOString(),
  };
  db.messages.set(userMsg.id, userMsg);

  // Retrieve message history for context
  const history = Array.from(db.messages.values())
    .filter((m) => m.conversationId === conv!.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Check if tools should be executed automatically (e.g. calculator, dataset search)
  const toolCalls: ToolCall[] = [];
  const citations: Citation[] = [];

  const lowerContent = (content || '').toLowerCase();
  const cleanLower = lowerContent.replace(/[?.,!]/g, '').trim();

  // Current local time & date in Asia/Kolkata
  const now = new Date();
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);

  const isTimeQuery =
    /^(what('?s| is) (the )?time( now)?|what time is it|current time|time now|tell me the (current )?time|what is the current time)$/i.test(cleanLower);

  const isDateQuery =
    /^(what('?s| is) (today'?s |the )?date( today)?|what is the date|today'?s date|current date)$/i.test(cleanLower);

  // 1. Check for arithmetic calculation: e.g. "calculate 25 * 14" or "What is 25 * 40?"
  let directMathAnswer: string | null = null;
  const normalizedMathContent = (content || '').replace(/=\s*$/, '').trim();
  const mathQueryMatch = normalizedMathContent.match(/(?:what is|calculate|compute|solve|how much is)?\s*([0-9\s+\-*/×÷().%^]+)(?:\?|$)/i);
  if (mathQueryMatch && mathQueryMatch[1]) {
    const candidate = mathQueryMatch[1].trim();
    if (/[+\-*/×÷^]/.test(candidate) && /[0-9]/.test(candidate)) {
      const val = evaluateSafeMath(candidate);
      if (val !== null) {
        directMathAnswer = `${candidate.replace(/\*/g, '×').trim()} = ${Number(val.toFixed(6))}`;
        toolCalls.push({
          tool: 'calculator',
          input: { expression: candidate },
          output: { result: Number(val.toFixed(6)), formatted: directMathAnswer },
          status: 'success',
        });
      }
    }
  }

  // 2. Check for dataset search
  if (lowerContent.includes('dataset') || lowerContent.includes('data source') || lowerContent.includes('world bank') || lowerContent.includes('who')) {
    toolCalls.push({
      tool: 'dataset_search',
      input: { query: content },
      output: { datasetsIndexed: 6, verifiedAuthorities: ['World Bank', 'WHO', 'NASA GISS', 'Eurostat', 'IMF', 'NOAA'] },
      status: 'success',
    });
    citations.push({
      id: 'cit-ds-01',
      title: 'Global Data Catalog: Curated International Repositories',
      url: '/app/data',
      snippet: 'Authoritative datasets from official multilateral and national statistical agencies.',
      publisher: 'NEXA Global Data Index',
    });
  }

  // Check if direct response applies for time, date, or simple arithmetic query
  let directAnswer: string | null = null;
  if (isTimeQuery) {
    directAnswer = `The current time is ${timeStr} IST.`;
  } else if (isDateQuery) {
    directAnswer = `Today's date is ${dateStr} (IST).`;
  } else if (directMathAnswer && /^(what is|calculate|compute|how much is)?\s*[0-9\s+\-*/×÷().%^]+=?[?]?$/i.test((content || '').trim())) {
    directAnswer = directMathAnswer;
  }

  // Support non-streaming requests when stream === false
  if (req.body.stream === false || (req.headers.accept === 'application/json' && !req.headers.accept?.includes('text/event-stream'))) {
    if (directAnswer) {
      return res.json({ success: true, response: directAnswer });
    }
    try {
      const aiProvider = getAIProvider();
      const requestedModel = model || conv.model || 'NEXA Auto';
      const formattedMessages = history.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        attachments: m.attachments,
      }));
      const chatResult = await aiProvider.generateChat({
        messages: formattedMessages,
        model: requestedModel,
        attachments,
      });
      return res.json({ success: true, response: chatResult.content });
    } catch (err: any) {
      console.error('[AI] Non-streaming chat error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Unable to process the request right now.',
        response: err?.message || 'Unable to process the request right now.',
      });
    }
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send conversation init payload
  res.write(`data: ${JSON.stringify({ type: 'init', conversation: conv, userMessage: userMsg })}\n\n`);

  if (toolCalls.length > 0) {
    for (const tc of toolCalls) {
      res.write(`data: ${JSON.stringify({ type: 'tool_call', toolCall: tc })}\n\n`);
    }
  }

  const aiProvider = getAIProvider();
  const requestedModel = model || conv.model || 'NEXA Auto';

  const assistantMsgId = `msg-${Date.now()}-a`;
  let accumulatedText = '';

  try {
    const formattedMessages = history.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      attachments: m.attachments,
    }));

    if (directAnswer) {
      accumulatedText = directAnswer;
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: directAnswer })}\n\n`);
    } else {
      await aiProvider.streamChat(
        {
          messages: formattedMessages,
          model: requestedModel,
          attachments,
          systemPrompt:
            `You are NEXA AI, an intelligent, universal workspace assistant. Provide rigorous, precise, beautifully formatted answers. Directly answer the user's question without preamble.

MATHEMATICAL NOTATION & FORMULA RENDERING RULES:
- Never display raw LaTeX commands directly to the user (e.g. NEVER render 10\\text{ cm} or 0.5\\text{ Nm}^{-1} as plain text).
- Always return properly delimited mathematical expressions:
  * Use \\( ... \\) for inline mathematics (e.g., The mass is \\(m=0.05\\,\\mathrm{kg}\\)).
  * Use $$ ... $$ or \\[ ... \\] for display mathematics.
- Units: Format units with \\mathrm{} and thin spaces, e.g. \\(10\\,\\mathrm{cm}\\), \\(0.1\\,\\mathrm{m}\\), \\(0.5\\,\\mathrm{N\\,m^{-1}}\\), \\(0.1\\,\\mathrm{T}\\), \\(50\\,\\mathrm{g}\\), \\(0.05\\,\\mathrm{kg}\\), \\(10\\,\\Omega\\).
- Variables: Mathematical variables must be placed in math delimiters so they are typeset properly (e.g. \\(l\\), \\(k\\), \\(B\\), \\(m\\), \\(R\\), \\(v\\), \\(t\\), \\(N\\)).
- For mathematical or physics solutions, follow a step-by-step structure:
  1. Given values
  2. Relevant formula
  3. Substitution
  4. Simplification
  5. Final result with units
  6. Optional verification
- Fractions: Use display fractions $$\\frac{a}{b}$$ rather than inline slashes where appropriate.
- Greek letters and symbols: Use \\omega, \\gamma, \\lambda, \\mu, \\theta, \\sigma, \\Omega, \\pm, \\leq, \\geq, \\approx, \\infty inside math delimiters.
- For complex multi-step problems, you can optionally include a structured JSON block with "type": "math_solution" containing step items and final_answer.`,
        },
        (chunk) => {
          if (chunk.text) {
            accumulatedText += chunk.text;
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk.text })}\n\n`);
          }
        }
      );
    }

    // Save assistant message
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId: conv.id,
      role: 'assistant',
      content: accumulatedText,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      citations: citations.length > 0 ? citations : undefined,
      provider: aiProvider.name,
      model: requestedModel,
      createdAt: new Date().toISOString(),
    };
    db.messages.set(assistantMsg.id, assistantMsg);

    // Update conversation timestamp
    conv.updatedAt = new Date().toISOString();
    db.conversations.set(conv.id, conv);

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        message: assistantMsg,
        citations,
      })}\n\n`
    );
    res.end();
  } catch (err: any) {
    console.error('Chat streaming error:', err);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: err.message || 'Error occurred while streaming AI response',
      })}\n\n`
    );
    res.end();
  }
});

// POST /api/messages/:id/feedback
chatRouter.post('/messages/:id/feedback', authenticate, (req, res) => {
  const { feedback } = req.body;
  const msg = db.messages.get(req.params.id);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  msg.feedback = feedback === 'like' || feedback === 'dislike' ? feedback : null;
  db.messages.set(msg.id, msg);
  return res.json({ success: true, message: msg });
});

// GET /api/provider-status
chatRouter.get('/provider-status', (req, res) => {
  return res.json(getProviderStatus());
});

// Helper for non-streaming direct API requests
async function handleJsonGenerate(req: any, res: any) {
  try {
    const { message, content, messages, model } = req.body;
    const query = (message || content || (messages && messages[messages.length - 1]?.content) || '').trim();

    if (!query) {
      return res.status(400).json({ success: false, response: 'Message content is required' });
    }

    const cleanLower = query.toLowerCase().replace(/[?.,!]/g, '').trim();
    const now = new Date();
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now);
    const dateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now);

    if (
      /^(what('?s| is) (the )?time( now)?|what time is it|current time|time now|tell me the (current )?time|what is the current time)$/i.test(
        cleanLower
      )
    ) {
      return res.json({ success: true, response: `The current time is ${timeStr} IST.` });
    }

    if (
      /^(what('?s| is) (today'?s |the )?date( today)?|what is the date|today'?s date|current date)$/i.test(
        cleanLower
      )
    ) {
      return res.json({ success: true, response: `Today's date is ${dateStr} (IST).` });
    }

    const mathMatch = query.match(/(?:what is|calculate|compute|solve|how much is)?\s*([0-9\s+\-*/×÷().%^]+)(?:\?|$)/i);
    if (mathMatch && mathMatch[1]) {
      const candidate = mathMatch[1].trim();
      if (/[+\-*/×÷^]/.test(candidate) && /[0-9]/.test(candidate)) {
        const val = evaluateSafeMath(candidate);
        if (val !== null) {
          return res.json({
            success: true,
            response: `${candidate.replace(/\*/g, '×').trim()} = ${Number(val.toFixed(6))}`,
          });
        }
      }
    }

    const aiProvider = getAIProvider();
    const formatted = messages || [{ role: 'user', content: query }];
    const result = await aiProvider.generateChat({
      messages: formatted,
      model: model || 'NEXA Auto',
    });

    return res.json({ success: true, response: result.content });
  } catch (err: any) {
    console.error('[AI] Direct generate error:', err);
    return res.status(500).json({ success: false, response: 'Unable to process the request right now.' });
  }
}

// POST /api/chat/generate and POST /api/generate
chatRouter.post('/chat/generate', handleJsonGenerate);
chatRouter.post('/generate', handleJsonGenerate);
