/**
 * Projects Routes
 * Routes for managing project portfolio information
 */

const express = require('express');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project portfolio management
 */

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve all portfolio projects
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured projects only
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Completed, In Progress, Planned, On Hold]
 *         description: Filter by project status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by project category
 *       - in: query
 *         name: technology
 *         schema:
 *           type: string
 *         description: Filter by technology used
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *       503:
 *         description: Service unavailable
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { featured, status, category, technology, ...filters } = req.query;
  
  logger.info('Fetching projects', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    filters: { featured, status, category, technology, ...filters },
  });
  
  let queryParams = { ...filters };
  
  // Apply filters
  if (featured !== undefined) queryParams.featured = featured === 'true';
  if (status) queryParams.status = status;
  if (category) queryParams.category = category;
  if (technology) queryParams.technologies_like = technology;
  
  const result = await jsonServerService.getAll('projects', queryParams);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Projects retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    count: result.data.length,
    filters: Object.keys(queryParams),
  });
  
  res.status(200).json(createSuccessResponse(
    result.data,
    'Projects retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      count: result.data.length,
      filters: Object.keys(queryParams).length > 0 ? queryParams : null,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get specific project
 *     description: Retrieve a specific project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *       404:
 *         description: Project not found
 *       503:
 *         description: Service unavailable
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  logger.info('Fetching specific project', {
    requestId: req.id,
    projectId: id,
    timestamp: new Date().toISOString(),
  });
  
  const project = await jsonServerService.getById('projects', id);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Project retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    projectId: project.id,
    projectName: project.name,
    category: project.category,
  });
  
  res.status(200).json(createSuccessResponse(
    project,
    'Project retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      projectId: project.id,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/projects/featured:
 *   get:
 *     summary: Get featured projects
 *     description: Retrieve only featured projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Featured projects retrieved successfully
 *       503:
 *         description: Service unavailable
 */
router.get('/featured', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Fetching featured projects', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
  
  const result = await jsonServerService.filter('projects', { featured: true });
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Featured projects retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    count: result.data.length,
  });
  
  res.status(200).json(createSuccessResponse(
    result.data,
    'Featured projects retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      count: result.data.length,
      type: 'featured',
    }
  ));
}));

module.exports = router;