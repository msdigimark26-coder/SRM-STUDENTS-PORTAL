import { Router, Request, Response } from 'express';
import { sessionManager } from '../services/PlaywrightSessionManager';

const router = Router();

router.post('/connect', async (req: Request, res: Response) => {
  // Fire and forget, the frontend will poll status
  sessionManager.connect().catch(console.error);
  res.json({ status: 'initiated' });
});

router.get('/connect/status', (req: Request, res: Response) => {
  res.json({ state: sessionManager.getState() });
});

router.get('/connect/data', (req: Request, res: Response) => {
  const data = sessionManager.getData();
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: 'No data available' });
  }
});

router.post('/disconnect', async (req: Request, res: Response) => {
  await sessionManager.disconnect();
  res.json({ status: 'disconnected' });
});

export default router;
