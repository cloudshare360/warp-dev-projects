# Angular Todo Application Requirements

## Project Overview
- Modern todo application using Angular 18
- TypeScript for type safety
- Material UI for professional design
- RESTful API integration

## Features Required
Todo App has following domain objects / actors

Users
List
Todos

Users
- [ ] Signup for user/ registration for user
- [ ] Login user
- [ ] Forgot password
- [ ] User when visits the todo app, he will see, login screen for username and password and submit button. 
- [ ] If he is a first time user, he has to click on signup page
       user is rediected to sign page and user will enter firstname, lastname
       emailid, password, verify password and submit button.
       verify if password and verify password field matches each other, user profile is created
- [ ] user forgot password
       when user clicks on forgot password, he will ask to enter his username, new password, and verify password; when he clicks on submit, new password will be updated in the system.
       he is redirected to login page
- [ ] User on Login
        user can create multiple list
        each list, he or she can create multiple todo list for each list
        one user can create multiple list, each list has multiple todo tasks; 

Lists
- [ ] User can add a list
- [ ] user can delete a list
- [ ] user can edit/update a list name
- [ ] user on selecting a list, he can perform crud  with todos
- [ ] Filter todos (all, active, completed)
- [ ] Responsive design

Todos
- [ ] Add new todos
- [ ] Mark todos as complete
- [ ] Edit existing todos
- [ ] Delete todos
- [ ] Filter todos (all, active, completed)
- [ ] Responsive design

Create Following Folders
Front-End
    angular-18-todo-app: user angular 18, material ui, css to create screens as described above
      
Back-End
    express-rest-todo-api
        Rest Api for login, create profile, forgot password, 
        create list for a selected user, for each list,  crud for todo task api are created
data-base
    mongodb
        docker-compose: it will start monodb, mongodb ui, create todo database; it will add few list of users, each user with list of categories/list. each list will have muultiple todo as seed data
        on start of docker-compose, the database service is started , where tododb is created, seed data is imported.
        seed-data-folder- contains seed data for starting the application
        datafolder
            datafolders contains the database and all the data of mongodb is persisted with in the folder
    

## Technical Requirements
- Angular 18+
- TypeScript
- Angular Material
- RxJS for reactive programming
- Unit testing with Jasmine
- Front-End- Angular 18
- Back-End - expressjs
- database - momgodb

## Getting Started
1. Create MongoDB, Include scripts to setup docker-compose
    create scripts to start the database
    create scripts to stop the database
    create instruction file, how to work with mongodb ui, login and perform, db operations

2. Create Express Rest API. Create CURL scripts to perform all the operations with sample data and to test each operations
3. Postman collection: create postman collection for rest api; include examples to perform each operation
4. Swagger-UI: Create a swagger ui folder and create endpoints where user can perform operation using swagger ui
5. Create front-end using angular 18
6. create Readme file how to start and use the application
7. create project-tracker file, where it will help AI agent, user to check what tasks are completed and which are pending. after every task completion, update the project tracker document
8. Create a project requirement document, refine the content: give name as angular-todo-app-requirement.md
9.based on the best practices, check if any requirements or functionality is missing and add the require tasks to run the application locally and do end to end testing
10: include a user guide, how to start the application step by step viz, starting mongo-db, express-js-rest-api and finally angular-ui. create a single script which will start each service and verify the service availablity and start all the services sequencially.
