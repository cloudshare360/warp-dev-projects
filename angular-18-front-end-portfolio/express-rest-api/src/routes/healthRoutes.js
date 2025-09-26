/**
 * Health Check Routes
 * Provides health status endpoints for API monitoring
 */

const express = require('express');
const config = require('../config/config');
const logger = require('../utils/logger');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic API health status
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: string
 *                       example: "123.45s"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                 meta:
 *                   $ref: '#/components/schemas/SuccessResponse/properties/meta'
 *       503:
 *         description: API is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    version: config.api.version,
    environment: config.server.nodeEnv,
    pid: process.pid,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
  };
  
  const responseTime = Date.now() - startTime;
  
  logger.debug('Health check performed', {
    responseTime: `${responseTime}ms`,
    status: healthData.status,
  });
  
  res.status(200).json(createSuccessResponse(
    healthData,
    'API is healthy',
    { responseTime: `${responseTime}ms` }
  ));
}));

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns detailed health status including external services
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         uptime:
 *                           type: string
 *                         version:
 *                           type: string
 *                     services:
 *                       type: object
 *                       properties:
 *                         jsonServer:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             responseTime:
 *                               type: string
 *                     system:
 *                       type: object
 *                       properties:
 *                         memory:
 *                           type: object
 *                         cpu:
 *                           type: object
 *                         platform:
 *                           type: string
 *       503:
 *         description: One or more services are unhealthy
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  let overallStatus = 'healthy';
  
  // Check JSON Server health
  let jsonServerHealth = {
    status: 'unknown',
    responseTime: 'N/A',
    dataSize: 0,
  };
  
  try {
    jsonServerHealth = await jsonServerService.healthCheck();
    jsonServerHealth.status = 'healthy';
  } catch (error) {
    jsonServerHealth.status = 'unhealthy';
    jsonServerHealth.error = error.message;
    overallStatus = 'degraded';
    
    logger.warn('JSON Server health check failed', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
  
  const healthData = {
    overall: {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
    },
    api: {
      status: 'healthy',
      uptime: `${process.uptime().toFixed(2)}s`,
      version: config.api.version,
      environment: config.server.nodeEnv,
      pid: process.pid,
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    },
    services: {
      jsonServer: {
        status: jsonServerHealth.status,
        url: config.jsonServer.url,
        responseTime: jsonServerHealth.responseTime,
        dataSize: jsonServerHealth.dataSize,
        timeout: `${config.jsonServer.timeout}ms`,
        error: jsonServerHealth.error || null,
      },
    },
    system: {
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
      loadAverage: process.platform !== 'win32' ? process.loadavg() : null,
    },
    config: {
      corsOrigin: config.cors.origin,
      rateLimiting: {
        enabled: true,
        windowMs: config.rateLimiting.windowMs,
        maxRequests: config.rateLimiting.maxRequests,
      },
      logging: {
        level: config.logging.level,
      },
      features: {
        swagger: config.swagger.enabled,
        compression: config.security.compressionEnabled,
        helmet: config.security.helmetEnabled,
        cache: config.cache.enabled,
      },
    },
  };
  
  const responseTime = Date.now() - startTime;
  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  
  logger.info('Detailed health check performed', {
    overallStatus,
    jsonServerStatus: jsonServerHealth.status,
    responseTime: `${responseTime}ms`,
  });
  
  res.status(statusCode).json(createSuccessResponse(
    healthData,
    `API status: ${overallStatus}`,
    { 
      responseTime: `${responseTime}ms`,
      checks: {
        api: 'healthy',
        jsonServer: jsonServerHealth.status,
      }
    }
  ));
}));

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes/Docker readiness probe endpoint
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *       503:
 *         description: Service is not ready
 */
router.get('/readiness', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  let isReady = true;
  const checks = {};
  
  // Check JSON Server connectivity
  try {
    await jsonServerService.healthCheck();
    checks.jsonServer = 'ready';
  } catch (error) {
    checks.jsonServer = 'not_ready';
    isReady = false;
  }
  
  // Check memory usage (fail if using more than 90% of allocated memory)
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  if (memoryUsagePercent > 90) {
    checks.memory = 'high_usage';
    isReady = false;
  } else {
    checks.memory = 'ok';
  }
  
  const responseTime = Date.now() - startTime;
  const status = isReady ? 'ready' : 'not_ready';
  const statusCode = isReady ? 200 : 503;
  
  const readinessData = {
    status,
    timestamp: new Date().toISOString(),
    checks,
    memory: {
      usage: `${Math.round(memoryUsagePercent)}%`,
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    },
  };
  
  logger.debug('Readiness check performed', {
    status,
    responseTime: `${responseTime}ms`,
    checks,
  });
  
  res.status(statusCode).json(createSuccessResponse(
    readinessData,
    `Service is ${status}`,
    { responseTime: `${responseTime}ms` }
  ));
}));

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes/Docker liveness probe endpoint
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Service is alive
 *       503:
 *         description: Service should be restarted
 */
router.get('/liveness', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Simple liveness check - just verify the process is running
  const livenessData = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    pid: process.pid,
  };
  
  const responseTime = Date.now() - startTime;
  
  logger.debug('Liveness check performed', {
    status: 'alive',
    responseTime: `${responseTime}ms`,
    uptime: livenessData.uptime,
  });
  
  res.status(200).json(createSuccessResponse(
    livenessData,
    'Service is alive',
    { responseTime: `${responseTime}ms` }
  ));
}));

module.exports = router;