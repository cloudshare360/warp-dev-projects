import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.apiService.getUserProfile().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.setCurrentUser(response.data);
          } else {
            this.logout();
          }
        },
        error: () => this.logout()
      });
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.login(credentials).pipe(
      tap((response) => {
        if (response.success && response.token && response.user) {
          this.storeTokens(response.token, response.refreshToken);
          this.setCurrentUser(response.user);
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.register(userData).pipe(
      tap((response) => {
        if (response.success && response.token && response.user) {
          this.storeTokens(response.token, response.refreshToken);
          this.setCurrentUser(response.user);
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  logout(): void {
    this.apiService.logout().subscribe({
      next: () => this.performLogout(),
      error: () => this.performLogout()
    });
  }

  private performLogout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.apiService.refreshToken().pipe(
      tap((response) => {
        if (response.success && response.token) {
          this.storeTokens(response.token, response.refreshToken);
        } else {
          this.logout();
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.forgotPassword(email);
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.resetPassword(token, newPassword);
  }

  private storeTokens(token: string, refreshToken?: string): void {
    localStorage.setItem('auth_token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  updateUserProfile(userData: Partial<User>): Observable<any> {
    return this.apiService.updateUserProfile(userData).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.setCurrentUser(response.data);
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.apiService.changePassword(currentPassword, newPassword);
  }

  deleteAccount(): Observable<any> {
    return this.apiService.deleteAccount().pipe(
      tap((response) => {
        if (response.success) {
          this.performLogout();
        }
      })
    );
  }
}