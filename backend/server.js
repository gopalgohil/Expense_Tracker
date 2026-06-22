import dotenv from 'dotenv';
dotenv.config();

import express    from 'express';
import cors       from 'cors';
import cookieParser from 'cookie-parser';
import connectDB  from './config/db.js';
import authRoutes      from './routes/authRoutes.js';
import expenseRoutes   from './routes/expenseRoutes.js';
import budgetRoutes    from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes      from './routes/userRoutes.js';
import { startRecurringJob } from './jobs/recurringJob.js';

connectDB();
startRecurringJob();

const app = express();

// ── CORS — allow local dev + Vercel production frontend ──
const normalizeOrigin = (url = '') => url.trim().replace(/\/$/, '');

const buildAllowedOrigins = () => {
  const origins = new Set([
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]);

  const addOrigin = (value) => {
    if (!value) return;
    const cleaned = normalizeOrigin(value);
    if (!cleaned) return;
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      origins.add(cleaned);
      return;
    }
    origins.add(`https://${cleaned}`);
    origins.add(`http://${cleaned}`);
  };

  addOrigin(process.env.CLIENT_URL);
  addOrigin(process.env.FRONTEND_URL);

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(addOrigin);
  }

  return origins;
};

const allowedOrigins = buildAllowedOrigins();

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.has(normalized)) return true;
  if (normalized.endsWith('.vercel.app')) return true;
  if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      // Return the exact origin string — required when credentials: true
      return callback(null, origin || true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/expenses',  expenseRoutes);
app.use('/api/budgets',   budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user',      userRoutes);

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

// Error handling middleware (fallback)
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`CORS allowed origins: ${[...allowedOrigins].join(', ')} + *.vercel.app`);
  console.log(`CLIENT_URL: ${process.env.CLIENT_URL || '(not set)'}`);
});

// Trigger reload to restart the server under the original nodemon process
