import { z } from 'zod';

const operatingHoursDaySchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM format'),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM format'),
  closed: z.boolean().default(false),
});

export const restaurantProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  cuisineType: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  deliveryRadius: z.number().positive().max(100).optional(),
  minOrderValue: z.number().min(0).default(0),
  themeColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color')
    .optional(),
  operatingHours: z
    .object({
      monday: operatingHoursDaySchema,
      tuesday: operatingHoursDaySchema,
      wednesday: operatingHoursDaySchema,
      thursday: operatingHoursDaySchema,
      friday: operatingHoursDaySchema,
      saturday: operatingHoursDaySchema,
      sunday: operatingHoursDaySchema,
    })
    .optional(),
});

export const restaurantToggleSchema = z.object({
  isOpen: z.boolean(),
});

export const restaurantApprovalSchema = z.object({
  isApproved: z.boolean(),
  isSuspended: z.boolean().optional(),
});

export type RestaurantProfileInput = z.infer<typeof restaurantProfileSchema>;
export type RestaurantToggleInput = z.infer<typeof restaurantToggleSchema>;
export type RestaurantApprovalInput = z.infer<typeof restaurantApprovalSchema>;
