import { Router } from 'express';
import { getKpiBuckets, getDashboardTable } from './dashboard.controller';

const router = Router();

router.get('/dashboard/kpi-buckets', getKpiBuckets);
router.get('/dashboard/table', getDashboardTable);

export default router;
