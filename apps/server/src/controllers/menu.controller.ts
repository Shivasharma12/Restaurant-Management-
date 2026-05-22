import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { cacheGet, cacheSet } from '../services/redis.service';

export async function getRestaurantMenu(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const restaurantSlug = req.params.restaurantSlug as string;
    const cacheKey = `menu:${restaurantSlug}`;

    // Try cache first (TTL 5 minutes)
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached, fromCache: true });
      return;
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        slug: restaurantSlug,
        deletedAt: null,
        isApproved: true,
        isSuspended: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        cuisineType: true,
        logo: true,
        banner: true,
        address: true,
        city: true,
        phone: true,
        operatingHours: true,
        isOpen: true,
        minOrderValue: true,
        deliveryRadius: true,
        themeColor: true,
      },
    });

    if (!restaurant) {
      throw new AppError(
        'Restaurant not found or not yet approved.',
        404,
        'RESTAURANT_NOT_FOUND'
      );
    }

    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            variants: true,
            addOns: true,
          },
        },
      },
    });

    const data = { restaurant, categories };

    // Cache for 5 minutes
    await cacheSet(cacheKey, data, 300);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
