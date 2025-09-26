import { Injectable } from '@angular/core';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { Category, Todo } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  private mockUsers: User[] = [
    {
      _id: '1',
      username: 'john_user',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roleType: 'user',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: '2',
      username: 'admin_sarah',
      email: 'sarah@example.com',
      firstName: 'Sarah',
      lastName: 'Admin',
      roleType: 'admin',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: '3',
      username: 'jane_user',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      roleType: 'user',
      isActive: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    }
  ];

  private mockCategories: Category[] = [
    {
      _id: '1',
      name: 'Work Tasks',
      description: 'Tasks related to work projects',
      userId: '1',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    },
    {
      _id: '2',
      name: 'Personal',
      description: 'Personal tasks and reminders',
      userId: '1',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    },
    {
      _id: '3',
      name: 'Shopping',
      description: 'Shopping lists and errands',
      userId: '1',
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04')
    }
  ];

  private mockTodos: Todo[] = [
    {
      _id: '1',
      title: 'Complete Angular project setup',
      description: 'Set up the Angular 18 frontend with all necessary components',
      completed: true,
      priority: 'high',
      categoryId: '1',
      userId: '1',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    },
    {
      _id: '2',
      title: 'Write unit tests',
      description: 'Create comprehensive unit tests for all components',
      completed: false,
      priority: 'medium',
      categoryId: '1',
      userId: '1',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    },
    {
      _id: '3',
      title: 'Review code',
      description: 'Perform code review for the authentication module',
      completed: false,
      priority: 'high',
      categoryId: '1',
      userId: '1',
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04')
    },
    {
      _id: '4',
      title: 'Exercise routine',
      description: 'Complete daily 30-minute workout',
      completed: true,
      priority: 'medium',
      categoryId: '2',
      userId: '1',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05')
    },
    {
      _id: '5',
      title: 'Buy groceries',
      description: 'Get vegetables, fruits, and dairy products',
      completed: false,
      priority: 'low',
      categoryId: '3',
      userId: '1',
      createdAt: new Date('2024-01-06'),
      updatedAt: new Date('2024-01-06')
    }
  ];

  private currentUser: User | null = null;
  private authToken: string | null = null;

  constructor() {}

  // Authentication methods
  login(credentials: LoginRequest): AuthResponse {
    const user = this.mockUsers.find(u =>
      u.username === credentials.username &&
      u.roleType === (credentials.roleType || 'user') &&
      u.isActive
    );

    if (user && credentials.password === 'password123') {
      this.currentUser = user;
      this.authToken = 'mock-jwt-token-' + user._id;
      return {
        success: true,
        token: this.authToken,
        user: user,
        message: 'Login successful'
      };
    }

    return {
      success: false,
      message: 'Invalid credentials or user is inactive'
    };
  }

  register(userData: RegisterRequest): AuthResponse {
    if (userData.password !== userData.confirmPassword) {
      return {
        success: false,
        message: 'Passwords do not match'
      };
    }

    const existingUser = this.mockUsers.find(u => u.username === userData.username || u.email === userData.email);
    if (existingUser) {
      return {
        success: false,
        message: 'Username or email already exists'
      };
    }

    const newUser: User = {
      _id: (this.mockUsers.length + 1).toString(),
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      roleType: userData.roleType,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockUsers.push(newUser);
    return {
      success: true,
      message: 'User registration successful'
    };
  }

  logout(): void {
    this.currentUser = null;
    this.authToken = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  // User management methods (for admin)
  getAllUsers(): User[] {
    return this.mockUsers;
  }

  toggleUserStatus(userId: string): boolean {
    const user = this.mockUsers.find(u => u._id === userId);
    if (user) {
      user.isActive = !user.isActive;
      user.updatedAt = new Date();
      return true;
    }
    return false;
  }

  updateUser(userId: string, userData: Partial<User>): boolean {
    const userIndex = this.mockUsers.findIndex(u => u._id === userId);
    if (userIndex !== -1) {
      this.mockUsers[userIndex] = { ...this.mockUsers[userIndex], ...userData, updatedAt: new Date() };
      return true;
    }
    return false;
  }

  // Category methods
  getUserCategories(userId: string): Category[] {
    return this.mockCategories.filter(c => c.userId === userId);
  }

  createCategory(categoryData: { name: string; description: string }): Category {
    const newCategory: Category = {
      _id: (this.mockCategories.length + 1).toString(),
      name: categoryData.name,
      description: categoryData.description,
      userId: this.currentUser!._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockCategories.push(newCategory);
    return newCategory;
  }

  updateCategory(categoryId: string, categoryData: Partial<Category>): boolean {
    const categoryIndex = this.mockCategories.findIndex(c => c._id === categoryId);
    if (categoryIndex !== -1) {
      this.mockCategories[categoryIndex] = { ...this.mockCategories[categoryIndex], ...categoryData, updatedAt: new Date() };
      return true;
    }
    return false;
  }

  deleteCategory(categoryId: string): boolean {
    const categoryIndex = this.mockCategories.findIndex(c => c._id === categoryId);
    if (categoryIndex !== -1) {
      this.mockCategories.splice(categoryIndex, 1);
      // Also delete todos in this category
      this.mockTodos = this.mockTodos.filter(t => t.categoryId !== categoryId);
      return true;
    }
    return false;
  }

  // Todo methods
  getTodosByCategory(categoryId: string): Todo[] {
    return this.mockTodos.filter(t => t.categoryId === categoryId);
  }

  getUserTodos(userId: string): Todo[] {
    return this.mockTodos.filter(t => t.userId === userId);
  }

  createTodo(todoData: { title: string; description: string; priority: 'low' | 'medium' | 'high'; categoryId: string }): Todo {
    const newTodo: Todo = {
      _id: (this.mockTodos.length + 1).toString(),
      title: todoData.title,
      description: todoData.description,
      completed: false,
      priority: todoData.priority,
      categoryId: todoData.categoryId,
      userId: this.currentUser!._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockTodos.push(newTodo);
    return newTodo;
  }

  updateTodo(todoId: string, todoData: Partial<Todo>): boolean {
    const todoIndex = this.mockTodos.findIndex(t => t._id === todoId);
    if (todoIndex !== -1) {
      this.mockTodos[todoIndex] = { ...this.mockTodos[todoIndex], ...todoData, updatedAt: new Date() };
      return true;
    }
    return false;
  }

  deleteTodo(todoId: string): boolean {
    const todoIndex = this.mockTodos.findIndex(t => t._id === todoId);
    if (todoIndex !== -1) {
      this.mockTodos.splice(todoIndex, 1);
      return true;
    }
    return false;
  }

  toggleTodoComplete(todoId: string): boolean {
    const todo = this.mockTodos.find(t => t._id === todoId);
    if (todo) {
      todo.completed = !todo.completed;
      todo.updatedAt = new Date();
      return true;
    }
    return false;
  }
}