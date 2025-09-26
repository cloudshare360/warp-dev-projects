/**
 * Experience Routes
 * Routes for managing work experience information
 */

const express = require('express');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Experience
 *   description: Professional work experience management
 */

/**
 * @swagger
 * /api/v1/experience:
 *   get:
 *     summary: Get all work experience
 *     description: Retrieve all professional work experience entries
 *     tags: [Experience]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [startDate, endDate, company, position]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company name
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by employment type
 *       - in: query
 *         name: remote
 *         schema:
 *           type: boolean
 *         description: Filter by remote work status
 *     responses:
 *       200:
 *         description: Experience entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *       503:
 *         description: Service unavailable
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { sort, order = 'desc', limit, offset, ...filters } = req.query;
  
  logger.info('Fetching work experience', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    filters: Object.keys(filters),
    sort,
    order,
  });
  
  let queryParams = { ...filters };
  
  // Apply sorting if specified
  if (sort) {
    queryParams._sort = sort;
    queryParams._order = order;
  } else {
    // Default sort by start date descending (most recent first)
    queryParams._sort = 'startDate';
    queryParams._order = 'desc';
  }
  
  // Apply pagination if specified
  if (limit) {
    queryParams._limit = parseInt(limit);
  }
  if (offset) {
    queryParams._start = parseInt(offset);
  }
  
  const result = await jsonServerService.getAll('experience', queryParams);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Work experience retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    count: result.data.length,
    filters: Object.keys(filters),
  });
  
  res.status(200).json(createSuccessResponse(
    result.data,
    'Work experience retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      count: result.data.length,
      sort: sort ? { field: sort, order } : { field: 'startDate', order: 'desc' },
      filters: Object.keys(filters).length > 0 ? filters : null,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/experience/{id}:
 *   get:
 *     summary: Get specific work experience
 *     description: Retrieve a specific work experience entry by ID
 *     tags: [Experience]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Experience entry ID
 *     responses:
 *       200:
 *         description: Experience entry retrieved successfully
 *       404:
 *         description: Experience entry not found
 *       503:
 *         description: Service unavailable
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  logger.info('Fetching specific work experience', {
    requestId: req.id,
    experienceId: id,
    timestamp: new Date().toISOString(),
  });
  
  const experience = await jsonServerService.getById('experience', id);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Work experience retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    experienceId: experience.id,
    company: experience.company,
    position: experience.position,
  });
  
  res.status(200).json(createSuccessResponse(
    experience,
    'Work experience retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      experienceId: experience.id,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/experience:
 *   post:
 *     summary: Create new work experience
 *     description: Add a new work experience entry
 *     tags: [Experience]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company
 *               - position
 *               - startDate
 *               - description
 *             properties:
 *               company:
 *                 type: string
 *                 example: "Tech Innovation Corp"
 *               position:
 *                 type: string
 *                 example: "Senior Solution Architect"
 *               location:
 *                 type: string
 *                 example: "San Francisco, CA"
 *               startDate:
 *                 type: string
 *                 example: "2024-01"
 *               endDate:
 *                 type: string
 *                 example: "present"
 *               type:
 *                 type: string
 *                 enum: [Full-time, Part-time, Contract, Freelance]
 *                 example: "Full-time"
 *               remote:
 *                 type: boolean
 *                 example: true
 *               description:
 *                 type: string
 *                 example: "Leading technical architecture and team development..."
 *     responses:
 *       201:
 *         description: Experience entry created successfully
 *       400:
 *         description: Invalid request data
 *       503:
 *         description: Service unavailable
 */
router.post('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Creating new work experience', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    company: req.body.company,
    position: req.body.position,
  });
  
  const newExperience = await jsonServerService.create('experience', req.body);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Work experience created successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    experienceId: newExperience.id,
    company: newExperience.company,
    position: newExperience.position,
  });
  
  res.status(201).json(createSuccessResponse(
    newExperience,
    'Work experience created successfully',
    {
      responseTime: `${responseTime}ms`,
      experienceId: newExperience.id,
      action: 'created',
    }
  ));
}));

