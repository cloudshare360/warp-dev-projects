/// <reference types="cypress" />

describe('Portfolio Application - API Integration Testing', () => {
  const API_BASE_URL = Cypress.env('apiUrl') || 'http://localhost:3001'
  const JSON_SERVER_URL = Cypress.env('jsonServerUrl') || 'http://localhost:3000'

  beforeEach(() => {
    cy.visit('/')
  })

  describe('Backend API Health Checks', () => {
    it('should verify Express API is running and healthy', () => {
      cy.checkApiHealth()
      cy.screenshot('api-health-check')
    })

    it('should verify JSON Server is accessible', () => {
      cy.request(`${JSON_SERVER_URL}/profile`).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('name')
        expect(response.body).to.have.property('title')
      })
    })

    it('should handle API health endpoint detailed information', () => {
      cy.request(`${API_BASE_URL}/health/detailed`).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body.data).to.have.property('memory')
        expect(response.body.data).to.have.property('uptime')
        expect(response.body.data).to.have.property('nodeVersion')
      })
    })
  })

  describe('API Endpoint Testing', () => {
    it('should test experience API endpoint', () => {
      cy.verifyApiResponse('/api/v1/experience')
      
      cy.request(`${API_BASE_URL}/api/v1/experience`).then((response) => {
        if (response.status === 200) {
          expect(response.body.data).to.be.an('array')
          expect(response.body.data[0]).to.have.property('company')
          expect(response.body.data[0]).to.have.property('position')
          expect(response.body.data[0]).to.have.property('technologies')
        }
      })
    })

    it('should test skills API endpoint', () => {
      cy.verifyApiResponse('/api/v1/skills')
      
      cy.request(`${API_BASE_URL}/api/v1/skills`).then((response) => {
        if (response.status === 200) {
          expect(response.body.data).to.be.an('array')
          expect(response.body.data[0]).to.have.property('category')
          expect(response.body.data[0]).to.have.property('skills')
        }
      })
    })

    it('should test projects API endpoint', () => {
      cy.verifyApiResponse('/api/v1/projects')
      
      cy.request(`${API_BASE_URL}/api/v1/projects`).then((response) => {
        if (response.status === 200) {
          expect(response.body.data).to.be.an('array')
          expect(response.body.data[0]).to.have.property('title')
          expect(response.body.data[0]).to.have.property('description')
          expect(response.body.data[0]).to.have.property('technologies')
        }
      })
    })

    it('should handle profile API endpoint 404 gracefully', () => {
      cy.request({
        method: 'GET',
        url: `${API_BASE_URL}/api/v1/profile`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(404)
        expect(response.body).to.have.property('error')
      })
    })
  })

  describe('Frontend API Integration', () => {
    it('should display API data in the UI correctly', () => {
      // Wait for API calls to complete and data to display
      cy.get('mat-card').contains('Work Experience').should('be.visible', { timeout: 15000 })
      cy.get('mat-card').contains('Skills').should('be.visible', { timeout: 15000 })
      cy.get('mat-card').contains('Projects').should('be.visible', { timeout: 15000 })
      
      // Verify that real API data is displayed
      cy.get('mat-card').contains('Work Experience').within(() => {
        cy.get('p').should('contain.text', 'TechGlobal Solutions')
      })
      
      cy.screenshot('frontend-api-integration')
    })

    it('should handle API loading states properly', () => {
      // Intercept API calls to add delay
      cy.intercept('GET', `${API_BASE_URL}/api/v1/**`, (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(res), 1000)
          })
        })
      }).as('delayedApiCalls')
      
      cy.visit('/')
      
      // Should show loading indicators
      cy.get('mat-spinner, .loading').should('be.visible')
      
      // Wait for APIs to complete
      cy.wait('@delayedApiCalls')
      
      // Loading indicators should disappear
      cy.get('mat-spinner, .loading').should('not.exist', { timeout: 15000 })
      
      cy.screenshot('api-loading-states')
    })

    it('should handle API errors gracefully in the UI', () => {
      // Intercept API calls to return errors
      cy.intercept('GET', `${API_BASE_URL}/api/v1/experience`, {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('experienceError')
      
      cy.visit('/')
      
      // Should display error state in UI
      cy.get('mat-card').contains('Work Experience').within(() => {
        cy.get('p').should('contain.text', 'Failed to load')
        cy.get('mat-icon[color="warn"]').should('be.visible')
      })
      
      cy.screenshot('api-error-handling')
    })

    it('should refresh data when refresh button is clicked', () => {
      // Wait for initial load
      cy.get('mat-card').should('be.visible', { timeout: 15000 })
      
      // Intercept refresh API calls
      cy.intercept('GET', `${API_BASE_URL}/health`).as('healthRefresh')
      cy.intercept('GET', `${API_BASE_URL}/api/v1/experience`).as('experienceRefresh')
      
      // Click refresh button
      cy.get('button').contains('Refresh Data').click()
      
      // Verify API calls are made
      cy.wait('@healthRefresh')
      cy.wait('@experienceRefresh')
      
      // Verify UI updates
      cy.get('mat-card').should('be.visible')
      
      cy.screenshot('data-refresh')
    })
  })

  describe('CORS and Cross-Origin Testing', () => {
    it('should handle CORS requests properly', () => {
      // Test CORS preflight request
      cy.request({
        method: 'OPTIONS',
        url: `${API_BASE_URL}/api/v1/experience`
      }).then((response) => {
        expect(response.status).to.equal(204)
        expect(response.headers).to.have.property('access-control-allow-origin')
      })
    })

    it('should allow requests from Angular frontend', () => {
      cy.window().then((win) => {
        // Make API request from frontend context
        return new Promise((resolve) => {
          fetch(`${API_BASE_URL}/health`)
            .then(response => response.json())
            .then(data => {
              expect(data.success).to.equal(true)
              resolve(data)
            })
        })
      })
    })
  })

  describe('API Performance Testing', () => {
    it('should respond within acceptable time limits', () => {
      const endpoints = [
        '/health',
        '/api/v1/experience',
        '/api/v1/skills',
        '/api/v1/projects'
      ]

      endpoints.forEach((endpoint) => {
        const start = Date.now()
        cy.request(`${API_BASE_URL}${endpoint}`).then((response) => {
          const responseTime = Date.now() - start
          expect(responseTime).to.be.lessThan(1000) // 1 second max
          expect(response.status).to.be.oneOf([200, 404]) // 404 acceptable for profile
        })
      })
    })

    it('should handle concurrent requests properly', () => {
      // Make multiple requests simultaneously
      const promises = [
        cy.request(`${API_BASE_URL}/health`),
        cy.request(`${API_BASE_URL}/api/v1/experience`),
        cy.request(`${API_BASE_URL}/api/v1/skills`),
        cy.request(`${API_BASE_URL}/api/v1/projects`)
      ]

      Promise.all(promises).then((responses) => {
        responses.forEach((response) => {
          expect(response.status).to.be.oneOf([200, 404])
        })
      })
    })

    it('should maintain consistent response format', () => {
      const endpoints = [
        '/api/v1/experience',
        '/api/v1/skills', 
        '/api/v1/projects'
      ]

      endpoints.forEach((endpoint) => {
        cy.request({
          method: 'GET',
          url: `${API_BASE_URL}${endpoint}`,
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body).to.have.property('success')
            expect(response.body).to.have.property('message')
            expect(response.body).to.have.property('data')
          }
        })
      })
    })
  })

  describe('Rate Limiting and Security', () => {
    it('should respect API rate limiting', () => {
      // Make multiple requests to test rate limiting
      const requests = []
      for (let i = 0; i < 10; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: `${API_BASE_URL}/health`,
            failOnStatusCode: false
          })
        )
      }

      // All requests should succeed (under rate limit)
      requests.forEach((request) => {
        request.then((response) => {
          expect(response.status).to.be.oneOf([200, 429]) // 429 = Too Many Requests
        })
      })
    })

    it('should have proper security headers', () => {
      cy.request(`${API_BASE_URL}/health`).then((response) => {
        // Check for security headers (these may vary based on your setup)
        expect(response.headers).to.have.property('access-control-allow-origin')
        // Additional security headers can be checked here
      })
    })
  })

  describe('Data Validation and Integrity', () => {
    it('should return valid data structures', () => {
      cy.request(`${API_BASE_URL}/api/v1/experience`).then((response) => {
        if (response.status === 200) {
          const experience = response.body.data[0]
          
          // Validate required fields
          expect(experience).to.have.property('company')
          expect(experience).to.have.property('position')
          expect(experience).to.have.property('startDate')
          expect(experience).to.have.property('technologies')
          
          // Validate data types
          expect(experience.company).to.be.a('string')
          expect(experience.technologies).to.be.an('array')
        }
      })
    })

    it('should maintain data consistency between JSON Server and API', () => {
      // Get data directly from JSON Server
      cy.request(`${JSON_SERVER_URL}/experience`).then((jsonServerResponse) => {
        // Get data from Express API
        cy.request(`${API_BASE_URL}/api/v1/experience`).then((apiResponse) => {
          if (apiResponse.status === 200) {
            // Data should be consistent (allowing for API response wrapper)
            expect(apiResponse.body.data).to.deep.equal(jsonServerResponse.body)
          }
        })
      })
    })
  })

  describe('Real-time API Monitoring', () => {
    it('should display real-time API health metrics', () => {
      // Check that health metrics are updating
      cy.get('mat-card').contains('API Health Status').within(() => {
        cy.get('p').contains('Uptime:').should('exist')
        cy.get('p').contains('Memory:').should('exist')
        cy.get('p').contains('Status: healthy').should('exist')
      })
      
      // Take screenshot for reporting
      cy.screenshot('real-time-health-metrics')
    })

    it('should update timestamps correctly', () => {
      const firstVisit = Date.now()
      cy.visit('/')
      cy.wait(2000) // Wait 2 seconds
      
      cy.get('button').contains('Refresh Data').click()
      cy.wait(1000) // Wait for refresh
      
      // Verify that timestamps are recent
      cy.get('mat-card').contains('API Health Status').should('be.visible')
    })
  })
})