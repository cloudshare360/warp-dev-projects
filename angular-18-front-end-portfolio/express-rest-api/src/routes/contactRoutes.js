/**
 * Contact Routes
 * Routes for managing contact information
 */

const express = require('express');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact information management
 */

/**
 * @swagger
 * /api/v1/contact:
 *   get:
 *     summary: Get contact information
 *     description: Retrieve contact information and availability
 *     tags: [Contact]
 *     responses:
 *       200:
 *         description: Contact information retrieved successfully
 *       503:
 *         description: Service unavailable
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Fetching contact information', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
  
  const contact = await jsonServerService.getById('contact', 1);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Contact information retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    contactId: contact.id,
  });
  
  res.status(200).json(createSuccessResponse(
    contact,
    'Contact information retrieved successfully',
    {
      responseTime: `${responseTime}ms`,
      contactId: contact.id,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/contact:
 *   patch:
 *     summary: Update contact information
 *     description: Update specific fields of contact information
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availability:
 *                 type: object
 *               location:
 *                 type: object
 *               socialMedia:
 *                 type: object
 *     responses:
 *       200:
 *         description: Contact information updated successfully
 *       400:
 *         description: Invalid request data
 *       503:
 *         description: Service unavailable
 */
router.patch('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Updating contact information', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    fieldsToUpdate: Object.keys(req.body),
  });
  
  const updatedContact = await jsonServerService.patch('contact', 1, req.body);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Contact information updated successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    contactId: updatedContact.id,
    fieldsUpdated: Object.keys(req.body),
  });
  
  res.status(200).json(createSuccessResponse(
    updatedContact,
    'Contact information updated successfully',
    {
      responseTime: `${responseTime}ms`,
      contactId: updatedContact.id,
      fieldsUpdated: Object.keys(req.body),
    }
  ));
}));

module.exports = router;