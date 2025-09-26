export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleType: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
  roleType?: 'user' | 'admin';
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  roleType: 'user' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message: string;
}