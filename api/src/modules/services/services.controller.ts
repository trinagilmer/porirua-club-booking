import { Request, Response } from 'express';
import { getServiceCatalog, createService, updateService } from './services.service';
import { createServiceSchema, updateServiceSchema } from './services.schema';

// Dummy RBAC middleware
function checkRole(req: Request, res: Response, next: Function) {
  const role = req.headers['x-user-role'];
  if (role === 'manager' || role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
}

export async function getCatalog(req: Request, res: Response) {
  try {
    const catalog = await getServiceCatalog();
    res.json(catalog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service catalog' });
  }
}

export const postService = [checkRole, async (req: Request, res: Response) => {
  try {
    const validated = createServiceSchema.parse(req.body);
    const service = await createService(validated);
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}];

export const patchService = [checkRole, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const validated = updateServiceSchema.parse(req.body);
    const service = await updateService(id, validated);
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}];
