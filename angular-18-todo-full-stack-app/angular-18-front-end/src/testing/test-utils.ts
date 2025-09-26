import { User, AuthResponse } from '../app/core/models/user.model';
import { Todo } from '../app/core/models/todo.model';
import { Category } from '../app/core/models/category.model';

// Mock Users
export const mockUser: User = {
  id: '1',
  email: 'john.doe@example.com',
  fullName: 'John Doe',
  role: 'user',
  isActive: true,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLoginAt: '2024-01-15T10:30:00.000Z',
  profileImage: '',
  settings: {
    theme: 'light',
    notifications: true,
    language: 'en'
  }
};

export const mockAdmin: User = {
  id: '2',
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'admin',
  isActive: true,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLoginAt: '2024-01-15T10:30:00.000Z',
  profileImage: '',
  settings: {
    theme: 'light',
    notifications: true,
    language: 'en'
  }
};

export const mockAuthResponse: AuthResponse = {
  user: mockUser,
  token: 'mock-jwt-token',
  expiresIn: 3600
};

// Mock Todos
export const mockTodos: Todo[] = [
  {
    id: '1',
    userId: '1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the project',
    category: 'work',
    priority: 'high',
    status: 'pending',
    progress: 0,
    dueDate: '2024-12-31T23:59:59.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    tags: ['documentation', 'project'],
    attachments: [],
    subtasks: [],
    reminders: [],
    isImportant: true,
    isArchived: false
  },
  {
    id: '2',
    userId: '1',
    title: 'Buy groceries',
    description: 'Milk, bread, eggs, fruits',
    category: 'personal',
    priority: 'medium',
    status: 'completed',
    progress: 100,
    dueDate: null,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T12:00:00.000Z',
    tags: ['shopping'],
    attachments: [],
    subtasks: [],
    reminders: [],
    isImportant: false,
    isArchived: false
  }
];

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: '1',
    userId: '1',
    name: 'Work',
    color: '#007bff',
    icon: '💼',
    createdAt: '2024-01-01T00:00:00.000Z',
    todoCount: 5
  },
  {
    id: '2',
    userId: '1',
    name: 'Personal',
    color: '#28a745',
    icon: '🏠',
    createdAt: '2024-01-01T00:00:00.000Z',
    todoCount: 3
  }
];

// Test Data Helpers
export class TestDataHelper {
  static createMockUser(overrides: Partial<User> = {}): User {
    return { ...mockUser, ...overrides };
  }

  static createMockTodo(overrides: Partial<Todo> = {}): Todo {
    return { ...mockTodos[0], ...overrides };
  }

  static createMockCategory(overrides: Partial<Category> = {}): Category {
    return { ...mockCategories[0], ...overrides };
  }

  static createMockAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
    return { ...mockAuthResponse, ...overrides };
  }
}

// Mock HTTP Responses
export const mockHttpResponses = {
  users: [mockUser, mockAdmin],
  todos: mockTodos,
  categories: mockCategories,
  authResponse: mockAuthResponse
};

// Test Constants
export const TEST_CONFIG = {
  API_URL: 'http://localhost:3000',
  AUTH_TOKEN_KEY: 'token',
  USER_KEY: 'currentUser',
  TOKEN_EXPIRY_KEY: 'tokenExpiration'
};

// Mock Local Storage
export class MockLocalStorage {
  private storage: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.storage[key] || null;
  }

  setItem(key: string, value: string): void {
    this.storage[key] = value;
  }

  removeItem(key: string): void {
    delete this.storage[key];
  }

  clear(): void {
    this.storage = {};
  }
}

// Mock Console to suppress console messages in tests
export class MockConsole {
  error = jasmine.createSpy('console.error');
  log = jasmine.createSpy('console.log');
  warn = jasmine.createSpy('console.warn');
}