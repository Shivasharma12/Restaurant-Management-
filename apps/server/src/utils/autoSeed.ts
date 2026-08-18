import { UserRole, ItemBadge } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { logger } from './logger';

export async function ensureDatabaseSeeded(): Promise<void> {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin@qrrestaurant.com';
    const adminExists = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    const upstatesRestaurant = await prisma.restaurant.findFirst({
      where: { slug: 'upstates' },
    });

    if (adminExists && upstatesRestaurant) {
      logger.info('🌱 Database seed check: Super admin & demo restaurant upstates already exist.');
      return;
    }

    logger.info('🌱 Auto-seeding database with live default credentials and demo restaurant upstates...');

    // 1. Super Admin
    const adminPasswordHash = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD ?? 'Admin@123456',
      12
    );

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash: adminPasswordHash,
        isVerified: true,
      },
      create: {
        name: process.env.SUPER_ADMIN_NAME ?? 'Platform Admin',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: UserRole.SUPER_ADMIN,
        isVerified: true,
      },
    });

    // 2. Restaurant Owner
    const ownerPasswordHash = await bcrypt.hash('Owner@123456', 12);
    const owner = await prisma.user.upsert({
      where: { email: 'owner@upstates.com' },
      update: {
        passwordHash: ownerPasswordHash,
        isVerified: true,
      },
      create: {
        name: 'Rajan Sharma',
        email: 'owner@upstates.com',
        passwordHash: ownerPasswordHash,
        phone: '9876543210',
        role: UserRole.RESTAURANT_OWNER,
        isVerified: true,
      },
    });

    // 3. Sample Customer
    const customerPasswordHash = await bcrypt.hash('Customer@123', 12);
    const customer = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {
        passwordHash: customerPasswordHash,
        isVerified: true,
      },
      create: {
        name: 'Priya Mehta',
        email: 'customer@example.com',
        passwordHash: customerPasswordHash,
        phone: '9876543211',
        role: UserRole.CUSTOMER,
        isVerified: true,
        loyaltyPoints: 150,
        walletBalance: 200,
      },
    });

    // 4. Upstates Restaurant
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: 'upstates' },
      update: {
        isApproved: true,
        isOpen: true,
      },
      create: {
        name: 'Upstates',
        slug: 'upstates',
        description: 'A premium dining experience featuring authentic North Indian and Mughlai cuisine in a warm, welcoming ambiance.',
        cuisineType: 'North Indian, Mughlai',
        logo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
        address: '42, Connaught Place',
        city: 'New Delhi',
        pincode: '110001',
        phone: '9876543210',
        isOpen: true,
        isApproved: true,
        minOrderValue: 200,
        deliveryRadius: 10,
        commissionRate: 5,
        themeColor: '#E85D04',
        ownerId: owner.id,
      },
    });

    // Check if menu categories exist for Upstates
    const catCount = await prisma.menuCategory.count({
      where: { restaurantId: restaurant.id },
    });

    if (catCount === 0) {
      const starters = await prisma.menuCategory.create({
        data: { name: 'Starters', restaurantId: restaurant.id, sortOrder: 1 },
      });
      const mainCourse = await prisma.menuCategory.create({
        data: { name: 'Main Course', restaurantId: restaurant.id, sortOrder: 2 },
      });
      const breads = await prisma.menuCategory.create({
        data: { name: 'Breads', restaurantId: restaurant.id, sortOrder: 3 },
      });
      const desserts = await prisma.menuCategory.create({
        data: { name: 'Desserts', restaurantId: restaurant.id, sortOrder: 4 },
      });
      const beverages = await prisma.menuCategory.create({
        data: { name: 'Beverages', restaurantId: restaurant.id, sortOrder: 5 },
      });

      await prisma.menuItem.createMany({
        data: [
          { name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled to perfection.', price: 320, categoryId: starters.id, restaurantId: restaurant.id, isVeg: true, isAvailable: true, badges: [ItemBadge.BEST_SELLER] },
          { name: 'Butter Chicken', description: 'Succulent chicken pieces simmered in a rich tomato sauce.', price: 420, categoryId: mainCourse.id, restaurantId: restaurant.id, isVeg: false, isAvailable: true, badges: [ItemBadge.BEST_SELLER] },
          { name: 'Butter Naan', description: 'Soft leavened bread brushed with butter.', price: 60, categoryId: breads.id, restaurantId: restaurant.id, isVeg: true, isAvailable: true, badges: [ItemBadge.BEST_SELLER] },
          { name: 'Gulab Jamun', description: 'Soft milk dumplings in rose syrup.', price: 120, categoryId: desserts.id, restaurantId: restaurant.id, isVeg: true, isAvailable: true, badges: [ItemBadge.BEST_SELLER] },
          { name: 'Mango Lassi', description: 'Thick yogurt drink blended with Alphonso mangoes.', price: 120, categoryId: beverages.id, restaurantId: restaurant.id, isVeg: true, isAvailable: true, badges: [ItemBadge.POPULAR] },
        ],
      });
    }

    logger.info('🎉 Auto-seed complete! Super Admin (admin@qrrestaurant.com), Owner (owner@upstates.com), Customer (customer@example.com), and Restaurant /r/upstates are active.');
  } catch (error: any) {
    logger.warn(`⚠️ Auto-seed encounter: ${error.message}`);
  }
}
