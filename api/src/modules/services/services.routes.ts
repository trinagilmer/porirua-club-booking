import { Router } from 'express';
import { getCatalog, postService, patchService } from './services.controller';

const router = Router();

router.get('/services/catalog', getCatalog);
router.post('/services/catalog', postService);
router.patch('/services/catalog/:id', patchService);

export default router;
