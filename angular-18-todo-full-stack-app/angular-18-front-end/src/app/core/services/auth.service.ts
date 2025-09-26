import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, throwError } from 'rxjs';
import { User, LoginRequest, RegisterRequest, AuthResponse, PasswordResetRequest, PasswordResetConfirm } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // For JSON Server, we'll simulate the auth by finding the user
    return this.http.get<User[]>(`${this.apiUrl}/users?email=${credentials.email}`)
      .pipe(
        map((users: User[]) => {
          if (users.length > 0) {
            const user = users[0];
            // In a real app, password would be verified on the server
            const token = this.generateToken(user);
            const authResponse: AuthResponse = {
              user,
              token,
              expiresIn: 3600 // 1 hour
            };
            this.setSession(authResponse);
            return authResponse;
          } else {
            throw new Error('Invalid credentials');
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    const newUser: Omit<User, 'id'> = {
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      profileImage: '',
      settings: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    };

    return this.http.post<User>(`${this.apiUrl}/users`, newUser);
  }

  forgotPassword(request: PasswordResetRequest): Observable<any> {
    // Simulate sending reset email
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, request);
  }

  resetPassword(request: PasswordResetConfirm): Observable<any> {
    // Simulate password reset
    return this.http.post(`${this.apiUrl}/auth/reset-password`, request);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiration');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiration = localStorage.getItem('tokenExpiration');
    
    if (!token || !expiration) {
      return false;
    }

    const expirationDate = new Date(expiration);
    return new Date() < expirationDate;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || false;
  }

  isUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'user' || false;
  }

  private setSession(authResponse: AuthResponse): void {
    const expirationDate = new Date(Date.now() + authResponse.expiresIn * 1000);
    
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
    localStorage.setItem('tokenExpiration', expirationDate.toISOString());
    
    this.currentUserSubject.next(authResponse.user);
  }

  private generateToken(user: User): string {
    // In a real app, this would be done on the server
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 3600000 // 1 hour
    };
    return btoa(JSON.stringify(payload));
  }
}