/**
 * @swagger
 * /api/v1/experience/{id}:
 *   put:
 *     summary: Update work experience
 *     description: Update a complete work experience entry
 *     tags: [Experience]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Experience entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Experience entry updated successfully
 *       404:
 *         description: Experience entry not found
 *       400:
 *         description: Invalid request data
 *       503:
 *         description: Service unavailable
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  logger.info('Updating work experience', {
    requestId: req.id,
    experienceId: id,
    timestamp: new Date().toISOString(),
    fieldsToUpdate: Object.keys(req.body),
  });
  
  const experienceData = { ...req.body, id: parseInt(id) };
  const updatedExperience = await jsonServerService.update('experience', id, experienceData);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Work experience updated successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    experienceId: updatedExperience.id,
    fieldsUpdated: Object.keys(req.body),
  });
  
  res.status(200).json(createSuccessResponse(
    updatedExperience,
    'Work experience updated successfully',
    {
      responseTime: `${responseTime}ms`,
      experienceId: updatedExperience.id,
      fieldsUpdated: Object.keys(req.body),
      action: 'updated',
    }
  ));
}));

/**
 * @swagger
 * /api/v1/experience/{id}:
 *   patch:
 *     summary: Partially update work experience
 *     description: Update specific fields of a work experience entry
 *     tags: [Experience]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Experience entry ID
 *     responses:
 *       200:
 *         description: Experience entry updated successfully
 *       404:
 *         description: Experience entry not found
 *       503:
 *         description: Service unavailable
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  logger.info('Partially updating work experience', {
    requestId: req.id,
    experienceId: id,
    timestamp: new Date().toISOString(),
    fieldsToUpdate: Object.keys(req.body),
  });
  
  const updatedExperience = await jsonServerService.patch('experience', id, req.body);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Work experience partially updated successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    experienceId: updatedExperience.id,
    fieldsUpdated: Object.keys(req.body),
  });
  
  res.status(200).json(createSuccessResponse(
    updatedExperience,
    'Work experience updated successfully',
    {
      responseTime: `${responseTime}ms`,
      experienceId: updatedExperience.id,
      fieldsUpdated: Object.keys(req.body),
      action: 'patched',
    }
  ));
}));

/**
 * @swagger
 * /api/v1/experience/{id}:
 *   delete:
 *     summary: Delete work experience
 *     description: Delete a work experience entry
 *     tags: [Experience]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Experience entry ID
 *     responses:
 *       200:
 *         description: Experience entry deleted successfully
 *       404:
 *         description: Experience entry not found
 *       503:
 *         description: Service unavailable
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  logger.info('Deleting work experience', {
    requestId: req.id,
    experienceId: id,
    timestamp: new Date().toISOString(),
  });
  
  await jsonServerService.delete('experience', id);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Work experience deleted successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    experienceId: id,
  });
  
  res.status(200).json(createSuccessResponse(
    { id: parseInt(id) },
    'Work experience deleted successfully',
    {
      responseTime: `${responseTime}ms`,
      experienceId: id,
      action: 'deleted',
    }
  ));
}));

/**
 * @swagger
 * /api/v1/experience/search:
 *   get:
 *     summary: Search work experience
 *     description: Search work experience entries by query
 *     tags: [Experience]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "Solution Architect"
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
  
  logger.info('Searching work experience', {
    requestId: req.id,
    query,
    timestamp: new Date().toISOString(),
  });
  
  const result = await jsonServerService.search('experience', query);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Work experience search completed', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    query,
    resultsCount: result.data.length,
  });
  
  res.status(200).json(createSuccessResponse(
    result.data,
    `Found ${result.data.length} experience entries`,
    {
      responseTime: `${responseTime}ms`,
      query,
      count: result.data.length,
      action: 'searched',
    }
  ));
}));

module.exports = router;