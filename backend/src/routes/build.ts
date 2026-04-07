import { Router, Request, Response } from 'express';
import {
  startBuild,
  stopBuild,
  continueBuild,
  addInstruction,
  getSession,
} from '../state/buildSession';

const router = Router();

router.post('/start', (req: Request, res: Response): void => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }
  const session = startBuild(prompt.trim());
  res.json({ success: true, session });
});

router.post('/stop', (_req: Request, res: Response): void => {
  const session = stopBuild();
  if (!session) {
    res.status(404).json({ error: 'No active build session' });
    return;
  }
  res.json({ success: true, session });
});

router.post('/continue', (_req: Request, res: Response): void => {
  const session = continueBuild();
  if (!session) {
    res.status(404).json({ error: 'No active build session' });
    return;
  }
  res.json({ success: true, session });
});

router.post('/instruction', (req: Request, res: Response): void => {
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim() === '') {
    res.status(400).json({ error: 'content is required' });
    return;
  }
  const session = addInstruction(content.trim());
  if (!session) {
    res.status(404).json({ error: 'No active build session' });
    return;
  }
  res.json({ success: true, session });
});

router.get('/status', (req: Request, res: Response): void => {
  const accept = req.headers.accept || '';

  if (accept.includes('text/event-stream')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const send = () => {
      const session = getSession();
      const data = session
        ? { id: session.id, status: session.status, currentStage: session.currentStage, updatedAt: session.updatedAt }
        : { status: 'idle' };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send();
    const interval = setInterval(send, 1000);

    req.on('close', () => {
      clearInterval(interval);
    });
  } else {
    const session = getSession();
    if (!session) {
      res.json({ status: 'idle' });
      return;
    }
    res.json({
      id: session.id,
      status: session.status,
      currentStage: session.currentStage,
      stages: session.stages,
      updatedAt: session.updatedAt,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    });
  }
});

router.get('/logs', (_req: Request, res: Response): void => {
  const session = getSession();
  if (!session) {
    res.json({ logs: [] });
    return;
  }
  res.json({ logs: session.logs });
});

router.get('/files', (_req: Request, res: Response): void => {
  const session = getSession();
  if (!session) {
    res.json({ files: [] });
    return;
  }
  res.json({ files: session.files });
});

export default router;
