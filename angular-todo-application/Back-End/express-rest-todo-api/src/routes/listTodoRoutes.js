const express = require('express');
const { todo } = require('../controllers');
const { 
  validators, 
  authMiddleware
} = require('../middleware');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/lists/{listId}/todos:
 *   get:
 *     summary: Get all todos for a specific list
 *     tags: [Lists, Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, and tags
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority
 *       - in: query
 *         name: isCompleted
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, priority, dueDate, createdAt, updatedAt, order]
 *           default: order
 *         description: Sort field
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Items per page (higher default for list view)
 *     responses:
 *       200:
 *         description: Todos retrieved successfully
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
 *                     list:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         color:
 *                           type: string
 *                     todos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Todo'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */

// Apply authentication middleware
router.use(authMiddleware);

// Get todos for a specific list
router.get('/',
  validators.listIdParam,
  todo.getTodosByList
);

module.exports = router;