// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})

// Custom commands for API testing
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to check API health
       * @example cy.checkApiHealth()
       */
      checkApiHealth(): Chainable<Element>
      
      /**
       * Custom command to verify API response
       * @example cy.verifyApiResponse('/api/v1/profile')
       */
      verifyApiResponse(endpoint: string): Chainable<Element>
      
      /**
       * Custom command to wait for Angular to be ready
       * @example cy.waitForAngular()
       */
      waitForAngular(): Chainable<Element>
      
      /**
       * Custom command to check responsive design
       * @example cy.checkResponsiveDesign()
       */
      checkResponsiveDesign(): Chainable<Element>
    }
  }
}

// Global before hook
beforeEach(() => {
  // Set viewport to desktop by default
  cy.viewport(1280, 720)
  
  // Intercept API calls for better control
  cy.intercept('GET', '**/health', { fixture: 'api-health.json' }).as('healthCheck')
  cy.intercept('GET', '**/api/v1/experience', { fixture: 'experience.json' }).as('getExperience')
  cy.intercept('GET', '**/api/v1/skills', { fixture: 'skills.json' }).as('getSkills')
  cy.intercept('GET', '**/api/v1/projects', { fixture: 'projects.json' }).as('getProjects')
})