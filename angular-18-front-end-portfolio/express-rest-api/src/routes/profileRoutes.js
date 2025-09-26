/**
 * Profile Routes
 * Routes for managing profile information
 */

const express = require('express');
const jsonServerService = require('../services/jsonServerService');
const { asyncHandler, createSuccessResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Portfolio profile management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the profile
 *           example: 1
 *         name:
 *           type: string
 *           description: Full professional name
 *           example: "Sri Ramanujam"
 *         title:
 *           type: string
 *           description: Current job title
 *           example: "Solution Architect & Technical Leader"
 *         tagline:
 *           type: string
 *           description: Professional tagline
 *           example: "Transforming Business Through Innovative Technology Solutions"
 *         email:
 *           type: string
 *           format: email
 *           description: Professional email address
 *           example: "sri.ramanujam@example.com"
 *         phone:
 *           type: string
 *           description: Phone number
 *           example: "+1-555-123-4567"
 *         location:
 *           type: string
 *           description: Current location
 *           example: "San Francisco, CA, USA"
 *         timezone:
 *           type: string
 *           description: Timezone
 *           example: "PST"
 *         availability:
 *           type: string
 *           description: Current availability status
 *           example: "Available for new opportunities"
 *         summary:
 *           type: string
 *           description: Professional summary
 *           example: "Accomplished Solution Architect with 15+ years of experience..."
 *         avatar:
 *           type: string
 *           description: Path to profile image
 *           example: "/assets/images/profile/sri-profile.jpg"
 *         resume:
 *           type: string
 *           description: Path to resume PDF
 *           example: "/assets/documents/sri-ramanujam-resume.pdf"
 *         socialLinks:
 *           type: object
 *           properties:
 *             linkedin:
 *               type: string
 *               format: uri
 *               example: "https://linkedin.com/in/sri-ramanujam"
 *             github:
 *               type: string
 *               format: uri
 *               example: "https://github.com/sri-ramanujam"
 *             twitter:
 *               type: string
 *               format: uri
 *               example: "https://twitter.com/sri_architect"
 *             website:
 *               type: string
 *               format: uri
 *               example: "https://sri-architect.com"
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *           description: Key career highlights
 *           example: ["15+ years of software development experience", "Led teams of 20+ developers"]
 *         workingHours:
 *           type: string
 *           example: "9 AM - 6 PM PST"
 *         responseTime:
 *           type: string
 *           example: "Within 24 hours"
 *         preferredContactMethod:
 *           type: string
 *           enum: [email, phone, linkedin]
 *           example: "email"
 *         remoteWork:
 *           type: boolean
 *           description: Open to remote work
 *           example: true
 *         relocation:
 *           type: boolean
 *           description: Open to relocation
 *           example: false
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *           description: Spoken languages
 *           example: ["English", "Hindi", "Tamil"]
 *         interests:
 *           type: array
 *           items:
 *             type: string
 *           description: Professional interests
 *           example: ["Technology Innovation", "Team Mentoring"]
 *       required:
 *         - id
 *         - name
 *         - title
 *         - email
 *         - location
 *         - summary
 */

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get profile information
 *     description: Retrieve the complete profile information for the portfolio
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Profile information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Profile'
 *             example:
 *               success: true
 *               message: "Profile retrieved successfully"
 *               data:
 *                 id: 1
 *                 name: "Sri Ramanujam"
 *                 title: "Solution Architect & Technical Leader"
 *                 email: "sri.ramanujam@example.com"
 *                 summary: "Accomplished Solution Architect with 15+ years of experience..."
 *               meta:
 *                 timestamp: "2024-09-20T14:00:00Z"
 *                 version: "1.0.0"
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Fetching profile information', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
  
  const profile = await jsonServerService.getById('profile', 1);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Profile retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    profileId: profile.id,
    profileName: profile.name,
  });
  
  res.status(200).json(createSuccessResponse(
    profile,
    'Profile retrieved successfully',
    { 
      responseTime: `${responseTime}ms`,
      cached: false,
    }
  ));
}));

/**
 * @swagger
 * /api/v1/profile:
 *   put:
 *     summary: Update profile information
 *     description: Update the complete profile information
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *           example:
 *             id: 1
 *             name: "Sri Ramanujam"
 *             title: "Senior Solution Architect"
 *             email: "sri.ramanujam@example.com"
 *             summary: "Updated professional summary..."
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Service unavailable
 */
