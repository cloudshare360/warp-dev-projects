// MongoDB Seed Data for Angular Todo Application
// This script initializes the database with sample users, lists, and todos

print('🚀 Initializing Angular Todo Database...');

// Switch to tododb database
db = db.getSiblingDB('tododb');

// Create collections
db.createCollection('users');
db.createCollection('lists');
db.createCollection('todos');

print('📝 Creating indexes...');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.lists.createIndex({ "userId": 1 });
db.lists.createIndex({ "userId": 1, "name": 1 });
db.todos.createIndex({ "listId": 1 });
db.todos.createIndex({ "userId": 1 });
db.todos.createIndex({ "completed": 1 });

print('👥 Inserting sample users...');

// Insert sample users
const users = [
  {
    _id: ObjectId("65f1234567890abcdef12345"),
    username: "john_doe",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "$2b$10$X8Y2ZmFhYjA5NzE4YjU4Y.rKj8zGvH1lM3pQrS7tU9vWxYz2AbC3e", // password: password123
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    _id: ObjectId("65f1234567890abcdef12346"),
    username: "jane_smith",
    firstName: "Jane",
    lastName: "Smith", 
    email: "jane.smith@example.com",
    password: "$2b$10$X8Y2ZmFhYjA5NzE4YjU4Y.rKj8zGvH1lM3pQrS7tU9vWxYz2AbC3e", // password: password123
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    _id: ObjectId("65f1234567890abcdef12347"),
    username: "demo_user",
    firstName: "Demo",
    lastName: "User",
    email: "demo@example.com", 
    password: "$2b$10$X8Y2ZmFhYjA5NzE4YjU4Y.rKj8zGvH1lM3pQrS7tU9vWxYz2AbC3e", // password: demo123
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
];

db.users.insertMany(users);
print(`✅ Inserted ${users.length} users`);

print('📋 Inserting sample lists...');

// Insert sample lists
const lists = [
  // John Doe's lists
  {
    _id: ObjectId("65f2234567890abcdef12345"),
    userId: ObjectId("65f1234567890abcdef12345"),
    name: "Work Tasks",
    description: "Professional work-related tasks",
    color: "#1976d2",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    _id: ObjectId("65f2234567890abcdef12346"),
    userId: ObjectId("65f1234567890abcdef12345"),
    name: "Personal",
    description: "Personal life tasks and reminders",
    color: "#388e3c",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    _id: ObjectId("65f2234567890abcdef12347"),
    userId: ObjectId("65f1234567890abcdef12345"),
    name: "Shopping",
    description: "Shopping and grocery lists",
    color: "#f57c00",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  // Jane Smith's lists
  {
    _id: ObjectId("65f2234567890abcdef12348"),
    userId: ObjectId("65f1234567890abcdef12346"),
    name: "Project Alpha",
    description: "Tasks for Project Alpha development",
    color: "#7b1fa2",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    _id: ObjectId("65f2234567890abcdef12349"),
    userId: ObjectId("65f1234567890abcdef12346"),
    name: "Health & Fitness",
    description: "Health and fitness goals",
    color: "#d32f2f",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  // Demo User's lists
  {
    _id: ObjectId("65f2234567890abcdef1234a"),
    userId: ObjectId("65f1234567890abcdef12347"),
    name: "Getting Started",
    description: "Sample tasks to get familiar with the app",
    color: "#0288d1",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
];

db.lists.insertMany(lists);
print(`✅ Inserted ${lists.length} lists`);

print('✅ Inserting sample todos...');

// Insert sample todos
const todos = [
  // Work Tasks (John Doe)
  {
    _id: ObjectId("65f3234567890abcdef12345"),
    userId: ObjectId("65f1234567890abcdef12345"),
    listId: ObjectId("65f2234567890abcdef12345"),
    title: "Complete quarterly report",
    description: "Finish Q4 performance analysis and submit to management",
    completed: false,
    priority: "high",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    tags: ["report", "quarterly", "urgent"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("65f3234567890abcdef12346"),
    userId: ObjectId("65f1234567890abcdef12345"),
    listId: ObjectId("65f2234567890abcdef12345"),
    title: "Update project documentation",
    description: "Update README and API documentation for the current project",
    completed: true,
    priority: "medium",
    dueDate: null,
    tags: ["documentation", "project"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(),
    completedAt: new Date()
  },
  {
    _id: ObjectId("65f3234567890abcdef12347"),
    userId: ObjectId("65f1234567890abcdef12345"),
    listId: ObjectId("65f2234567890abcdef12345"),
    title: "Schedule team meeting",
    description: "Schedule weekly sync meeting with the development team",
    completed: false,
    priority: "low",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    tags: ["meeting", "team"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Personal Tasks (John Doe)
  {
    _id: ObjectId("65f3234567890abcdef12348"),
    userId: ObjectId("65f1234567890abcdef12345"),
    listId: ObjectId("65f2234567890abcdef12346"),
    title: "Book dental appointment",
    description: "Schedule routine dental check-up",
    completed: false,
    priority: "medium",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    tags: ["health", "appointment"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("65f3234567890abcdef12349"),
    userId: ObjectId("65f1234567890abcdef12345"),
    listId: ObjectId("65f2234567890abcdef12346"),
    title: "Pay utility bills",
    description: "Pay electricity and water bills",
    completed: true,
    priority: "high",
    dueDate: null,
    tags: ["bills", "utilities"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(),
    completedAt: new Date()
  },
  // Shopping List (John Doe)
  {
    _id: ObjectId("65f3234567890abcdef1234a"),
    userId: ObjectId("65f1234567890abcdef12345"),
    listId: ObjectId("65f2234567890abcdef12347"),
    title: "Buy groceries",
    description: "Milk, bread, eggs, fruits, vegetables",
    completed: false,
    priority: "medium",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
    tags: ["groceries", "food"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Project Alpha (Jane Smith)
  {
    _id: ObjectId("65f3234567890abcdef1234b"),
    userId: ObjectId("65f1234567890abcdef12346"),
    listId: ObjectId("65f2234567890abcdef12348"),
    title: "Design database schema",
    description: "Create ERD and design database tables for the new feature",
    completed: true,
    priority: "high",
    dueDate: null,
    tags: ["database", "design", "schema"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    _id: ObjectId("65f3234567890abcdef1234c"),
    userId: ObjectId("65f1234567890abcdef12346"),
    listId: ObjectId("65f2234567890abcdef12348"),
    title: "Implement authentication module",
    description: "Build JWT-based authentication for the API",
    completed: false,
    priority: "high",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    tags: ["auth", "jwt", "api"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Demo User todos
  {
    _id: ObjectId("65f3234567890abcdef1234d"),
    userId: ObjectId("65f1234567890abcdef12347"),
    listId: ObjectId("65f2234567890abcdef1234a"),
    title: "Welcome to Angular Todo App!",
    description: "This is your first todo item. Try marking it as complete!",
    completed: false,
    priority: "low",
    dueDate: null,
    tags: ["welcome", "demo"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId("65f3234567890abcdef1234e"),
    userId: ObjectId("65f1234567890abcdef12347"),
    listId: ObjectId("65f2234567890abcdef1234a"),
    title: "Explore the features",
    description: "Try creating new lists, adding todos, and filtering tasks",
    completed: false,
    priority: "medium",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    tags: ["explore", "features"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.todos.insertMany(todos);
print(`✅ Inserted ${todos.length} todos`);

print('📊 Database Statistics:');
print(`Users: ${db.users.countDocuments()}`);
print(`Lists: ${db.lists.countDocuments()}`);
print(`Todos: ${db.todos.countDocuments()}`);

print('✅ Angular Todo Database initialization completed successfully!');
print('🔍 You can now access MongoDB Express UI at: http://localhost:8081');
print('   Username: admin');
print('   Password: admin123');