import { Router, Request, Response } from 'express';
import { sessionManager } from '../services/PlaywrightSessionManager';

const router = Router();

router.post('/connect', async (req: Request, res: Response) => {
  try {
    const captchaData = await sessionManager.getCaptcha();
    res.json({ status: 'initiated', ...captchaData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate connection' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const credentials = req.body;
    const data = await sessionManager.loginAndExtract(credentials);
    res.json(data);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Login failed' });
  }
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