router.put('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Updating profile information', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    fieldsToUpdate: Object.keys(req.body),
  });
  
  // Ensure ID is set to 1 (single profile)
  const profileData = { ...req.body, id: 1 };
  
  const updatedProfile = await jsonServerService.update('profile', 1, profileData);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Profile updated successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    profileId: updatedProfile.id,
    fieldsUpdated: Object.keys(req.body),
  });
  
  res.status(200).json(createSuccessResponse(
    updatedProfile,
    'Profile updated successfully',
    { 
      responseTime: `${responseTime}ms`,
      fieldsUpdated: Object.keys(req.body),
    }
  ));
}));

/**
 * @swagger
 * /api/v1/profile:
 *   patch:
 *     summary: Partially update profile information
 *     description: Update specific fields of the profile
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availability:
 *                 type: string
 *                 example: "Currently employed, open to opportunities"
 *               location:
 *                 type: string
 *                 example: "New York, NY, USA"
 *               summary:
 *                 type: string
 *                 example: "Updated professional summary..."
 *           example:
 *             availability: "Currently employed, open to opportunities"
 *             location: "New York, NY, USA"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid request data
 *       503:
 *         description: Service unavailable
 */
router.patch('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Partially updating profile information', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    fieldsToUpdate: Object.keys(req.body),
  });
  
  const updatedProfile = await jsonServerService.patch('profile', 1, req.body);
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Profile partially updated successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    profileId: updatedProfile.id,
    fieldsUpdated: Object.keys(req.body),
  });
  
  res.status(200).json(createSuccessResponse(
    updatedProfile,
    'Profile updated successfully',
    { 
      responseTime: `${responseTime}ms`,
      fieldsUpdated: Object.keys(req.body),
      updateType: 'partial',
    }
  ));
}));

/**
 * @swagger
 * /api/v1/profile/summary:
 *   get:
 *     summary: Get profile summary
 *     description: Get a condensed version of the profile with key information only
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Profile summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         title:
 *                           type: string
 *                         email:
 *                           type: string
 *                         location:
 *                           type: string
 *                         availability:
 *                           type: string
 *                         socialLinks:
 *                           type: object
 *                         highlights:
 *                           type: array
 *                           items:
 *                             type: string
 *             example:
 *               success: true
 *               message: "Profile summary retrieved successfully"
 *               data:
 *                 id: 1
 *                 name: "Sri Ramanujam"
 *                 title: "Solution Architect & Technical Leader"
 *                 email: "sri.ramanujam@example.com"
 *                 location: "San Francisco, CA, USA"
 *                 availability: "Available for new opportunities"
 *       503:
 *         description: Service unavailable
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Fetching profile summary', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
  
  const profile = await jsonServerService.getById('profile', 1);
  
  // Extract only summary fields
  const profileSummary = {
    id: profile.id,
    name: profile.name,
    title: profile.title,
    email: profile.email,
    location: profile.location,
    availability: profile.availability,
    socialLinks: profile.socialLinks,
    highlights: profile.highlights,
    remoteWork: profile.remoteWork,
    relocation: profile.relocation,
  };
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Profile summary retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    profileId: profile.id,
  });
  
  res.status(200).json(createSuccessResponse(
    profileSummary,
    'Profile summary retrieved successfully',
    { 
      responseTime: `${responseTime}ms`,
      type: 'summary',
      fieldsIncluded: Object.keys(profileSummary),
    }
  ));
}));

/**
 * @swagger
 * /api/v1/profile/contact:
 *   get:
 *     summary: Get contact information
 *     description: Get only the contact-related information from the profile
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Contact information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         location:
 *                           type: string
 *                         timezone:
 *                           type: string
 *                         socialLinks:
 *                           type: object
 *                         workingHours:
 *                           type: string
 *                         responseTime:
 *                           type: string
 *                         preferredContactMethod:
 *                           type: string
 *       503:
 *         description: Service unavailable
 */
router.get('/contact', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Fetching contact information', {
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
  
  const profile = await jsonServerService.getById('profile', 1);
  
  // Extract only contact fields
  const contactInfo = {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    timezone: profile.timezone,
    socialLinks: profile.socialLinks,
    workingHours: profile.workingHours,
    responseTime: profile.responseTime,
    preferredContactMethod: profile.preferredContactMethod,
  };
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Contact information retrieved successfully', {
    requestId: req.id,
    responseTime: `${responseTime}ms`,
    profileId: profile.id,
  });
  
  res.status(200).json(createSuccessResponse(
    contactInfo,
    'Contact information retrieved successfully',
    { 
      responseTime: `${responseTime}ms`,
      type: 'contact',
      fieldsIncluded: Object.keys(contactInfo),
    }
  ));
}));

module.exports = router;