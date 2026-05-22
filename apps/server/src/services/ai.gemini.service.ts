import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

let genAI: GoogleGenerativeAI;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  }
  return genAI;
}

const MODEL_NAME = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';

// ── 3. Smart Coupon Suggestion ───────────────────────────────

export interface CouponSuggestionResult {
  couponCode: string | null;
  reason: string;
  savingsAmount: number;
}

export async function getSmartCouponSuggestion(params: {
  cartItems: Array<{ name: string; quantity: number; price: number }>;
  cartTotal: number;
  availableCoupons: Array<{
    code: string;
    type: 'FLAT' | 'PERCENT';
    value: number;
    minOrderAmount: number;
    maxDiscount?: number | null;
  }>;
}): Promise<CouponSuggestionResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `You are a smart coupon advisor for a restaurant ordering app.

Cart items:
${params.cartItems.map((i) => `- ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join('\n')}
Cart total: ₹${params.cartTotal}

Available coupons:
${params.availableCoupons
  .map(
    (c) =>
      `- Code: ${c.code} | Type: ${c.type} | Value: ${c.type === 'FLAT' ? '₹' + c.value : c.value + '%'} off | Min order: ₹${c.minOrderAmount}${c.maxDiscount ? ' | Max discount: ₹' + c.maxDiscount : ''}`
  )
  .join('\n')}

Find the single best coupon that gives the maximum savings for this cart. Only suggest a coupon if the cart meets the minimum order requirement.

Respond with ONLY valid JSON, no markdown:
{"couponCode": "BESTCODE", "reason": "One sentence explanation", "savingsAmount": 50}

If no coupon is applicable, respond:
{"couponCode": null, "reason": "Add more items to unlock coupons!", "savingsAmount": 0}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(text) as CouponSuggestionResult;
  } catch (error) {
    logger.error('Gemini coupon suggestion error:', error);
    return { couponCode: null, reason: 'Unable to load coupon suggestions right now.', savingsAmount: 0 };
  }
}

// ── 4. AI Demand Forecasting ─────────────────────────────────

export interface ForecastResult {
  demandNextWeek: Array<{ date: string; predictedOrders: number }>;
  peakHours: Array<{ hour: number; label: string; avgOrders: number }>;
  topProfitableItems: Array<{ name: string; revenue: number; orders: number }>;
  monthlyForecast: number;
  alerts: string[];
}

export async function getAIDemandForecast(params: {
  restaurantName: string;
  last30DaysOrders: Array<{
    date: string;
    totalOrders: number;
    totalRevenue: number;
    peakHour: number;
  }>;
  topItemsThisMonth: Array<{ name: string; totalQuantity: number; totalRevenue: number }>;
  currentMonthRevenue: number;
}): Promise<ForecastResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const prompt = `You are a restaurant business analyst AI for "${params.restaurantName}".

Last 30 days order data (date, orders, revenue, peak hour):
${params.last30DaysOrders
  .map((d) => `${d.date}: ${d.totalOrders} orders, ₹${d.totalRevenue} revenue, peak at ${d.peakHour}:00`)
  .join('\n')}

Top items this month:
${params.topItemsThisMonth
  .map((i) => `- ${i.name}: ${i.totalQuantity} units, ₹${i.totalRevenue} revenue`)
  .join('\n')}

Current month revenue so far: ₹${params.currentMonthRevenue}

Generate a business intelligence report. Respond with ONLY valid JSON, no markdown:
{
  "demandNextWeek": [
    {"date": "${next7Days[0]}", "predictedOrders": 45},
    ...for all 7 days
  ],
  "peakHours": [
    {"hour": 13, "label": "1 PM", "avgOrders": 25},
    ...top 6 peak hours
  ],
  "topProfitableItems": [
    {"name": "Item Name", "revenue": 15000, "orders": 120},
    ...top 5
  ],
  "monthlyForecast": 250000,
  "alerts": ["Alert message 1", "Alert message 2", ...]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(text) as ForecastResult;
  } catch (error) {
    logger.error('Gemini forecast error:', error);
    // Return stub data on error
    return {
      demandNextWeek: next7Days.map((date) => ({
        date,
        predictedOrders: Math.floor(Math.random() * 40 + 20),
      })),
      peakHours: [
        { hour: 12, label: '12 PM', avgOrders: 30 },
        { hour: 13, label: '1 PM', avgOrders: 35 },
        { hour: 19, label: '7 PM', avgOrders: 40 },
        { hour: 20, label: '8 PM', avgOrders: 38 },
        { hour: 21, label: '9 PM', avgOrders: 25 },
        { hour: 14, label: '2 PM', avgOrders: 20 },
      ],
      topProfitableItems: params.topItemsThisMonth.slice(0, 5).map((i) => ({
        name: i.name,
        revenue: i.totalRevenue,
        orders: i.totalQuantity,
      })),
      monthlyForecast: params.currentMonthRevenue * 1.1,
      alerts: ['AI forecast temporarily unavailable. Showing estimated data.'],
    };
  }
}
