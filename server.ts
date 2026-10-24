import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/auth';
import { chatRouter } from './server/routes/chat';
import { projectsRouter } from './server/routes/projects';
import { filesRouter } from './server/routes/files';
import { datasetsRouter } from './server/routes/datasets';
import { dataRouter } from './server/routes/data';
import { researchRouter } from './server/routes/research';
import { toolsRouter } from './server/routes/tools';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Security & Body parsing
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api', chatRouter);
  app.use('/api', projectsRouter);
  app.use('/api', filesRouter);
  app.use('/api', datasetsRouter);
  app.use('/api/data', dataRouter);
  app.use('/api', researchRouter);
  app.use('/api', toolsRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'NEXA AI Core',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Vite middleware in dev or static serving in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`  NEXA AI Server running on http://0.0.0.0:${PORT}`);
    console.log(`  Mode: ${isProd ? 'Production' : 'Development with Vite middleware'}`);
    console.log(`========================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
