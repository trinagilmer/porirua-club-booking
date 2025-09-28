import { Router } from 'express';
import { getCategories, postCategory } from './menuCategories.controller';

const router = Router();

router.get('/menu/categories', getCategories);
router.post('/menu/categories', postCategory);

export default router;
