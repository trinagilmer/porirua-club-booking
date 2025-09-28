import { CreateMenuItemInput, UpdateMenuItemInput } from './menuItems.schema';
import { query } from '../../db';

interface GetMenuItemsFilters {
  category?: string | string[] | undefined;
  active?: boolean | undefined;
}

export async function getMenuItems(filters: GetMenuItemsFilters) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (filters.category) {
    if (Array.isArray(filters.category)) {
      conditions.push(`category_id = ANY($${idx}::text[])`);
    } else {
      conditions.push(`category_id = $${idx}`);
    }
    values.push(filters.category);
    idx++;
  }

  if (typeof filters.active === 'boolean') {
    conditions.push(`active = $${idx}`);
    values.push(filters.active);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(`SELECT * FROM menu_items ${whereClause} ORDER BY name`, values);
  return result.rows;
}

export async function createMenuItem(input: CreateMenuItemInput) {
  const { category_id, name, description, active, price } = input;
  const result = await query(
    `INSERT INTO menu_items (category_id, name, description, active, price) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [category_id, name, description, active, price]
  );
  return result.rows[0];
}

export async function updateMenuItem(id: string, input: UpdateMenuItemInput) {
  const fields = Object.keys(input);
  const values = Object.values(input);

  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const result = await query(
    `UPDATE menu_items SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
}

export async function deleteMenuItem(id: string) {
  await query(`DELETE FROM menu_items WHERE id = $1`, [id]);
}
