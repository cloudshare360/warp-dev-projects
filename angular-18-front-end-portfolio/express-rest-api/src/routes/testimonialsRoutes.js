/**
 * Testimonials Routes
 * Routes for managing client and colleague testimonials
 */

const express = require('express');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: Client and colleague testimonials management
 */

router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { rating, relationship, company } = req.query;
  
  let queryParams = {};
  if (rating) queryParams.rating = parseInt(rating);
  if (relationship) queryParams.relationship = relationship;
  if (company) queryParams.company = company;
  
  const result = await jsonServerService.getAll('testimonials', { 
    ...queryParams, 
    _sort: 'date', 
    _order: 'desc' 
  });
  
  const responseTime = Date.now() - startTime;
  
  res.status(200).json(createSuccessResponse(
    result.data,
    'Testimonials retrieved successfully',
    { responseTime: `${responseTime}ms`, count: result.data.length }
  ));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  const testimonial = await jsonServerService.getById('testimonials', id);
  
  const responseTime = Date.now() - startTime;
  
  res.status(200).json(createSuccessResponse(
    testimonial,
    'Testimonial retrieved successfully',
    { responseTime: `${responseTime}ms`, testimonialId: testimonial.id }
  ));
}));

module.exports = router;