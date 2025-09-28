import { Router } from 'express';
import { getItems, postItem, patchItem, deleteItem } from './menuItems.controller';

const router = Router();

router.get('/menu/items', getItems);
router.post('/menu/items', postItem);
router.patch('/menu/items/:id', patchItem);
router.delete('/menu/items/:id', deleteItem);

export default router;
