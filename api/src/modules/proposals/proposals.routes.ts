import { Router } from 'express';
import { postProposal } from './proposals.controller';

const router = Router();

router.post('/proposals', postProposal);

export default router;
