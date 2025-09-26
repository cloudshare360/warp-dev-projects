// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to check API health
Cypress.Commands.add('checkApiHealth', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/health`,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.equal(200)
    expect(response.body).to.have.property('success', true)
    expect(response.body).to.have.property('data')
    expect(response.body.data).to.have.property('status', 'healthy')
  })
})

// Custom command to verify API response
Cypress.Commands.add('verifyApiResponse', (endpoint: string) => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}${endpoint}`,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 404]) // 404 is acceptable for profile endpoint
    if (response.status === 200) {
      expect(response.body).to.have.property('success')
      expect(response.body).to.have.property('data')
    }
  })
})

// Custom command to wait for Angular to be ready
Cypress.Commands.add('waitForAngular', () => {
  cy.window().should('have.property', 'ng')
  cy.get('app-root').should('exist')
  cy.get('[data-cy="loading"]').should('not.exist', { timeout: 10000 })
})

// Custom command to check responsive design
Cypress.Commands.add('checkResponsiveDesign', () => {
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },    // iPhone SE
    { width: 768, height: 1024, name: 'Tablet' },   // iPad
    { width: 1280, height: 720, name: 'Desktop' },  // Desktop
    { width: 1920, height: 1080, name: 'Large Desktop' } // Large Desktop
  ]

  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height)
    cy.wait(1000) // Allow time for responsive layout
    
    // Check that main content is visible
    cy.get('app-root').should('be.visible')
    
    // Take screenshot for each viewport
    cy.screenshot(`responsive-${viewport.name.toLowerCase().replace(' ', '-')}`)
  })
})

// Custom command to test accessibility
Cypress.Commands.add('checkAccessibility', () => {
  // Check for basic accessibility attributes
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt')
  })
  
  // Check for proper heading hierarchy
  cy.get('h1').should('have.length.at.least', 1)
  
  // Check for focus management
  cy.get('button, a, input, select, textarea').each(($el) => {
    cy.wrap($el).should('be.focusable')
  })
})

// Custom command to test form interactions
Cypress.Commands.add('testFormValidation', (formSelector: string) => {
  cy.get(formSelector).within(() => {
    // Test required field validation
    cy.get('input[required], textarea[required], select[required]').each(($field) => {
      cy.wrap($field).clear().blur()
      cy.wrap($field).should('have.class', 'ng-invalid')
    })
  })
})

// Custom command to test loading states
Cypress.Commands.add('testLoadingStates', () => {
  cy.intercept('GET', '**/api/v1/**', (req) => {
    // Add delay to test loading states
    req.reply((res) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), 2000)
      })
    })
  }).as('delayedApi')
  
  cy.visit('/')
  cy.get('[data-cy="loading"], .loading, mat-spinner').should('be.visible')
  cy.wait('@delayedApi')
  cy.get('[data-cy="loading"], .loading, mat-spinner').should('not.exist')
})

declare global {
  namespace Cypress {
    interface Chainable {
      checkAccessibility(): Chainable<Element>
      testFormValidation(formSelector: string): Chainable<Element>
      testLoadingStates(): Chainable<Element>
    }
  }
}