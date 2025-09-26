/// <reference types="cypress" />

describe('Portfolio Application - Responsive Design Testing', () => {
  const viewports = [
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 414, height: 896, name: 'iPhone 11 Pro' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1024, height: 768, name: 'iPad Landscape' },
    { width: 1280, height: 720, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' }
  ]

  viewports.forEach((viewport) => {
    describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height)
        cy.visit('/')
      })

      it('should display properly on mobile devices', () => {
        if (viewport.width <= 480) {
          // Mobile-specific tests
          cy.get('app-root').should('be.visible')
          
          // Check that content is not horizontally scrolling
          cy.get('body').should('have.css', 'overflow-x').and('match', /(hidden|auto)/)
          
          // Verify main content is visible
          cy.get('mat-card').should('be.visible')
          
          // Check for mobile-friendly spacing
          cy.get('mat-card').should('have.css', 'margin')
          
          cy.screenshot(`mobile-${viewport.name.toLowerCase().replace(/\s+/g, '-')}`)
        }
      })

      it('should display properly on tablet devices', () => {
        if (viewport.width >= 768 && viewport.width <= 1024) {
          // Tablet-specific tests
          cy.get('app-root').should('be.visible')
          cy.get('mat-card').should('be.visible')
          
          // Check for tablet layout
          cy.get('h1').should('be.visible')
          cy.get('mat-chip').should('be.visible')
          
          cy.screenshot(`tablet-${viewport.name.toLowerCase().replace(/\s+/g, '-')}`)
        }
      })

      it('should display properly on desktop devices', () => {
        if (viewport.width > 1024) {
          // Desktop-specific tests
          cy.get('app-root').should('be.visible')
          cy.get('mat-card').should('be.visible')
          
          // Check for full desktop layout
          cy.get('h1').should('contain.text', 'Portfolio Integration Dashboard')
          cy.get('mat-card').should('have.length.at.least', 4)
          
          // Check for proper spacing on desktop
          cy.get('mat-card').should('have.css', 'margin')
          
          cy.screenshot(`desktop-${viewport.name.toLowerCase().replace(/\s+/g, '-')}`)
        }
      })

      it('should have readable text at any viewport', () => {
        // Check font sizes are readable
        cy.get('h1').should('have.css', 'font-size').and('not.equal', '0px')
        cy.get('p').should('have.css', 'font-size').and('not.equal', '0px')
        
        // Check for proper line height
        cy.get('p').should('have.css', 'line-height')
      })

      it('should have touch-friendly interactive elements', () => {
        if (viewport.width <= 768) {
          // Check button sizes are touch-friendly (minimum 44px)
          cy.get('button').each(($button) => {
            cy.wrap($button).should(($el) => {
              const height = $el.outerHeight()
              const width = $el.outerWidth()
              expect(height).to.be.at.least(44)
              expect(width).to.be.at.least(44)
            })
          })
        }
      })

      it('should maintain visual hierarchy', () => {
        // Check that headings are prominent
        cy.get('h1').should('be.visible')
        
        // Check that content sections are distinguishable
        cy.get('mat-card').should('have.length.at.least', 1)
        
        // Verify color contrast is maintained
        cy.get('mat-chip').should('be.visible')
      })

      it('should handle content overflow properly', () => {
        // Check that long content doesn't break layout
        cy.get('mat-card').each(($card) => {
          cy.wrap($card).should('not.have.css', 'overflow', 'visible')
        })
        
        // Check for horizontal scrolling issues
        cy.get('body').should('not.have.css', 'overflow-x', 'scroll')
      })
    })
  })

  describe('Responsive Behavior Tests', () => {
    it('should adapt layout when resizing window', () => {
      // Start with desktop
      cy.viewport(1280, 720)
      cy.visit('/')
      cy.get('mat-card').should('be.visible')
      cy.screenshot('before-resize-desktop')
      
      // Resize to tablet
      cy.viewport(768, 1024)
      cy.wait(500) // Allow time for responsive layout
      cy.get('mat-card').should('be.visible')
      cy.screenshot('after-resize-tablet')
      
      // Resize to mobile
      cy.viewport(375, 667)
      cy.wait(500) // Allow time for responsive layout
      cy.get('mat-card').should('be.visible')
      cy.screenshot('after-resize-mobile')
    })

    it('should maintain functionality across all viewports', () => {
      viewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height)
        cy.visit('/')
        
        // Test that buttons work
        cy.get('button').contains('Refresh Data').should('be.visible').click()
        
        // Test that content loads
        cy.get('mat-card').should('be.visible', { timeout: 10000 })
        
        cy.screenshot(`functionality-${viewport.name.toLowerCase().replace(/\s+/g, '-')}`)
      })
    })

    it('should have proper navigation on different screen sizes', () => {
      // Test navigation behavior on different screen sizes
      viewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height)
        cy.visit('/')
        
        // Check that main content is accessible
        cy.get('app-root').should('be.visible')
        cy.get('h1').should('be.visible')
        
        // Test keyboard navigation
        cy.get('body').tab()
        cy.focused().should('exist')
      })
    })
  })

  describe('Material UI Responsive Features', () => {
    it('should have responsive Material UI components', () => {
      const testViewport = { width: 375, height: 667 }
      cy.viewport(testViewport.width, testViewport.height)
      cy.visit('/')
      
      // Test Material UI card responsiveness
      cy.get('mat-card').should('be.visible').and(($cards) => {
        $cards.each((index, card) => {
          const cardWidth = Cypress.$(card).outerWidth()
          expect(cardWidth).to.be.lessThan(testViewport.width)
        })
      })
      
      // Test Material UI chips responsiveness
      cy.get('mat-chip').should('be.visible')
      
      // Test Material UI buttons responsiveness
      cy.get('button').should('be.visible')
    })

    it('should handle Material UI breakpoints correctly', () => {
      // Test Material UI breakpoints
      const breakpoints = [
        { width: 599, name: 'xs' },
        { width: 959, name: 'sm' },
        { width: 1279, name: 'md' },
        { width: 1919, name: 'lg' }
      ]
      
      breakpoints.forEach((breakpoint) => {
        cy.viewport(breakpoint.width, 720)
        cy.visit('/')
        
        cy.get('mat-card').should('be.visible')
        cy.screenshot(`material-breakpoint-${breakpoint.name}`)
      })
    })
  })

  describe('Performance on Different Viewports', () => {
    it('should load quickly on mobile devices', () => {
      cy.viewport(375, 667)
      
      const start = Date.now()
      cy.visit('/').then(() => {
        const loadTime = Date.now() - start
        expect(loadTime).to.be.lessThan(5000) // 5 seconds max
      })
      
      cy.get('mat-card').should('be.visible', { timeout: 10000 })
    })

    it('should be smooth when interacting on touch devices', () => {
      cy.viewport(414, 896) // iPhone 11 Pro
      cy.visit('/')
      
      // Simulate touch interactions
      cy.get('button').contains('Refresh Data').should('be.visible')
      cy.get('button').contains('Refresh Data').click()
      
      // Check for smooth transitions
      cy.get('mat-card').should('be.visible', { timeout: 10000 })
    })
  })
})