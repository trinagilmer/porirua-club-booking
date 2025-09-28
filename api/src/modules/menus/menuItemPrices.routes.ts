import { Router } from 'express';
import { getMenuItemPrices, postMenuItemPrice, deleteMenuItemPriceHandler } from './menuItemPrices.controller';

const router = Router();

router.get('/menu/items/:menuItemId/prices', getMenuItemPrices);
router.post('/menu/items/:menuItemId/prices', postMenuItemPrice);
router.delete('/menu/item-prices/:id', deleteMenuItemPriceHandler);

export default router;
