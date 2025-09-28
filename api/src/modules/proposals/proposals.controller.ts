import { Request, Response } from 'express';
import { createProposal } from './proposals.service';
import { createProposalSchema } from './proposals.schema';
import { logProposalEmail } from './proposals.email';
import { acceptProposal } from './proposals.accept';

export async function postProposal(req: Request, res: Response) {
  try {
    const validated = createProposalSchema.parse(req.body);
    const proposal = await createProposal(validated);
    res.status(201).json(proposal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function sendProposalEmail(req: Request, res: Response) {
  const { id } = req.params;
  const emailData = req.body;
  try {
    await logProposalEmail(id, emailData);
    res.json({ message: 'Email logged and last_sent_at updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log email' });
  }
}

export async function acceptProposalHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await acceptProposal(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
}
