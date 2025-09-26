/**
 * Skills Routes
 * Routes for managing skills information
 */

const express = require('express');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Skills
 *   description: Professional skills management
 */

/**
 * @swagger
 * /api/v1/skills:
 *   get:
 *     summary: Get all skills
 *     description: Retrieve all skills organized by categories
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by skill category
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by skill level
 *       - in: query
 *         name: certified
 *         schema:
 *           type: boolean
 *         description: Filter by certification status
 *     responses:
 *       200:
 *         description: Skills retrieved successfully
 *       503:
 *         description: Service unavailable
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { category, level, certified, ...filters } = req.query;
  
  logger.info('Fetching skills', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    filters: { category, level, certified, ...filters },
  });
  
  let queryParams = { ...filters };
  
  // Apply filters
  if (category) queryParams.category = category;
  if (level) queryParams.level = parseInt(level);
  if (certified !== undefined) queryParams.certified = certified === 'true';
  
  const result = await jsonServerService.getAll('skills', queryParams);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Skills retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    categoriesCount: result.data.length,
    filters: Object.keys(queryParams),
  });
  
  res.status(200).json(createSuccessResponse(
    result.data,
    'Skills retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      categoriesCount: result.data.length,
      filters: Object.keys(queryParams).length > 0 ? queryParams : null,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/skills/{id}:
 *   get:
 *     summary: Get specific skill category
 *     description: Retrieve a specific skill category by ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Skill category ID
 *     responses:
 *       200:
 *         description: Skill category retrieved successfully
 *       404:
 *         description: Skill category not found
 *       503:
 *         description: Service unavailable
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  logger.info('Fetching specific skill category', {
    requestId: req.id,
    skillCategoryId: id,
    timestamp: new Date().toISOString(),
  });
  
  const skillCategory = await jsonServerService.getById('skills', id);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Skill category retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    skillCategoryId: skillCategory.id,
    category: skillCategory.category,
    skillsCount: skillCategory.skills?.length || 0,
  });
  
  res.status(200).json(createSuccessResponse(
    skillCategory,
    'Skill category retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      skillCategoryId: skillCategory.id,
      skillsCount: skillCategory.skills?.length || 0,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/skills/search:
 *   get:
 *     summary: Search skills
 *     description: Search skills by name or category
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "JavaScript"
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Missing search query
 *       503:
 *         description: Service unavailable
 */
router.get('/search', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { q: query } = req.query;
  
  if (!query) {
    return res.status(400).json(createSuccessResponse(
      null,
      'Search query is required',
      { responseTime: `${Date.now() - startTime}ms` }
    ));
  }
  
  logger.info('Searching skills', {
    requestId: req.id,
    query,
    timestamp: new Date().toISOString(),
  });
  
  const result = await jsonServerService.search('skills', query);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Skills search completed', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    query,
    resultsCount: result.data.length,
  });
  
  res.status(200).json(createSuccessResponse(
    result.data,
    `Found ${result.data.length} skill categories`,
    {
      responseTime: `${responseTime}ms`,
      query,
      count: result.data.length,
      action: 'searched',
    }
  ));
}));

module.exports = router;