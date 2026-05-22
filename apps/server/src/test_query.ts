import { prisma } from './lib/prisma';

async function main() {
  try {
    console.log("Connecting database...");
    const restaurant = await prisma.restaurant.findFirst({
      where: { deletedAt: null },
    });
    console.log("Restaurant found:", restaurant?.id, restaurant?.name);
    if (!restaurant) {
      console.log("No restaurant found!");
      return;
    }
    
    console.log("Running aggregation query...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStats = await prisma.order.aggregate({
      where: { restaurantId: restaurant.id, createdAt: { gte: today } },
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
    });
    console.log("Today stats:", todayStats);

    console.log("Running raw SQL query...");
    const last7DaysRevenue = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt")::text as date,
        SUM(total)::float as revenue,
        COUNT(id)::int as orders
      FROM orders
      WHERE "restaurantId" = ${restaurant.id}
        AND "createdAt" >= NOW() - INTERVAL '7 days'
        AND status != 'CANCELLED'
        AND "deletedAt" IS NULL
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
    console.log("7 days revenue raw query output:", last7DaysRevenue);
  } catch (error) {
    console.error("ERROR running test query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
