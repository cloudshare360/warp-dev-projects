const express = require('express');
const { list } = require('../controllers');
const { 
  validators, 
  authMiddleware,
  generalRateLimit
} = require('../middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     List:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         color:
 *           type: string
 *           pattern: '^#([0-9a-f]{3}){1,2}$'
 *         isPublic:
 *           type: boolean
 *         userId:
 *           type: string
 *         todoCount:
 *           type: number
 *         completedTodoCount:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateListRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         color:
 *           type: string
 *           pattern: '^#([0-9a-f]{3}){1,2}$'
 *         isPublic:
 *           type: boolean
 *           default: false
 *     
 *     UpdateListRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         color:
 *           type: string
 *           pattern: '^#([0-9a-f]{3}){1,2}$'
 *         isPublic:
 *           type: boolean
 *     
 *     ListStats:
 *       type: object
 *       properties:
 *         list:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             description:
 *               type: string
 *         stats:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             completed:
 *               type: number
 *             pending:
 *               type: number
 *             highPriority:
 *               type: number
 *             mediumPriority:
 *               type: number
 *             lowPriority:
 *               type: number
 *             overdue:
 *               type: number
 *             completionPercentage:
 *               type: number
 */

// Apply authentication middleware to all list routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/lists:
 *   get:
 *     summary: Get all lists for authenticated user
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in list names and descriptions
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public/private lists
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt, todoCount]
 *           default: updatedAt
 *         description: Sort field
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
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
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
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
 *                     lists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/List'
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
 */
router.get('/',
  validators.queryLists,
  list.getLists
);

/**
 * @swagger
 * /api/lists:
 *   post:
 *     summary: Create a new list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListRequest'
 *     responses:
 *       201:
 *         description: List created successfully
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
 *                       $ref: '#/components/schemas/List'
 *       400:
 *         description: Validation error or list name already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/',
  validators.createList,
  list.createList
);

/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     summary: Get a specific list by ID
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     responses:
 *       200:
 *         description: List retrieved successfully
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
 *                       $ref: '#/components/schemas/List'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
router.get('/:id',
  validators.listIdParam,
  list.getListById
);

/**
 * @swagger
 * /api/lists/{id}:
 *   put:
 *     summary: Update a list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateListRequest'
 *     responses:
 *       200:
 *         description: List updated successfully
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
 *                       $ref: '#/components/schemas/List'
 *       400:
 *         description: Validation error or list name already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
router.put('/:id',
  validators.listIdParam,
  validators.updateList,
  list.updateList
);

/**
 * @swagger
 * /api/lists/{id}:
 *   delete:
 *     summary: Delete a list and all its todos
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     responses:
 *       200:
 *         description: List deleted successfully
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
 *                     deletedTodos:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
router.delete('/:id',
  validators.listIdParam,
  list.deleteList
);

/**
 * @swagger
 * /api/lists/{id}/stats:
 *   get:
 *     summary: Get list statistics
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     responses:
 *       200:
 *         description: List statistics retrieved successfully
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
 *                   $ref: '#/components/schemas/ListStats'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
router.get('/:id/stats',
  validators.listIdParam,
  list.getListStats
);

/**
 * @swagger
 * /api/lists/{id}/duplicate:
 *   post:
 *     summary: Duplicate a list with all its todos
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID to duplicate
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the duplicated list (optional)
 *     responses:
 *       201:
 *         description: List duplicated successfully
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
 *                       $ref: '#/components/schemas/List'
 *                     duplicatedTodos:
 *                       type: number
 *       400:
 *         description: List name already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
router.post('/:id/duplicate',
  validators.listIdParam,
  generalRateLimit,
  list.duplicateList
);

/**
 * @swagger
 * /api/lists/{id}/share:
 *   patch:
 *     summary: Toggle list sharing (public/private)
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     responses:
 *       200:
 *         description: List sharing toggled successfully
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
 *                         isPublic:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
router.patch('/:id/share',
  validators.listIdParam,
  list.toggleListSharing
);

module.exports = router;