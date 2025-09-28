import { Request, Response } from 'express';
import { verifyPoliPaySignature, upsertPayment, updateProposalEventStatus } from './polipay.service';

export async function handlePoliPayWebhook(req: Request, res: Response) {
  const signature = req.headers['x-polipay-signature'] as string;
  const payload = req.body;

  try {
    if (!verifyPoliPaySignature(signature, JSON.stringify(payload))) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    await upsertPayment(payload);
    await updateProposalEventStatus(payload);

    res.json({ message: 'Webhook processed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}
