# Portfolio Website - Application Setup Guide

## Overview
This guide provides step-by-step instructions for setting up and running the complete Angular 18 Frontend Portfolio application stack, including the Angular frontend, Express.js REST API, JSON Server, and Swagger UI documentation.

## System Requirements

### Prerequisites
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Angular CLI**: Version 18.x
- **Git**: Latest version for version control
- **Code Editor**: VS Code (recommended) or similar

### Operating System Support
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 18.04+, Debian, CentOS, etc.)

## Project Structure
```
angular-18-front-end-portfolio/
├── angular-front-end/          # Angular 18 frontend application
├── express-rest-api/           # Express.js REST API server
├── swagger-ui/                 # Swagger UI documentation
├── postman-collection/         # Postman API test collections
├── json-server/               # JSON Server for data persistence
│   ├── schema/                # JSON schemas for validation
│   ├── data/                  # JSON data files
│   └── scripts/               # Server management scripts
├── Requirements-Document.md    # Project requirements
├── Project-Tracking.md        # Feature tracking document
├── Application-Setup.md       # This setup guide
└── Application-User-Guide.md  # User guide for content management
```

## Installation Steps

### Step 1: Clone or Download Project
```bash
# If using Git (recommended)
git clone <repository-url>
cd angular-18-front-end-portfolio

# Or download and extract the project files
```

### Step 2: Install Global Dependencies
```bash
# Install Angular CLI globally
npm install -g @angular/cli@18

# Verify Angular CLI installation
ng version

# Install JSON Server globally
npm install -g json-server

# Install nodemon globally (for development)
npm install -g nodemon
```

### Step 3: Setup JSON Server
```bash
# Navigate to json-server directory
cd json-server

# Install dependencies
npm install

# Make scripts executable (Linux/macOS only)
chmod +x scripts/*.sh

# Initialize with sample data
npm run setup
```

### Step 4: Setup Express REST API
```bash
# Navigate to express-rest-api directory
cd ../express-rest-api

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

### Step 5: Setup Swagger UI
```bash
# Navigate to swagger-ui directory
cd ../swagger-ui

# Install dependencies
npm install

# Build Swagger documentation
npm run build
```

### Step 6: Setup Angular Frontend
```bash
# Navigate to angular-front-end directory
cd ../angular-front-end

# Install dependencies
npm install

# Install additional UI libraries
ng add @angular/material
# Or alternatively
# ng add primeng
```

## Configuration

### JSON Server Configuration
Edit `json-server/db.json` to customize your portfolio data:
```json
{
  "profile": {
    "id": 1,
    "name": "Your Name",
    "title": "Solution Architect",
    "email": "your.email@example.com",
    "phone": "+1-234-567-8900",
    "location": "Your City, Country",
    "summary": "Brief professional summary...",
    "avatar": "/assets/images/profile.jpg"
  },
  "experience": [...],
  "skills": [...],
  "projects": [...],
  "education": [...],
  "certifications": [...],
  "testimonials": [...]
}
```

### Express API Configuration
Edit `express-rest-api/.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JSON Server Configuration
JSON_SERVER_URL=http://localhost:3001

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# API Configuration
API_PREFIX=/api/v1

# Logging
LOG_LEVEL=debug
```

### Angular Configuration
Edit `angular-front-end/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  jsonServerUrl: 'http://localhost:3001',
  swaggerUrl: 'http://localhost:3002'
};
```

## Running the Application

### Option 1: Run Each Service Individually

#### 1. Start JSON Server
```bash
cd json-server
npm run start
# JSON Server will run on http://localhost:3001
```

#### 2. Start Express REST API
```bash
cd express-rest-api
npm run dev
# Express API will run on http://localhost:3000
```

#### 3. Start Swagger UI
```bash
cd swagger-ui
npm run serve
# Swagger UI will run on http://localhost:3002
```

#### 4. Start Angular Frontend
```bash
cd angular-front-end
ng serve
# Angular app will run on http://localhost:4200
```

### Option 2: Run All Services with Concurrent Script

Create a root-level `package.json` for running all services:

```bash
# In the root directory
npm init -y

# Install concurrently
npm install --save-dev concurrently wait-on

# Add scripts to package.json
```

Root `package.json` scripts:
```json
{
  "scripts": {
    "start": "concurrently \"npm run start:json-server\" \"npm run start:api\" \"npm run start:swagger\" \"npm run start:frontend\"",
    "start:json-server": "cd json-server && npm start",
    "start:api": "wait-on http://localhost:3001 && cd express-rest-api && npm run dev",
    "start:swagger": "cd swagger-ui && npm run serve",
    "start:frontend": "wait-on http://localhost:3000 && cd angular-front-end && ng serve",
    "install:all": "cd json-server && npm install && cd ../express-rest-api && npm install && cd ../swagger-ui && npm install && cd ../angular-front-end && npm install",
    "build:all": "cd express-rest-api && npm run build && cd ../angular-front-end && ng build",
    "test:all": "cd express-rest-api && npm test && cd ../angular-front-end && ng test",
    "clean": "cd json-server && rm -rf node_modules && cd ../express-rest-api && rm -rf node_modules && cd ../swagger-ui && rm -rf node_modules && cd ../angular-front-end && rm -rf node_modules"
  }
}
```

Run all services:
```bash
# Install all dependencies
npm run install:all

