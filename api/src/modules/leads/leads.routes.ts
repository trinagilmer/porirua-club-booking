import { Router } from 'express';
import { postLead } from './leads.controller';

const router = Router();

router.post('/leads', postLead);

export default router;
