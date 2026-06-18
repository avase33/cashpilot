import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { config } from './config/index.js';

import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import invoiceRoutes from './routes/invoices.js';
import billRoutes from './routes/bills.js';
import forecastRoutes from './routes/forecast.js';
import alertRoutes from './routes/alerts.js';
import reportRoutes from './routes/reports.js';
import teamRoutes from './routes/team.js';

const app = express();

// Security & middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/team', teamRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', version: '1.0.0', env: config.nodeEnv }));

// 404
app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND', path: req.path }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'INTERNAL_ERROR', message: config.nodeEnv === 'development' ? err.message : 'Internal server error' });
});

// Connect to MongoDB
async function start() {
  try {
    await mongoose.connect(config.mongo.uri);
    console.log('MongoDB connected');
    app.listen(config.port, () => console.log(`CashPilot API running on port ${config.port}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

// Scheduled alert checks — every 6 hours
cron.schedule('0 */6 * * *', async () => {
  try {
    const { default: Organization } = await import('./models/Organization.js');
    const { runAlertChecks } = await import('./services/alertService.js');
    const orgs = await Organization.find({}).select('_id');
    for (const org of orgs) {
      await runAlertChecks(org._id);
    }
    console.log(`Alert checks ran for ${orgs.length} orgs`);
  } catch (err) {
    console.error('Alert check error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

start();
