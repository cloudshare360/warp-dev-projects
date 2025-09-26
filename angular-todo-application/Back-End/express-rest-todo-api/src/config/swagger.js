const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

/**
 * Swagger JSDoc configuration options
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Angular Todo Application API',
      version: process.env.API_VERSION || '1.0.0',
      description: 'A comprehensive REST API for managing todo lists and items with user authentication, built with Node.js, Express.js, and MongoDB.',
      contact: {
        name: 'API Support',
        email: 'support@todo-api.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? (process.env.API_BASE_URL || 'https://api.todo-app.com/api')
          : `http://localhost:${process.env.PORT || 3000}/api`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format "Bearer {token}"'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'General',
        description: 'General API information and health checks'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User profile and account management endpoints'
      },
      {
        name: 'Lists',
        description: 'Todo list management endpoints'
      },
      {
        name: 'Todos',
        description: 'Todo item management endpoints'
      }
    ],
    externalDocs: {
      description: 'Find more info about the Angular Todo Application',
      url: 'https://github.com/example/angular-todo-app'
    }
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../models/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ]
};

/**
 * Generate Swagger specification
 */
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI options
 */
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    persistAuthorization: true,
    displayOperationId: false,
    displayRequestDuration: true,
    deepLinking: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    showExtensions: false,
    showCommonExtensions: false,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    validatorUrl: null
  },
  customCss: `
    .swagger-ui .topbar { 
      background-color: #2c3e50; 
    }
    .swagger-ui .topbar .link { 
      color: #ecf0f1; 
    }
    .swagger-ui .info { 
      margin: 50px 0; 
    }
    .swagger-ui .info .title { 
      color: #2c3e50; 
    }
    .swagger-ui .scheme-container {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .swagger-ui .info .description {
      color: #6c757d;
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #28a745;
      background: rgba(40, 167, 69, .1);
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #007bff;
      background: rgba(0, 123, 255, .1);
    }
    .swagger-ui .opblock.opblock-put {
      border-color: #ffc107;
      background: rgba(255, 193, 7, .1);
    }
    .swagger-ui .opblock.opblock-delete {
      border-color: #dc3545;
      background: rgba(220, 53, 69, .1);
    }
    .swagger-ui .opblock.opblock-patch {
      border-color: #6f42c1;
      background: rgba(111, 66, 193, .1);
    }
  `,
  customSiteTitle: 'Angular Todo API Documentation',
  customfavIcon: '/favicon.ico'
};

/**
 * Setup Swagger documentation middleware
 * @param {Express} app - Express application instance
 */
const setupSwagger = (app) => {
  // Serve swagger.json
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Setup Swagger UI
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Alternative endpoint for API documentation
  app.use('/docs', swaggerUi.serve);
  app.get('/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  console.log(`📚 Swagger UI available at: http://localhost:${process.env.PORT || 3000}/api/docs`);
  console.log(`📄 Swagger JSON available at: http://localhost:${process.env.PORT || 3000}/api/swagger.json`);
};

/**
 * Get Swagger specification object
 * @returns {Object} Swagger specification
 */
const getSwaggerSpec = () => swaggerSpec;

/**
 * Validate Swagger specification
 * @returns {Boolean} True if valid
 */
const validateSwaggerSpec = () => {
  try {
    const spec = getSwaggerSpec();
    
    // Basic validation checks
    if (!spec.openapi) {
      throw new Error('Missing OpenAPI version');
    }
    
    if (!spec.info || !spec.info.title || !spec.info.version) {
      throw new Error('Missing required info fields');
    }
    
    if (!spec.paths) {
      console.warn('⚠️  No paths defined in Swagger specification');
    }
    
    console.log('✅ Swagger specification is valid');
    return true;
  } catch (error) {
    console.error('❌ Swagger specification validation failed:', error.message);
    return false;
  }
};

/**
 * Generate OpenAPI specification in different formats
 */
const generateSpec = {
  /**
   * Get JSON format
   * @returns {Object} JSON specification
   */
  json: () => swaggerSpec,
  
  /**
   * Get YAML format
   * @returns {String} YAML specification
   */
  yaml: () => {
    const yaml = require('js-yaml');
    return yaml.dump(swaggerSpec);
  },
  
  /**
   * Save specification to file
   * @param {String} format - 'json' or 'yaml'
   * @param {String} filepath - File path to save
   */
  saveToFile: (format = 'json', filepath = './swagger-spec') => {
    const fs = require('fs');
    const path = require('path');
    
    try {
      let content;
      let extension;
      
      if (format.toLowerCase() === 'yaml') {
        content = generateSpec.yaml();
        extension = '.yaml';
      } else {
        content = JSON.stringify(swaggerSpec, null, 2);
        extension = '.json';
      }
      
      const fullPath = filepath + extension;
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`📄 Swagger specification saved to: ${fullPath}`);
      
      return fullPath;
    } catch (error) {
      console.error('❌ Error saving Swagger specification:', error.message);
      throw error;
    }
  }
};

module.exports = {
  setupSwagger,
  getSwaggerSpec,
  validateSwaggerSpec,
  generateSpec,
  swaggerOptions,
  swaggerUiOptions
};