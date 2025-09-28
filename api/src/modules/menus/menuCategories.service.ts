import { CreateMenuCategoryInput } from './menuCategories.schema';
import { query } from '../../db';

export async function getMenuCategories() {
  const result = await query('SELECT * FROM menu_categories ORDER BY name');
  return result.rows;
}

export async function createMenuCategory(input: CreateMenuCategoryInput) {
  const { name, description, active } = input;
  const result = await query(
    'INSERT INTO menu_categories (name, description, active) VALUES ($1, $2, $3) RETURNING *',
    [name, description, active]
  );
  return result.rows[0];
}
