import { Router } from 'express';
import { getRestaurantMenu } from '../controllers/menu.controller';

const router = Router();

/**
 * @swagger
 * /menu/{restaurantSlug}:
 *   get:
 *     summary: Get restaurant menu by slug (public)
 *     tags: [Menu]
 */
router.get('/:restaurantSlug', getRestaurantMenu);

export default router;
