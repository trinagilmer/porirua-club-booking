import { Request, Response } from 'express';
import { listMenuItemPrices, addMenuItemPrice, deleteMenuItemPrice } from './menuItemPrices.service';

export async function getMenuItemPrices(req: Request, res: Response) {
  const { menuItemId } = req.params;
  try {
    const prices = await listMenuItemPrices(menuItemId);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu item prices' });
  }
}

export async function postMenuItemPrice(req: Request, res: Response) {
  const { menuItemId } = req.params;
  const { price } = req.body;
  try {
    const newPrice = await addMenuItemPrice(menuItemId, price);
    res.status(201).json(newPrice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteMenuItemPriceHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await deleteMenuItemPrice(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item price' });
  }
}
