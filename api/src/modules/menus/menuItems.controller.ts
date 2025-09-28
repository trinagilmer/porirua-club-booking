import { Request, Response } from 'express';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from './menuItems.service';
import { createMenuItemSchema, updateMenuItemSchema } from './menuItems.schema';

export async function getItems(req: Request, res: Response) {
  const { category, active } = req.query;
  try {
    const items = await getMenuItems({ category, active: active === 'true' });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
}

export async function postItem(req: Request, res: Response) {
  try {
    const validated = createMenuItemSchema.parse(req.body);
    const item = await createMenuItem(validated);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function patchItem(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const validated = updateMenuItemSchema.parse(req.body);
    const item = await updateMenuItem(id, validated);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteItem(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await deleteMenuItem(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
}
