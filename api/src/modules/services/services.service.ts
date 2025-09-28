import { CreateServiceInput, UpdateServiceInput } from './services.schema';
import { query } from '../../db';

export async function getServiceCatalog() {
  const result = await query('SELECT * FROM service_catalog ORDER BY name');
  return result.rows;
}

export async function createService(input: CreateServiceInput) {
  const { name, description, active } = input;
  const result = await query(
    'INSERT INTO service_catalog (name, description, active) VALUES ($1, $2, $3) RETURNING *',
    [name, description, active]
  );
  return result.rows[0];
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const fields = Object.keys(input);
  const values = Object.values(input);

  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const result = await query(
    `UPDATE service_catalog SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
}
