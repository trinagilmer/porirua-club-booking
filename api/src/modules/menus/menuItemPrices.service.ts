import { query } from '../../db';

export async function listMenuItemPrices(menuItemId: string) {
  const result = await query('SELECT * FROM menu_item_prices WHERE menu_item_id = $1 ORDER BY price', [menuItemId]);
  return result.rows;
}

export async function addMenuItemPrice(menuItemId: string, price: number) {
  const result = await query('INSERT INTO menu_item_prices (menu_item_id, price) VALUES ($1, $2) RETURNING *', [menuItemId, price]);
  return result.rows[0];
}

export async function deleteMenuItemPrice(id: string) {
  await query('DELETE FROM menu_item_prices WHERE id = $1', [id]);
}
