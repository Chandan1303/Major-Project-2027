import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { sequelize } from './config/database.js';
import './models/index.js';

// Routes
import authRoutes         from './routes/authRoutes.js';
import dashboardRoutes    from './routes/dashboardRoutes.js';
import farmRoutes         from './routes/farmRoutes.js';
import predictionRoutes   from './routes/predictionRoutes.js';
import weatherRoutes      from './routes/weatherRoutes.js';
import soilRoutes         from './routes/soilRoutes.js';
import varietyRoutes      from './routes/varietyRoutes.js';
import alertRoutes        from './routes/alertRoutes.js';
import reportRoutes       from './routes/reportRoutes.js';
import mlRoutes           from './routes/mlRoutes.js';
import chatRoutes         from './routes/chatRoutes.js';
import profileRoutes      from './routes/profileRoutes.js';
import adminRoutes        from './routes/adminRoutes.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL and JWT_SECRET must be set.');
}

const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(o => o.trim()).filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
  return isLocal;
}

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => isAllowedOrigin(origin) ? cb(null, true) : cb(new Error('CORS blocked')),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000 }));

// API Routes
app.use('/api/auth',        authRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/farms',       farmRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/weather',     weatherRoutes);
app.use('/api/soil',        soilRoutes);
app.use('/api/varieties',   varietyRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/reports',     reportRoutes);
app.use('/api/ml',          mlRoutes);
app.use('/api/chat',        chatRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/admin',       adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: err.message || 'Something went wrong.' });
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return sequelize.sync({ alter: false });
  })
  .then(() => app.listen(process.env.PORT || 5000, '0.0.0.0', () =>
    console.log(`API running on ${process.env.PORT || 5000}`)
  ))
  .catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });
