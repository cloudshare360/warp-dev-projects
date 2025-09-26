# Angular 18 Todo Full Stack Application Requirements

## 1. Overview
This document outlines the requirements for developing a full-stack Todo application using Angular 18, Express.js, and MongoDB with role-based access control.

## 2. User Management & Authentication

### 2.1 User Roles
- **User**: Standard user with limited permissions
- **Admin**: Administrative user with extended permissions

### 2.2 User Registration (Sign-up)
**Required Fields:**
- Username
- Password
- Confirm Password
- Email ID
- First Name
- Last Name
- Role Type (User/Admin)

**Process:**
- New users register through sign-up page
- Upon successful registration, redirect to login page with success message
- User account created in database

### 2.3 User Authentication (Login)
**Login Form Features:**
- Username and password input fields
- Submit button for authentication
- Link to sign-up page for new users
- Link to forgot password functionality
- Separate admin login option

**Authentication Flow:**
- Validate credentials against database
- Successful login redirects to homepage
- Invalid credentials display error message and remain on login page
- Role-based redirection based on user type

## 3. Authorization & Permissions

### 3.1 User Permissions
- Update own profile details
- Create and manage personal todo categories
- Create and manage todo items within categories
- View only own todos and categories

### 3.2 Admin Permissions
- All user permissions
- Activate/deactivate user profiles
- Update any user's profile details
- **Cannot** view user todos or categories (privacy protection)

## 4. Todo Management System

### 4.1 Category Management
- Users can create multiple todo categories
- Each category belongs to a specific user
- Categories serve as organizational containers for todos

### 4.2 Todo Item Management
- Users can create multiple todo items per category
- Todo items are associated with specific categories
- Users can only manage their own todos

## 5. Technical Architecture

### 5.1 Frontend - Angular 18
**Location:** `angular-18-front-end/`
- **Angular Version:** 18.2.14
- **Angular CLI:** 18.2.21
- **Node.js:** 22.19.0
- **npm:** 10.9.3
- **TypeScript:** 5.5.4
- CSS for styling (no server-side rendering)
- Component-based architecture
- Role-based routing and guards
- RxJS 7.8.2 for reactive programming
- Standalone components (Angular 18 feature)

### 5.2 Backend - Express.js
**Location:** `express-js-back-end/`
- REST API endpoints
- Authentication middleware
- Role-based authorization
- Data validation and sanitization

### 5.3 Database - MongoDB
**Location:** `mongo-db-database/`
- Docker Compose setup
- MongoDB database container
- MongoDB Express for database administration

### 5.4 Mock Data Server (Development)
**Location:** `angular-18-front-end/db.json`
- **JSON Server:** v0.17.4 for rapid prototyping
- **Port:** 3000 (http://localhost:3000)
- **Data Collections:** users, categories, todos, auth
- **Scripts:**
  - `npm run json-server` - Start JSON server only
  - `npm run dev` - Start both Angular app and JSON server concurrently
- **Features:**
  - Full CRUD operations support
  - RESTful API simulation
  - Real-time data persistence
  - CORS enabled for Angular integration

### 5.5 API Testing
**Location:** `postman-script/`
- Postman collection for all REST endpoints
- Test scenarios for different user roles
- Authentication and authorization tests

## 6. Database Schema

### 6.1 User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  password: String (hashed),
  email: String,
  firstName: String,
  lastName: String,
  roleType: String (enum: ['user', 'admin']),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.2 Category Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  userId: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### 6.3 Todo Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  completed: Boolean,
  priority: String,
  categoryId: ObjectId (ref: Category),
  userId: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### 6.4 Relationships
- User → Categories (1:Many)
- Category → Todos (1:Many)
- User → Todos (1:Many, through categories)

## 7. Development Execution Order (3-Tier Architecture)

### Phase 1: Database Layer (Data Tier) / Mock Data Setup
1. **Setup Development Data Environment**
   - **✅ COMPLETED:** JSON Server setup with db.json
   - **✅ COMPLETED:** Mock data for users, categories, todos, auth
   - **✅ COMPLETED:** Development scripts (json-server, dev)
   - **FUTURE:** MongoDB Docker Environment
     - Create docker-compose.yml with MongoDB and MongoDB Express
     - Configure database connection settings
     - Create start/stop scripts for Docker containers

2. **Database Schema Implementation**
   - Define collections and indexes
   - Set up relationships between collections
   - Create validation rules

3. **Seed Data Generation**
   - Create sample users with different roles
   - Generate categories for each user
   - Populate todos for each category
   - Create data seeding scripts

### Phase 2: Backend Layer (Logic Tier)
4. **Express.js API Development**
   - Project setup with dependencies
   - Database connection configuration
   - Authentication middleware implementation
   - Role-based authorization middleware

5. **REST API Endpoints**
   - User authentication endpoints (login/register)
   - User management endpoints
   - Category CRUD operations
   - Todo CRUD operations
   - Admin-specific endpoints

6. **Security Implementation**
   - Password hashing and validation
   - JWT token generation and verification
   - Input validation and sanitization
   - Rate limiting and security headers

### Phase 3: Frontend Layer (Presentation Tier)
7. **Angular 18 Application Setup**
   - Project initialization with Angular CLI
   - Folder structure and component architecture
   - Routing configuration with guards

8. **Authentication Components**
   - Login component with form validation
   - Registration component
   - Forgot password component
   - Role-based navigation

9. **Todo Management Interface**
   - Dashboard/homepage component
   - Category management components
   - Todo list and item components
   - User profile management

10. **Admin Interface**
    - User management dashboard
    - User activation/deactivation features
    - Admin-specific navigation and components

### Phase 4: Integration & Testing
11. **API Integration**
    - HTTP service implementation
    - Error handling and user feedback
    - Loading states and progress indicators

12. **Testing & Documentation**
    - Postman collection creation
    - API endpoint testing
    - Frontend component testing
    - Documentation updates

## 8. Security Considerations
- Password encryption using bcrypt
- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS configuration
- Rate limiting on sensitive endpoints

## 9. Development Guidelines
- Follow Angular style guide and best practices
- Implement proper error handling throughout the application
- Use TypeScript interfaces for type safety
- Implement responsive design for mobile compatibility
- Follow REST API conventions for endpoint naming
- Use environment variables for configuration
- Implement proper logging for debugging and monitoring