# Start all services
npm start
```

## Service URLs and Ports

| Service | URL | Port | Description |
|---------|-----|------|-------------|
| JSON Server | http://localhost:3001 | 3001 | Data persistence layer |
| Express REST API | http://localhost:3000 | 3000 | Backend API server |
| Swagger UI | http://localhost:3002 | 3002 | API documentation |
| Angular Frontend | http://localhost:4200 | 4200 | Main application |

## Development Tools

### JSON Server Management Scripts
```bash
cd json-server/scripts

# Start JSON Server
./start-server.sh

# Stop JSON Server
./stop-server.sh

# Test JSON Server endpoints
./test-endpoints.sh

# Backup data
./backup-data.sh

# Restore data
./restore-data.sh
```

### API Testing with cURL
```bash
# Test profile endpoint
curl -X GET http://localhost:3000/api/v1/profile

# Test experience endpoint
curl -X GET http://localhost:3000/api/v1/experience

# Test skills endpoint
curl -X GET http://localhost:3000/api/v1/skills

# Test projects endpoint
curl -X GET http://localhost:3000/api/v1/projects
```

### Postman Collection Usage
1. Import collection from `postman-collection/Portfolio-API.postman_collection.json`
2. Import environment from `postman-collection/environments/`
3. Run tests against all endpoints
4. Use automated testing features

## Build and Deployment

### Development Build
```bash
# Build Express API
cd express-rest-api
npm run build

# Build Angular Frontend
cd ../angular-front-end
ng build
```

### Production Build
```bash
# Production build for Angular
cd angular-front-end
ng build --configuration=production

# The built files will be in dist/ directory
```

### Docker Setup (Optional)
```bash
# Build Docker containers
docker-compose build

# Start all services with Docker
docker-compose up

# Stop all services
docker-compose down
```

## Environment Variables

### JSON Server Environment
```env
PORT=3001
HOST=localhost
WATCH=true
DELAY=0
```

### Express API Environment
```env
PORT=3000
NODE_ENV=development
JSON_SERVER_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:4200
LOG_LEVEL=debug
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Angular Environment
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  jsonServerUrl: 'http://localhost:3001',
  swaggerUrl: 'http://localhost:3002',
  version: '1.0.0'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '/api/v1',
  jsonServerUrl: '/data',
  swaggerUrl: '/docs',
  version: '1.0.0'
};
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :4200  # or :3000, :3001, :3002

# Kill process
kill -9 <PID>

# Or use different ports in configuration
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Update Node.js using nvm (recommended)
nvm install 18
nvm use 18
```

#### Angular CLI Issues
```bash
# Update Angular CLI
npm install -g @angular/cli@latest

# Clear Angular CLI cache
ng cache clean
```

#### CORS Issues
```bash
# Enable CORS in Express API
# Check cors configuration in express-rest-api/app.js

# For development, you can also use Angular CLI proxy
ng serve --proxy-config proxy.conf.json
```

### Debugging

#### Enable Debug Logs
```bash
# For Express API
DEBUG=app:* npm run dev

# For Angular (in browser console)
localStorage.setItem('debug', 'true');
```

#### Health Checks
```bash
# Check JSON Server
curl http://localhost:3001/db

# Check Express API
curl http://localhost:3000/health

# Check Angular build
ng build --dry-run
```

## Performance Optimization

### Development
- Use `ng serve --hmr` for hot module replacement
- Enable Angular build cache: `ng config cli.cache.enabled true`
- Use lazy loading for Angular routes

### Production
- Enable Angular production mode
- Use Angular build optimizer
- Configure CDN for static assets
- Enable gzip compression
- Use service workers for caching

## Security Considerations

### Development
- Use environment variables for sensitive configuration
- Enable CORS properly
- Validate all input data
- Use HTTPS in production

### Production
- Use SSL/TLS certificates
- Configure proper CORS policies
- Implement rate limiting
- Use security headers
- Sanitize all user inputs

## Monitoring and Logging

### Development Monitoring
- Angular DevTools browser extension
- Express.js debug logging
- JSON Server request logging
- Browser developer tools

### Production Monitoring
- Application performance monitoring
- Error tracking and reporting
- API response time monitoring
- User analytics

## Backup and Recovery

### Data Backup
```bash
# Backup JSON data
cd json-server/scripts
./backup-data.sh

# Manual backup
cp json-server/data/*.json backup/$(date +%Y%m%d)/
```

### Configuration Backup
```bash
# Backup configuration files
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  */package.json \
  */.env \
  angular-front-end/src/environments/
```

## Next Steps

After successful setup:
1. Review and customize the sample data in `json-server/data/`
2. Test all API endpoints using Postman collections
3. Customize the Angular frontend components
4. Update the Swagger documentation
5. Configure deployment pipeline
6. Set up monitoring and analytics

## Support and Resources

### Documentation
- [Angular Documentation](https://angular.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [JSON Server Documentation](https://github.com/typicode/json-server)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

### Troubleshooting Resources
- Check project logs in respective directories
- Review browser developer console for frontend issues
- Use Postman for API endpoint testing
- Refer to framework-specific troubleshooting guides

---
**Document Version**: 1.0  
**Last Updated**: September 20, 2024  
**Next Review**: September 27, 2024