// Shared interfaces between Angular frontend and Express backend

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  preferences: {
    theme: 'light' | 'dark';
    defaultView: 'list' | 'grid' | 'calendar';
    itemsPerPage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoList {
  _id: string;
  title: string;
  description?: string;
  color: string;
  isDefault: boolean;
  isShared: boolean;
  sharedWith: string[];
  owner: string;
  todoCount: number;
  completedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Todo {
  _id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags: string[];
  list: string;
  owner: string;
  order: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  refreshToken?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags?: string[];
  list: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags?: string[];
  isCompleted?: boolean;
}

export interface CreateListRequest {
  title: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}

export interface UpdateListRequest {
  title?: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}