#!/bin/bash

# Portfolio Website - Taskwarrior Project Setup Script
# This script sets up comprehensive project tracking using Taskwarrior

echo "🚀 Setting up Taskwarrior for Portfolio Website Project..."
echo "=================================================="

# Initialize Taskwarrior (if first run)
task --version > /dev/null 2>&1 || { echo "Taskwarrior not installed. Please install it first."; exit 1; }

# Create project structure in Taskwarrior
echo "📋 Creating project structure..."

# Set up projects and tags
echo "✅ Setting up projects..."

# Phase 1: Foundation - Already Complete
task add "Complete project documentation updates" project:foundation priority:L due:tomorrow +documentation
task add "Create project presentation materials" project:foundation priority:M due:+3days +presentation

# Phase 2: Frontend Enhancement - High Priority
task add "Implement Contact Component with form validation" project:frontend priority:H due:tomorrow +angular +component
task add "Create Architecture Portfolio showcase section" project:frontend priority:H due:+2days +angular +portfolio
task add "Enhanced navigation and routing" project:frontend priority:M due:+3days +angular +routing
task add "Add loading animations and micro-interactions" project:frontend priority:M due:+4days +angular +animation

# Phase 3: SEO & Performance - High Priority  
task add "Implement meta tags and structured data" project:seo priority:H due:+2days +seo +metadata
task add "Configure lazy loading for performance" project:performance priority:H due:+3days +angular +optimization
task add "Bundle size optimization and tree shaking" project:performance priority:M due:+4days +webpack +optimization
task add "Implement service worker for PWA features" project:performance priority:M due:+5days +pwa +serviceworker

# Phase 4: Testing & Quality - Medium Priority
task add "Fix Postman Collection IP validation issue" project:testing priority:M due:tomorrow +postman +bugfix
task add "Increase unit test coverage to 90%" project:testing priority:M due:+4days +testing +jasmine
task add "Run comprehensive E2E test suite" project:testing priority:M due:+3days +cypress +e2e

# Phase 5: Production & Deployment - High Priority
task add "Configure production environment variables" project:deployment priority:H due:+5days +production +config
task add "Set up CI/CD pipeline with GitHub Actions" project:deployment priority:M due:+6days +cicd +github
task add "Configure domain and SSL certificates" project:deployment priority:M due:+7days +domain +ssl
task add "Performance monitoring and analytics setup" project:deployment priority:L due:+8days +monitoring +analytics

# Phase 6: Content & Enhancement - Medium Priority
task add "Create professional content and copywriting" project:content priority:M due:+4days +content +copywriting
task add "Optimize images and implement responsive images" project:content priority:M due:+5days +images +responsive
task add "Implement dark/light theme toggle" project:enhancement priority:L due:+6days +theme +feature
task add "Add search functionality across portfolio" project:enhancement priority:L due:+7days +search +feature

# Phase 7: Advanced Features - Low Priority
task add "Multi-language support implementation" project:enhancement priority:L due:+10days +i18n +feature
task add "Advanced filtering and sorting" project:enhancement priority:L due:+8days +filtering +feature
task add "Integration with CMS for content management" project:enhancement priority:L due:+12days +cms +integration

echo "📊 Creating project tags and contexts..."

# Set up contexts for different types of work
task context define frontend project:frontend or +angular or +component
task context define backend project:backend or +api or +server
task context define testing project:testing or +cypress or +jasmine or +e2e
task context define deployment project:deployment or +production or +cicd
task context define content project:content or +copywriting or +images

echo "🏷️ Setting up custom fields..."

# Create some completed tasks to show project history
task add "Project foundation setup completed" project:foundation priority:H due:yesterday +completed
task modify $(task +completed uuids) status:completed

task add "JSON Server with 34KB realistic data" project:backend priority:H due:yesterday +api +completed
task modify $(task +completed uuids | tail -1) status:completed

task add "Express REST API with 35+ endpoints" project:backend priority:H due:yesterday +api +completed  
task modify $(task +completed uuids | tail -1) status:completed

task add "Angular 18 Material UI integration" project:frontend priority:H due:yesterday +angular +completed
task modify $(task +completed uuids | tail -1) status:completed

task add "Cypress E2E testing framework setup" project:testing priority:H due:yesterday +cypress +completed
task modify $(task +completed uuids | tail -1) status:completed

echo "📈 Setting up reports and filters..."

# Create useful aliases (add these to your .bashrc)
cat >> ~/.taskwarrior_aliases << 'EOF'
# Taskwarrior aliases for Portfolio Project
alias tw='task'
alias twl='task list'
alias twa='task add'
alias tws='task summary'
alias twp='task projects'
alias twh='task burndown.weekly'
alias twr='task reports'

# Project-specific shortcuts
alias tw-frontend='task context frontend && task list'
alias tw-backend='task context backend && task list'  
alias tw-testing='task context testing && task list'
alias tw-urgent='task urgency \> 10 list'
alias tw-today='task due:today list'
alias tw-week='task due.before:eow list'

# Progress tracking
alias tw-progress='task summary && echo && task burndown.weekly'
alias tw-completed='task status:completed list'
alias tw-stats='task statistics'
EOF

echo "⚙️ Configuring Taskwarrior settings..."

# Configure Taskwarrior for better project management
task config report.next.columns id,start.age,entry.age,depends,priority,project,tag,recur,scheduled.countdown,due.relative,until.remaining,description,urgency
task config report.next.labels ID,Active,Age,Deps,P,Project,Tag,Recur,S,Due,Until,Description,Urg
task config urgency.user.project.frontend.coefficient 5.0
task config urgency.user.project.deployment.coefficient 4.0
task config urgency.user.project.performance.coefficient 4.5
task config urgency.user.tag.bugfix.coefficient 6.0
task config urgency.user.tag.production.coefficient 5.0

echo "🎨 Setting up color themes..."
task config color.project.frontend rgb013
task config color.project.backend rgb031  
task config color.project.testing rgb301
task config color.project.deployment rgb130
task config color.tag.urgent rgb500
task config color.tag.bugfix rgb510
task config color.due.today rgb553

echo ""
echo "✅ Taskwarrior setup complete!"
echo "=================================================="
echo ""
echo "🔧 Available Commands:"
echo "  task list                    # Show all tasks"
echo "  task add 'Task description'  # Add new task"
echo "  task <id> done              # Mark task complete"
echo "  task <id> start             # Start working on task"  
echo "  task projects               # Show all projects"
echo "  task summary                # Project summary"
echo "  task burndown.weekly        # Progress visualization"
echo ""
echo "🏷️ Project Contexts:"
echo "  task context frontend       # Switch to frontend tasks"
echo "  task context testing        # Switch to testing tasks"
echo "  task context deployment     # Switch to deployment tasks"
echo ""
echo "📊 Quick Reports:"
echo "  task due:today              # Tasks due today"
echo "  task due.before:eow         # Tasks due this week"  
echo "  task urgency \\> 10          # High urgency tasks"
echo ""
echo "🎯 To get started:"
echo "  task list                   # See your current tasks"
echo "  task summary               # See project overview"
echo ""

# Source aliases if we're in an interactive shell
if [[ $- == *i* ]]; then
    source ~/.taskwarrior_aliases 2>/dev/null
fi

echo "Happy project tracking! 🚀"