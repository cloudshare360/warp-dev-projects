/**
 * Certifications Routes
 * Routes for managing professional certifications
 */

const express = require('express');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Certifications
 *   description: Professional certifications management
 */

router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { active, issuer } = req.query;
  
  let queryParams = {};
  if (active !== undefined) queryParams.active = active === 'true';
  if (issuer) queryParams.issuer = issuer;
  
  const result = await jsonServerService.getAll('certifications', { 
    ...queryParams, 
    _sort: 'issueDate', 
    _order: 'desc' 
  });
  
  const responseTime = Date.now() - startTime;
  
  res.status(200).json(createSuccessResponse(
    result.data,
    'Certifications retrieved successfully',
    { responseTime: `${responseTime}ms`, count: result.data.length }
  ));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  const certification = await jsonServerService.getById('certifications', id);
  
  const responseTime = Date.now() - startTime;
  
  res.status(200).json(createSuccessResponse(
    certification,
    'Certification retrieved successfully',
    { responseTime: `${responseTime}ms`, certificationId: certification.id }
  ));
}));

module.exports = router;