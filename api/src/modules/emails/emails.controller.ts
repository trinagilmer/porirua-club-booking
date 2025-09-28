import { Request, Response } from 'express';
import { sendEmail } from './emails.service';

export async function postSendEmail(req: Request, res: Response) {
  const { to, subject, templateName, variables } = req.body;

  if (!to || !subject || !templateName || !variables) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await sendEmail({ to, subject, templateName, variables });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
