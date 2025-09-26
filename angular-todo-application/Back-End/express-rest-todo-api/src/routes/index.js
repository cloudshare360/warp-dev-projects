const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const listRoutes = require('./listRoutes');
const todoRoutes = require('./todoRoutes');
const listTodoRoutes = require('./listTodoRoutes');
const { generalRateLimit } = require('../middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter JWT token in the format "Bearer {token}"
 *   
 *   responses:
 *     UnauthorizedError:
 *       description: Authentication token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Authentication failed"
 *               message:
 *                 type: string
 *                 example: "Invalid or expired token"
 *     
 *     ValidationError:
 *       description: Request validation failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Validation error"
 *               message:
 *                 type: string
 *                 example: "Field validation failed"
 *     
 *     NotFoundError:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Not found"
 *               message:
 *                 type: string
 *                 example: "Resource not found"
 *     
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Internal server error"
 *               message:
 *                 type: string
 *                 example: "Something went wrong on our end"
 *     
 *     RateLimitError:
 *       description: Rate limit exceeded
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Too many requests"
 *               message:
 *                 type: string
 *                 example: "Rate limit exceeded"
 *               retryAfter:
 *                 type: integer
 *                 example: 900
 */

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization
 *   - name: Users
 *     description: User profile management
 *   - name: Lists
 *     description: Todo list management
 *   - name: Todos
 *     description: Todo item management
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information
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
 *                   example: "Angular Todo API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: "/api/auth"
 *                     users:
 *                       type: string
 *                       example: "/api/users"
 *                     lists:
 *                       type: string
 *                       example: "/api/lists"
 *                     todos:
 *                       type: string
 *                       example: "/api/todos"
 *                     docs:
 *                       type: string
 *                       example: "/api/docs"
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Angular Todo API',
    version: process.env.API_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      lists: '/api/lists',
      todos: '/api/todos',
      docs: '/api/docs'
    }
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 1234.567
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                     total:
 *                       type: number
 */
router.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100
    }
  });
});

// Apply general rate limiting to all API routes
router.use(generalRateLimit);

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/lists', listRoutes);
router.use('/todos', todoRoutes);

// Nested route for list-specific todos
router.use('/lists/:listId/todos', listTodoRoutes);

module.exports = router;