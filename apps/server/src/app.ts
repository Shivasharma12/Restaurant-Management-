import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { generalLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { swaggerSpec } from './swagger';

// Route imports
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import profileRoutes from './routes/profile.routes';
import aiRoutes from './routes/ai.routes';
import ownerRoutes from './routes/owner.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// ── Security Headers ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disabled for API; frontend handles CSP
  })
);

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL ?? 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Request Logger ─────────────────────────────────────────────
app.use(requestLogger);

// ── Rate Limiting ──────────────────────────────────────────────
app.use('/api', generalLimiter);

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ── Swagger API Docs ──────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API Routes ────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/menu`, menuRoutes);
app.use(`${API}/cart`, cartRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/profile`, profileRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/owner`, ownerRoutes);
app.use(`${API}/admin`, adminRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
  });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

export default app;
