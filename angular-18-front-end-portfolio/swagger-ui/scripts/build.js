/**
 * Build Script for Swagger UI
 * Generates standalone Swagger UI documentation
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const DIST_DIR = path.join(__dirname, '../dist');
const SWAGGER_UI_DIST = path.join(__dirname, '../node_modules/swagger-ui-dist');

async function build() {
  console.log(chalk.blue('🏗️  Building Swagger UI documentation...'));
  
  try {
    // Clean dist directory
    console.log(chalk.yellow('🧹 Cleaning dist directory...'));
    await fs.emptyDir(DIST_DIR);
    
    // Copy Swagger UI assets
    console.log(chalk.yellow('📁 Copying Swagger UI assets...'));
    await fs.copy(SWAGGER_UI_DIST, DIST_DIR, {
      filter: (src, dest) => {
        // Exclude unnecessary files
        const fileName = path.basename(src);
        return !fileName.includes('index.html') && 
               !fileName.includes('swagger-initializer.js') &&
               !fileName.includes('package.json') &&
               !fileName.includes('README');
      }
    });
    
    // Create custom index.html
    console.log(chalk.yellow('📄 Creating custom index.html...'));
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Portfolio REST API Documentation</title>
  <link rel="stylesheet" type="text/css" href="./swagger-ui-bundle.css" />
  <link rel="stylesheet" type="text/css" href="./swagger-ui.css" />
  <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .swagger-ui .topbar {
      background-color: #1976d2;
    }
    .swagger-ui .topbar .download-url-wrapper .select-label {
      color: #fff;
    }
    .swagger-ui .info .title {
      color: #1976d2;
    }
    .swagger-ui .scheme-container {
      background: #fff;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,.15);
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="./swagger-ui-bundle.js" charset="UTF-8"> </script>
  <script src="./swagger-ui-standalone-preset.js" charset="UTF-8"> </script>
  <script src="./swagger-initializer.js" charset="UTF-8"> </script>
</body>
</html>`;
    
    await fs.writeFile(path.join(DIST_DIR, 'index.html'), indexHtml);
    
    // Create custom swagger-initializer.js
    console.log(chalk.yellow('⚙️  Creating swagger initializer...'));
    const swaggerInitializer = `window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
    url: './swagger.json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout",
    validatorUrl: null,
    tryItOutEnabled: true,
    filter: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: "list",
    displayOperationId: false,
    displayRequestDuration: true,
    showCommonExtensions: true,
    showExtensions: true,
    onComplete: function() {
      console.log("Portfolio API documentation loaded successfully");
    },
    onFailure: function(data) {
      console.error("Failed to load Portfolio API documentation:", data);
    }
  });

  //</editor-fold>
};`;
    
    await fs.writeFile(path.join(DIST_DIR, 'swagger-initializer.js'), swaggerInitializer);
    
    // Create OpenAPI specification
    console.log(chalk.yellow('📝 Creating OpenAPI specification...'));
    const openApiSpec = {
      openapi: "3.0.0",
      info: {
        title: "Portfolio REST API",
        description: "Comprehensive REST API for Sri Ramanujam's professional portfolio website. This API provides endpoints for managing profile information, work experience, skills, projects, education, certifications, testimonials, and contact details.",
        version: "1.0.0",
        contact: {
          name: "Sri Ramanujam",
          email: "sri.ramanujam@example.com",
          url: "https://sri-architect.com"
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT"
        }
      },
      servers: [
        {
          url: "http://localhost:3000/api/v1",
          description: "Development server"
        },
        {
          url: "https://api.sri-architect.com/v1",
          description: "Production server"
        }
      ],
      tags: [
        {
          name: "Health Check",
          description: "API health monitoring endpoints"
        },
        {
          name: "Profile",
          description: "Personal and professional profile management"
        },
        {
          name: "Experience",
          description: "Work experience and career history"
        },
        {
          name: "Skills",
          description: "Technical and soft skills management"
        },
        {
          name: "Projects",
          description: "Portfolio projects and achievements"
        },
        {
          name: "Education",
          description: "Educational background and qualifications"
        },
        {
          name: "Certifications",
          description: "Professional certifications and credentials"
        },
        {
          name: "Testimonials",
          description: "Client and colleague recommendations"
        },
        {
          name: "Contact",
          description: "Contact information and availability"
        }
      ],
      paths: {
        "/health": {
          get: {
            tags: ["Health Check"],
            summary: "Basic health check",
            description: "Returns basic API health status and system information",
            responses: {
              "200": {
                description: "API is healthy",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/HealthResponse"
                    }
                  }
                }
              },
              "503": {
                description: "Service unavailable",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/profile": {
          get: {
            tags: ["Profile"],
            summary: "Get profile information",
            description: "Retrieve complete profile information including personal details, professional summary, and highlights",
            responses: {
              "200": {
                description: "Profile retrieved successfully",
                content: {
                  "application/json": {
                    schema: {
                      allOf: [
                        { $ref: "#/components/schemas/SuccessResponse" },
                        {
                          type: "object",
                          properties: {
                            data: { $ref: "#/components/schemas/Profile" }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "503": {
                description: "Service unavailable",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/ErrorResponse" }
                  }
                }
              }
            }
          },
          put: {
            tags: ["Profile"],
            summary: "Update profile information",
            description: "Update complete profile information",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Profile" }
                }
              }
            },
            responses: {
              "200": {
                description: "Profile updated successfully",
                content: {
                  "application/json": {
                    schema: {
                      allOf: [
                        { $ref: "#/components/schemas/SuccessResponse" },
                        {
                          type: "object",
                          properties: {
                            data: { $ref: "#/components/schemas/Profile" }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              "400": {
                description: "Invalid request data",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/ErrorResponse" }
                  }
                }
              }
            }
          }
        },
        "/experience": {
          get: {
            tags: ["Experience"],
            summary: "Get all work experience",
            description: "Retrieve all professional work experience entries with optional filtering and sorting",
            parameters: [
              {
                name: "sort",
                in: "query",
                description: "Sort field",
                schema: {
                  type: "string",
                  enum: ["startDate", "endDate", "company", "position"]
                }
              },
              {
                name: "order",
                in: "query",
                description: "Sort order",
                schema: {
                  type: "string",
                  enum: ["asc", "desc"],
                  default: "desc"
                }
              },
              {
                name: "company",
                in: "query",
                description: "Filter by company name",
                schema: { type: "string" }
              }
            ],
            responses: {
              "200": {
                description: "Experience entries retrieved successfully",
                content: {
                  "application/json": {
                    schema: {
                      allOf: [
                        { $ref: "#/components/schemas/SuccessResponse" },
                        {
                          type: "object",
                          properties: {
                            data: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Experience" }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          SuccessResponse: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true
              },
              message: {
                type: "string",
                example: "Operation completed successfully"
              },
              data: {
                type: "object",
                description: "Response data"
              },
              meta: {
                type: "object",
                properties: {
                  timestamp: {
                    type: "string",
                    format: "date-time"
                  },
                  version: {
                    type: "string",
                    example: "1.0.0"
                  },
                  responseTime: {
                    type: "string",
                    example: "45ms"
                  }
                }
              }
            },
            required: ["success", "message", "data", "meta"]
          },
          ErrorResponse: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: false
              },
              message: {
                type: "string",
                example: "An error occurred"
              },
              error: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    example: "INTERNAL_ERROR"
                  },
                  details: {
                    type: "string",
                    example: "Additional error details"
                  }
                }
              },
              meta: {
                type: "object",
                properties: {
                  timestamp: {
                    type: "string",
                    format: "date-time"
                  },
                  version: {
                    type: "string",
                    example: "1.0.0"
                  }
                }
              }
            },
            required: ["success", "message", "error", "meta"]
          },
          HealthResponse: {
            type: "object",
            properties: {
              status: {
                type: "string",
                example: "healthy"
              },
              timestamp: {
                type: "string",
                format: "date-time"
              },
              uptime: {
                type: "string",
                example: "123.45s"
              },
              version: {
                type: "string",
                example: "1.0.0"
              },
              environment: {
                type: "string",
                example: "development"
              }
            }
          },
          Profile: {
            type: "object",
            properties: {
              id: {
                type: "integer",
                example: 1
              },
              name: {
                type: "string",
                example: "Sri Ramanujam"
              },
              title: {
                type: "string",
                example: "Solution Architect & Technical Leader"
              },
              email: {
                type: "string",
                format: "email",
                example: "sri.ramanujam@example.com"
              },
              phone: {
                type: "string",
                example: "+1-555-123-4567"
              },
              location: {
                type: "string",
                example: "San Francisco, CA, USA"
              },
              summary: {
                type: "string",
                example: "Accomplished Solution Architect with 15+ years of experience..."
              },
              socialLinks: {
                type: "object",
                properties: {
                  linkedin: { type: "string", format: "uri" },
                  github: { type: "string", format: "uri" },
                  twitter: { type: "string", format: "uri" },
                  website: { type: "string", format: "uri" }
                }
              },
              highlights: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["id", "name", "title", "email", "location", "summary"]
          },
          Experience: {
            type: "object",
            properties: {
              id: {
                type: "integer",
                example: 1
              },
              company: {
                type: "string",
                example: "TechGlobal Solutions"
              },
              position: {
                type: "string",
                example: "Solution Architect"
              },
              location: {
                type: "string",
                example: "San Francisco, CA"
              },
              startDate: {
                type: "string",
                example: "2020-01"
              },
              endDate: {
                type: "string",
                example: "present"
              },
              description: {
                type: "string",
                example: "Lead architectural decisions for enterprise applications..."
              },
              technologies: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["id", "company", "position", "startDate", "description"]
          }
        }
      }
    };
    
    await fs.writeFile(
      path.join(DIST_DIR, 'swagger.json'), 
      JSON.stringify(openApiSpec, null, 2)
    );
    
    console.log(chalk.green('✅ Swagger UI documentation built successfully!'));
    console.log(chalk.cyan('📍 Output directory: ' + DIST_DIR));
    console.log(chalk.cyan('🌍 Start server with: npm start'));
    console.log(chalk.cyan('📚 Documentation URL: http://localhost:3002'));
    
  } catch (error) {
    console.error(chalk.red('❌ Build failed:'), error.message);
    process.exit(1);
  }
}

build();