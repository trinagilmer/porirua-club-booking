import { Router } from 'express';
import { handlePoliPayWebhook } from './polipay.controller';

const router = Router();

router.post('/webhooks/polipay', handlePoliPayWebhook);

export default router;
