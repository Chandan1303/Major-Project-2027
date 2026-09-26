import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { sequelize } from './config/database.js';
import './models/index.js';
import authRoutes from './routes/authRoutes.js';
import bhuvanRoutes from './routes/bhuvanRoutes.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL and JWT_SECRET must be set.');
}

const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  // Allow same-origin or non-browser tools (curl, postman, server-to-server)
  if (!origin) return true;

  // Check against explicitly configured FRONTEND_URL entries
  if (configuredOrigins.includes(origin)) return true;
  for (const configured of configuredOrigins) {
    try {
      if (new URL(configured).origin === origin) return true;
    } catch {}
  }

  // Allow all local development & private network origins (e.g. mobile testing on WiFi)
  // Matches localhost, 127.0.0.1, 10.x.x.x, 192.168.x.x, 172.16-31.x.x on any port
  const isLocalOrPrivate = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin
  );
  if (isLocalOrPrivate) return true;

  return false;
}

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/bhuvan', bhuvanRoutes);

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: err.message || 'Something went wrong. Please try again.' });
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return sequelize.sync({ alter: false });
  })
  .then(() =>
    app.listen(process.env.PORT || 5000, '0.0.0.0', () =>
      console.log(`API running on ${process.env.PORT || 5000}`)
    )
  )
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
