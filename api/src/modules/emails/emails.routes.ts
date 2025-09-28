import { Router } from 'express';
import { postSendEmail } from './emails.controller';

const router = Router();

router.post('/emails/send', postSendEmail);

export default router;
