Developing angular Todo Application.

The application has user.
user has two roles 
    user
    admin

user
    user will be provided with login page
    a new user to the system will do sign-up page
    for signup
        user will provide
            username
            password
            validate password
            emailid
            firstname
            lastname
            role type: user, admin
        on submit above details, user will be directed to login page with message, user has be created successfully
    user login page
        will have form to input username and password
        it will have submit button to login to the portal
        it will have link to signup page for new user
        it will have link to forgot password page
        on successful validation of username and password, user will be able to login to homepage
        if username and password are invalid, user will stay in homepage, mentioning, user has to enter correct username and password
    
        on the login page, it will has link to login as admin.
        in this page, user will select role as admin, and provide username and password.
        in order to login has admin, user role should be admin
application is a fullstack applicaton
create following folders
    angular-18-front-end
        application is developed in angular 18 version. 
        use css for sytling
        no server-side rendering
    express-js-back-end
        all the rest endpoints are created

    mongo-db-database
        create a docker compose
            docker-compose will have mongodb database and mongodb express to access the database
        Schema:
            user has roles, user, admin
            user has
                firstname, lastname, emailid, username, password. roletype
            user of type admin can active or deactive user profile
            user will select role type to login with appropriate role
            the user loggedin, can update their respective user details
            admin user can update his user profile details, as well as other profile details
            but normal user can only update his or her own profile details
            the loggedin user can create categories of todo
            for each category, he can create todo items list
            user can have many categories. each category has multiple todos
            admin can not view the todo list of users or categories

    postman-script
            create post-man collection for all the rest endpoints

order of execution.
    create angular front-end website
    create mongodb
    create restapi using expressjs framework
    use rolebased authentication and authorization

    create mongodb docker
        create schema based on relationship
            user has multiple categories
            each category has multiple todo list
            user has user table where his user profile details are maintained
            user->1-M->Categroies
            Category -> Many todos
        once the schema is generated
        generate seed data for multiple users, each user having multiple categories. each category has multiple todos
        create script to start and stop the docker-compose
    

    