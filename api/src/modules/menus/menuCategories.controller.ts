import { Request, Response } from 'express';
import { getMenuCategories, createMenuCategory } from './menuCategories.service';
import { createMenuCategorySchema } from './menuCategories.schema';

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await getMenuCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function postCategory(req: Request, res: Response) {
  try {
    const validated = createMenuCategorySchema.parse(req.body);
    const category = await createMenuCategory(validated);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
