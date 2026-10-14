import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAuditAnalysis, handleEditorAi, handleChat } from './src/server/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Audit Para Analysis Endpoint
app.post('/api/audit/analyze', async (req: Request, res: Response) => {
  try {
    const result = await handleAuditAnalysis(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error during audit analysis:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal audit processing error.',
    });
  }
});

// In-Editor AI Assistant Endpoint
app.post('/api/audit/editor-ai', async (req: Request, res: Response) => {
  try {
    const result = await handleEditorAi(req.body);
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// General Chatbot Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const response = await handleChat(req.body);
    return res.json({ success: true, response });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// In development, hook up Vite dev server middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Government of Pakistan CAP-AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
