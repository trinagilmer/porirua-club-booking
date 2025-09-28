import { Request, Response } from 'express';
import { createInvoiceForProposal } from './xero.service';

export async function postXeroInvoice(req: Request, res: Response) {
  const { event_id, proposal_id, tenant_id } = req.body;
  try {
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }
    // For now, only proposal_id is used
    const response = await createInvoiceForProposal(proposal_id, tenant_id);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create/send Xero invoice' });
  }
}
