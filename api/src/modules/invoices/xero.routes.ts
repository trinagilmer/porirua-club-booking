import { Router } from 'express';
import { postXeroInvoice } from './xero.controller';

const router = Router();

router.post('/invoices/xero', postXeroInvoice);

export default router;
