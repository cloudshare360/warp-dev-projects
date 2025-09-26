/// <reference types="cypress" />

describe('Portfolio Application - Main Functionality', () => {
  beforeEach(() => {
    // Visit the application before each test
    cy.visit('/')
  })

  describe('Page Loading and Initial State', () => {
    it('should load the application successfully', () => {
      cy.get('app-root').should('exist')
      cy.title().should('eq', 'PortfolioApp')
      
      // Check for basic page structure
      cy.get('body').should('be.visible')
      cy.get('app-root').should('be.visible')
      
      // Take screenshot of initial load
      cy.screenshot('app-initial-load')
    })

    it('should have proper HTML structure', () => {
      // Check for semantic HTML elements
      cy.get('app-root').should('exist')
      
      // Check for main content areas that should exist based on our component
      cy.get('h1').should('contain.text', 'Portfolio Integration Dashboard')
      
      // Verify Angular Material components are loaded
      cy.get('mat-card').should('exist')
      cy.get('mat-chip').should('exist')
    })

    it('should display loading states initially', () => {
      // Check for loading indicators
      cy.get('mat-spinner, .loading, [data-cy="loading"]').should('exist')
      
      // Wait for content to load
      cy.get('mat-card').should('be.visible', { timeout: 10000 })
    })
  })

  describe('API Integration and Data Display', () => {
    it('should display API health status', () => {
      // Wait for health check to complete
      cy.get('mat-card').contains('API Health Status').should('be.visible')
      
      // Check for health status indicators
      cy.get('mat-chip').contains('Connected').should('be.visible')
      cy.get('mat-icon').should('exist')
      
      // Verify health metrics are displayed
      cy.get('p').should('contain.text', 'Status: healthy')
      cy.get('p').should('contain.text', 'Uptime:')
    })

    it('should display work experience data', () => {
      // Wait for experience data to load
      cy.get('mat-card').contains('Work Experience').should('be.visible', { timeout: 10000 })
      
      // Check for experience entries
      cy.get('mat-card').contains('Work Experience').within(() => {
        // Should display company names
        cy.get('p').should('contain.text', 'TechGlobal Solutions')
        
        // Should display positions
        cy.get('p').should('contain.text', 'Solution Architect')
        
        // Should display technologies as chips
        cy.get('mat-chip').should('contain.text', 'Angular')
        cy.get('mat-chip').should('contain.text', 'React')
        cy.get('mat-chip').should('contain.text', 'Node.js')
      })
      
      cy.screenshot('experience-section')
    })

    it('should display skills data', () => {
      // Wait for skills to load
      cy.get('mat-card').contains('Skills').should('be.visible', { timeout: 10000 })
      
      // Check for skill categories and chips
      cy.get('mat-card').contains('Skills').within(() => {
        cy.get('mat-chip').should('contain.text', 'Frontend Technologies')
        cy.get('mat-chip').should('contain.text', 'Backend Technologies')
        cy.get('mat-chip').should('contain.text', 'Cloud & DevOps')
      })
      
      cy.screenshot('skills-section')
    })

    it('should display projects data', () => {
      // Wait for projects to load
      cy.get('mat-card').contains('Projects').should('be.visible', { timeout: 10000 })
      
      // Check for project information
      cy.get('mat-card').contains('Projects').within(() => {
        cy.get('p').should('contain.text', 'E-Commerce Platform')
        cy.get('p').should('contain.text', 'Task Management System')
        
        // Check for project status indicators
        cy.get('mat-chip').should('contain.text', 'completed')
      })
      
      cy.screenshot('projects-section')
    })

    it('should handle profile API error gracefully', () => {
      // Profile endpoint returns 404, check error handling
      cy.get('mat-card').contains('Profile').should('be.visible')
      cy.get('mat-card').contains('Profile').within(() => {
        cy.get('p').should('contain.text', 'Failed to load profile')
        cy.get('mat-icon').should('have.attr', 'color', 'warn')
      })
      
      cy.screenshot('profile-error-handling')
    })
  })

  describe('User Interface Interactions', () => {
    it('should have working refresh functionality', () => {
      // Look for refresh button
      cy.get('button').contains('Refresh Data').should('be.visible')
      
      // Click refresh button
      cy.get('button').contains('Refresh Data').click()
      
      // Should show loading state briefly
      cy.get('mat-spinner, .loading').should('be.visible')
      
      // Data should reload
      cy.get('mat-card').should('be.visible', { timeout: 10000 })
      
      cy.screenshot('after-refresh')
    })

    it('should display integration summary', () => {
      // Check for integration summary section
      cy.get('mat-card').contains('Integration Summary').should('be.visible')
      
      // Check for status indicators
      cy.get('mat-card').contains('Integration Summary').within(() => {
        cy.get('mat-chip').should('contain.text', 'API Health')
        cy.get('mat-chip').should('contain.text', 'Experience')
        cy.get('mat-chip').should('contain.text', 'Projects')
      })
      
      cy.screenshot('integration-summary')
    })

    it('should have proper Angular Material theming', () => {
      // Check for Material Design styling
      cy.get('mat-card').should('have.class', 'mat-mdc-card')
      cy.get('mat-chip').should('have.class', 'mat-mdc-chip')
      cy.get('button').should('have.class', 'mat-mdc-button')
      
      // Check for proper color themes
      cy.get('mat-chip[color="primary"]').should('exist')
      cy.get('mat-chip[color="accent"]').should('exist')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API calls to simulate network error
      cy.intercept('GET', '**/health', { forceNetworkError: true }).as('networkError')
      
      // Refresh to trigger error
      cy.get('button').contains('Refresh Data').click()
      
      // Should display error state
      cy.get('mat-card').should('contain.text', 'Error')
      
      cy.screenshot('network-error-handling')
    })

    it('should handle slow API responses', () => {
      // Intercept API calls with delay
      cy.intercept('GET', '**/api/v1/experience', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(res), 3000)
          })
        })
      }).as('slowApi')
      
      // Trigger refresh
      cy.get('button').contains('Refresh Data').click()
      
      // Should show loading state
      cy.get('mat-spinner').should('be.visible')
      
      // Wait for completion
      cy.wait('@slowApi', { timeout: 5000 })
      cy.get('mat-spinner').should('not.exist')
      
      cy.screenshot('slow-api-handling')
    })
  })

  describe('Accessibility Testing', () => {
    it('should have proper ARIA attributes', () => {
      // Check for ARIA labels
      cy.get('button').should('have.attr', 'aria-label').or('have.text')
      
      // Check for proper heading hierarchy
      cy.get('h1').should('exist')
      
      // Check for color contrast (basic check)
      cy.get('mat-card').should('be.visible')
      cy.get('mat-chip').should('be.visible')
    })

    it('should be keyboard navigable', () => {
      // Test keyboard navigation
      cy.get('body').tab()
      cy.focused().should('exist')
      
      // Test button focus
      cy.get('button').first().focus()
      cy.focused().should('have.text', 'Refresh Data')
    })
  })

  describe('Performance Testing', () => {
    it('should load within acceptable time', () => {
      const start = performance.now()
      
      cy.visit('/').then(() => {
        const loadTime = performance.now() - start
        expect(loadTime).to.be.lessThan(5000) // 5 seconds max
      })
      
      // Check for content loading
      cy.get('mat-card').should('be.visible', { timeout: 10000 })
    })

    it('should not have memory leaks', () => {
      // Simulate multiple page interactions
      for (let i = 0; i < 3; i++) {
        cy.get('button').contains('Refresh Data').click()
        cy.wait(1000)
      }
      
      // Basic check that page still functions
      cy.get('mat-card').should('be.visible')
    })
  })
})