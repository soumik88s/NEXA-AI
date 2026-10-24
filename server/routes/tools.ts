import { Router } from 'express';
import { authenticate } from './auth';
import { ToolRegistry, executeTool } from '../tools/index';

export const toolsRouter = Router();

// GET /api/tools
toolsRouter.get('/tools', (req, res) => {
  const tools = Object.values(ToolRegistry).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    outputSchema: t.outputSchema,
  }));
  return res.json({ tools });
});

// POST /api/tools/execute
toolsRouter.post('/tools/execute', authenticate, async (req, res) => {
  const { toolName, input } = req.body;
  if (!toolName) {
    return res.status(400).json({ error: 'toolName is required' });
  }

  try {
    const result = await executeTool(toolName, input || {});
    return res.json({ success: true, toolName, result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
