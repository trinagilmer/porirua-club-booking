import { CreateLeadInput } from './leads.schema';
import { query } from '../../db';

interface GetLeadsFilters {
  status?: string | string[] | undefined;
  owner?: string | string[] | undefined;
}

export async function createLead(input: CreateLeadInput) {
  const { name, email, phone, status = 'new', owner_user_id } = input;
  const result = await query(
    `INSERT INTO leads (name, email, phone, status, owner_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, phone, status, owner_user_id]
  );
  return result.rows[0];
}

export async function getLeads(filters: GetLeadsFilters) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(`status = ANY(${idx}::text[])`);
    } else {
      conditions.push(`status = ${idx}`);
    }
    values.push(filters.status);
    idx++;
  }

  if (filters.owner) {
    if (Array.isArray(filters.owner)) {
      conditions.push(`owner_user_id = ANY(${idx}::text[])`);
    } else {
      conditions.push(`owner_user_id = ${idx}`);
    }
    values.push(filters.owner);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT * FROM leads ${whereClause} ORDER BY created_at DESC`,
    values
  );

  return result.rows;
}
