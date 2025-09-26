/**
 * Education Routes
 * Routes for managing education information
 */

const express = require('express');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Education
 *   description: Educational background management
 */

/**
 * @swagger
 * /api/v1/education:
 *   get:
 *     summary: Get all education entries
 *     description: Retrieve all educational background information
 *     tags: [Education]
 *     responses:
 *       200:
 *         description: Education entries retrieved successfully
 *       503:
 *         description: Service unavailable
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Fetching education entries', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
  
  const result = await jsonServerService.getAll('education', { _sort: 'graduationYear', _order: 'desc' });
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Education entries retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    count: result.data.length,
  });
  
  res.status(200).json(createSuccessResponse(
    result.data,
    'Education entries retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      count: result.data.length,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/education/{id}:
 *   get:
 *     summary: Get specific education entry
 *     description: Retrieve a specific education entry by ID
 *     tags: [Education]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education entry ID
 *     responses:
 *       200:
 *         description: Education entry retrieved successfully
 *       404:
 *         description: Education entry not found
 *       503:
 *         description: Service unavailable
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  logger.info('Fetching specific education entry', {
    requestId: req.id,
    educationId: id,
    timestamp: new Date().toISOString(),
  });
  
  const education = await jsonServerService.getById('education', id);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Education entry retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    educationId: education.id,
    institution: education.institution,
    degree: education.degree,
  });
  
  res.status(200).json(createSuccessResponse(
    education,
    'Education entry retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      educationId: education.id,
    }
  ));
}));

module.exports = router;