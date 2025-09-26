# Portfolio REST API - Swagger UI Documentation

Standalone Swagger UI documentation for the Portfolio REST API.

## Features

- **Interactive API Documentation** - Test endpoints directly from the browser
- **OpenAPI 3.0 Specification** - Industry standard API documentation
- **Professional Styling** - Custom theme matching portfolio branding
- **Comprehensive Coverage** - All API endpoints documented with examples
- **Live Testing** - Try out API calls directly from the documentation

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build and serve documentation:**
   ```bash
   npm run serve
   ```

3. **Access documentation:**
   Open http://localhost:3002 in your browser

## Available Scripts

- `npm run build` - Build the documentation
- `npm start` - Start the HTTP server
- `npm run serve` - Build and serve (recommended)
- `npm run dev` - Development mode with live reloading
- `npm run generate` - Generate API specification from Express server

## API Endpoints Documented

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information
- `GET /health/readiness` - Kubernetes readiness probe
- `GET /health/liveness` - Kubernetes liveness probe

### Profile Management
- `GET /profile` - Get complete profile information
- `GET /profile/summary` - Get profile summary
- `GET /profile/contact` - Get contact information
- `PUT /profile` - Update complete profile
- `PATCH /profile` - Partial profile update

### Experience Management
- `GET /experience` - Get all work experience
- `GET /experience/{id}` - Get specific experience
- `POST /experience` - Create new experience
- `PUT /experience/{id}` - Update experience
- `PATCH /experience/{id}` - Partial experience update
- `DELETE /experience/{id}` - Delete experience
- `GET /experience/search` - Search experience entries

### Skills Management
- `GET /skills` - Get all skills by category
- `GET /skills/{id}` - Get specific skill category
- `GET /skills/search` - Search skills

### Projects Portfolio
- `GET /projects` - Get all projects
- `GET /projects/{id}` - Get specific project
- `GET /projects/featured` - Get featured projects only

### Education
- `GET /education` - Get all education entries
- `GET /education/{id}` - Get specific education entry

### Certifications
- `GET /certifications` - Get all certifications
- `GET /certifications/{id}` - Get specific certification

### Testimonials
- `GET /testimonials` - Get all testimonials
- `GET /testimonials/{id}` - Get specific testimonial

### Contact Information
- `GET /contact` - Get contact information
- `PATCH /contact` - Update contact information

## Configuration

The Swagger UI can be customized by modifying:

- `scripts/build.js` - Build configuration and API specification
- Custom styling in the generated `index.html`
- OpenAPI specification in `swagger.json`

## API Testing

Each endpoint includes:
- **Request/Response Examples** - Sample data for testing
- **Schema Definitions** - Data structure specifications
- **Parameter Documentation** - Query parameters and request bodies
- **Response Codes** - HTTP status codes and error handling
- **Try It Out** - Interactive testing directly from the UI

## Integration

This documentation is designed to work with:
- **Express REST API** running on http://localhost:3000
- **JSON Server** running on http://localhost:3001
- **Angular Frontend** consuming the API

## Development

To extend or modify the documentation:

1. Update the OpenAPI specification in `scripts/build.js`
2. Add new endpoints or modify existing ones
3. Update response schemas and examples
4. Rebuild with `npm run build`

## Production Deployment

For production deployment:

1. Build the documentation: `npm run build`
2. Serve the `dist/` folder with any static file server
3. Update server URLs in the OpenAPI specification
4. Configure CORS settings for production domains

## Troubleshooting

- **CORS Issues**: Ensure the Express API has proper CORS configuration
- **Server Not Running**: Start the Express API server before testing endpoints
- **Build Failures**: Check Node.js version compatibility (requires Node 18+)

## Support

For issues or questions about the API documentation:
- Review the main project documentation
- Check the Express API server logs
- Verify the JSON Server is running and accessible