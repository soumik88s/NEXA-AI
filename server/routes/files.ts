import { Router } from 'express';
import { authenticate } from './auth';
import { db } from '../db/store';
import { getAIProvider } from '../providers/ai/index';
import { FileItem } from '../types';

export const filesRouter = Router();

// GET /api/files
filesRouter.get('/files', authenticate, (req: any, res) => {
  const userId = req.user.id;
  const projectId = req.query.projectId as string | undefined;

  let list = Array.from(db.files.values()).filter((f) => f.userId === userId);
  if (projectId) {
    list = list.filter((f) => f.projectId === projectId);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ files: list });
});

// GET /api/files/:id
filesRouter.get('/files/:id', authenticate, (req: any, res) => {
  const file = db.files.get(req.params.id);
  if (!file || file.userId !== req.user.id) {
    return res.status(404).json({ error: 'File not found' });
  }
  return res.json({ file });
});

// POST /api/files (Upload file base64 or raw text)
filesRouter.post('/files', authenticate, (req: any, res) => {
  const { name, size, mimeType, content, projectId } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'File name is required' });
  }

  // Extract text if plain text / json / csv
  let extractedText = '';
  if (content && typeof content === 'string') {
    if (content.startsWith('data:')) {
      const base64Data = content.split(',')[1];
      if (base64Data && (mimeType?.includes('text') || mimeType?.includes('json') || mimeType?.includes('csv'))) {
        try {
          extractedText = Buffer.from(base64Data, 'base64').toString('utf-8');
        } catch {
          extractedText = '[Binary content uploaded]';
        }
      } else {
        extractedText = `[Multimodal asset: ${mimeType || 'unknown format'} ready for vision/audio pipeline]`;
      }
    } else {
      extractedText = content;
    }
  }

  const newFile: FileItem = {
    id: `file-${Date.now()}`,
    userId,
    projectId: projectId || null,
    name,
    originalName: name,
    mimeType: mimeType || 'application/octet-stream',
    size: size || (content ? content.length : 1024),
    path: `/uploads/${name}`,
    extractedText: extractedText.slice(0, 50000), // First 50k chars for safety
    status: 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.files.set(newFile.id, newFile);
  return res.status(201).json({ file: newFile });
});

// DELETE /api/files/:id
filesRouter.delete('/files/:id', authenticate, (req: any, res) => {
  const file = db.files.get(req.params.id);
  if (!file || file.userId !== req.user.id) {
    return res.status(404).json({ error: 'File not found' });
  }

  db.files.delete(file.id);
  return res.json({ success: true, message: 'File deleted' });
});

// POST /api/files/:id/summarize
filesRouter.post('/files/:id/summarize', authenticate, async (req: any, res) => {
  const file = db.files.get(req.params.id);
  if (!file || file.userId !== req.user.id) {
    return res.status(404).json({ error: 'File not found' });
  }

  const aiProvider = getAIProvider();
  const prompt = `Provide an executive summary and key takeaways of the following file:
Filename: ${file.name}
MIME Type: ${file.mimeType}
File Content Sample:
${file.extractedText?.slice(0, 10000) || '[No text extracted]'}`;

  try {
    const result = await aiProvider.generateChat({
      messages: [{ role: 'user', content: prompt }],
      model: 'NEXA Fast',
    });
    return res.json({ summary: result.content, provider: result.provider });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to summarize file: ' + err.message });
  }
});

// POST /api/files/:id/ask
filesRouter.post('/files/:id/ask', authenticate, async (req: any, res) => {
  const file = db.files.get(req.params.id);
  if (!file || file.userId !== req.user.id) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const aiProvider = getAIProvider();
  const prompt = `Context document:
Filename: ${file.name}
Content:
${file.extractedText?.slice(0, 15000) || '[No text extracted]'}

Question: "${question}"

Answer the question strictly based on the provided document. If information is missing from the document, explicitly indicate that.`;

  try {
    const result = await aiProvider.generateChat({
      messages: [{ role: 'user', content: prompt }],
      model: 'NEXA Reason',
    });
    return res.json({ answer: result.content, provider: result.provider });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process document Q&A: ' + err.message });
  }
});
