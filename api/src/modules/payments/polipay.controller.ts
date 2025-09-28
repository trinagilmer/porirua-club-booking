import { Request, Response } from 'express';
import { createPoliPaySession } from './polipay.service';

export async function createSession(req: Request, res: Response) {
  const { proposalId } = req.body;
  try {
    const session = await createPoliPaySession(proposalId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PoliPay session' });
  }
}
