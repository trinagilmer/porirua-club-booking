import { query } from '../../db';

export async function getKpiBucketsByDateRange(from: string, to: string) {
  // Example query to compute Confirmed $, Pending $, Leads $ by date range
  // Adjust table and column names as per your schema

  const confirmedResult = await query(
    `SELECT COALESCE(SUM(value), 0) AS confirmed_total
     FROM functions
     WHERE status = 'confirmed' AND event_date >= $1 AND event_date <= $2`,
    [from, to]
  );

  const pendingResult = await query(
    `SELECT COALESCE(SUM(value), 0) AS pending_total
     FROM functions
     WHERE status = 'pending' AND event_date >= $1 AND event_date <= $2`,
    [from, to]
  );

  const leadsResult = await query(
    `SELECT COUNT(*) AS leads_count
     FROM leads
     WHERE created_at >= $1 AND created_at <= $2`,
    [from, to]
  );

  return {
    confirmed: confirmedResult.rows[0].confirmed_total,
    pending: pendingResult.rows[0].pending_total,
    leads: Number(leadsResult.rows[0].leads_count),
  };
}

export async function getDashboardTableData() {
  // Example query to fetch table data
  // Adjust table and column names as per your schema
  const result = await query(
    `SELECT f.name, f.status, f.event_date, f.size, f.room, f.created_at, f.last_emailed, f.value
     FROM functions f
     ORDER BY f.event_date DESC`
  );
  return result.rows;
}
