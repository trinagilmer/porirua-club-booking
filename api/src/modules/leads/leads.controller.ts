import { Request, Response } from 'express';
import { createLead, getLeads } from './leads.service';
import { createLeadSchema } from './leads.schema';

export async function postLead(req: Request, res: Response) {
  try {
    const validated = createLeadSchema.parse(req.body);
    const lead = await createLead(validated);
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getLeadsHandler(req: Request, res: Response) {
  const { status, owner } = req.query;
  try {
    const leads = await getLeads({ status, owner });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
}
