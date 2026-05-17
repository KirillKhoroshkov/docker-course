const express = require('express');
const cors = require('cors');
const menuRoutes = require('./routes/menu');
const redisService = require('./services/redisService');
const { createLogger } = require('./utils/logger');

const logger = createLogger('menu-service');

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    const redisHealth = await redisService.healthCheck();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'menu-service',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      redis: redisHealth ? 'connected' : 'disconnected'
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/api/menu', menuRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Galactic Pizza Menu Service',
    service: 'menu-service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      menu: '/api/menu',
      popular: '/api/menu/popular',
      recommendations: '/api/menu/recommendations/:userId'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found in our galactic database',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await redisService.disconnect();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await redisService.disconnect();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});

// Start server
const server = app.listen(PORT, HOST, async () => {
  logger.info(`Galactic Pizza Menu Service started on ${HOST}:${PORT}`);
  
  // Initialize Redis connection
  try {
    await redisService.connect();
    logger.info('Connected to Redis cache');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error:', error);
  process.exit(1);
});

module.exports = app;
