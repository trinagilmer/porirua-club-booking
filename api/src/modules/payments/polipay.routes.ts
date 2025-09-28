import { Router } from 'express';
import { createSession } from './polipay.controller';

const router = Router();

router.post('/payments/polipay/session', createSession);

export default router;
