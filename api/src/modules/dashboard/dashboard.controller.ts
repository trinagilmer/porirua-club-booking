import { Request, Response } from 'express';
import { getKpiBucketsByDateRange, getDashboardTableData } from './dashboard.service';

export async function getKpiBuckets(req: Request, res: Response) {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to date' });
  }

  try {
    const data = await getKpiBucketsByDateRange(from as string, to as string);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPI buckets' });
  }
}

export async function getDashboardTable(req: Request, res: Response) {
  try {
    const data = await getDashboardTableData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard table data' });
  }
}
