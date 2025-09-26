import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User, LoginRequest, AuthResponse } from '../models/user.model';
import { Category, Todo } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check for stored user data on service initialization
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // Authentication methods
  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Simulate authentication by checking against auth endpoint
    return new Observable(observer => {
      this.http.get<any[]>(`${this.API_URL}/auth`).subscribe({
        next: (authData) => {
          const validUser = authData.find(auth =>
            auth.username === credentials.username &&
            auth.password === credentials.password &&
            auth.roleType === credentials.roleType
          );

          if (validUser) {
            // Get full user data
            this.http.get<User>(`${this.API_URL}/users/${validUser.userId}`).subscribe({
              next: (userData) => {
                if (userData.isActive) {
                  // Store user data
                  localStorage.setItem('currentUser', JSON.stringify(userData));
                  localStorage.setItem('authToken', `mock-token-${userData.id}`);
                  this.currentUserSubject.next(userData);

                  observer.next({
                    success: true,
                    token: `mock-token-${userData.id}`,
                    user: userData,
                    message: 'Login successful'
                  });
                } else {
                  observer.next({
                    success: false,
                    message: 'User account is inactive'
                  });
                }
                observer.complete();
              },
              error: () => {
                observer.next({
                  success: false,
                  message: 'Error retrieving user data'
                });
                observer.complete();
              }
            });
          } else {
            observer.next({
              success: false,
              message: 'Invalid credentials'
            });
            observer.complete();
          }
        },
        error: () => {
          observer.next({
            success: false,
            message: 'Authentication service unavailable'
          });
          observer.complete();
        }
      });
    });
  }

  register(userData: any): Observable<AuthResponse> {
    return new Observable(observer => {
      // Check if username or email already exists
      this.http.get<User[]>(`${this.API_URL}/users`).subscribe({
        next: (users) => {
          const existingUser = users.find(u =>
            u.username === userData.username || u.email === userData.email
          );

          if (existingUser) {
            observer.next({
              success: false,
              message: 'Username or email already exists'
            });
            observer.complete();
            return;
          }

          // Create new user
          const newUser: Omit<User, 'id'> = {
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            roleType: userData.roleType,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          this.http.post<User>(`${this.API_URL}/users`, newUser).subscribe({
            next: (createdUser) => {
              // Create auth record
              const authRecord = {
                username: userData.username,
                password: userData.password,
                roleType: userData.roleType,
                userId: createdUser.id
              };

              this.http.post(`${this.API_URL}/auth`, authRecord).subscribe({
                next: () => {
                  observer.next({
                    success: true,
                    message: 'Registration successful'
                  });
                  observer.complete();
                },
                error: () => {
                  observer.next({
                    success: false,
                    message: 'Error creating authentication record'
                  });
                  observer.complete();
                }
              });
            },
            error: () => {
              observer.next({
                success: false,
                message: 'Error creating user account'
              });
              observer.complete();
            }
          });
        },
        error: () => {
          observer.next({
            success: false,
            message: 'Registration service unavailable'
          });
          observer.complete();
        }
      });
    });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // User management methods
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`);
  }

  updateUser(userId: number, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/users/${userId}`, {
      ...userData,
      updatedAt: new Date()
    });
  }

  toggleUserStatus(userId: number): Observable<User> {
    return new Observable(observer => {
      this.http.get<User>(`${this.API_URL}/users/${userId}`).subscribe({
        next: (user) => {
          const updatedUser = {
            ...user,
            isActive: !user.isActive,
            updatedAt: new Date()
          };

          this.http.put<User>(`${this.API_URL}/users/${userId}`, updatedUser).subscribe({
            next: (result) => {
              observer.next(result);
              observer.complete();
            },
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // Category methods
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.API_URL}/categories`);
  }

  getUserCategories(userId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.API_URL}/categories?userId=${userId}`);
  }

  createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Observable<Category> {
    return this.http.post<Category>(`${this.API_URL}/categories`, {
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  updateCategory(categoryId: number, categoryData: Partial<Category>): Observable<Category> {
    return this.http.patch<Category>(`${this.API_URL}/categories/${categoryId}`, {
      ...categoryData,
      updatedAt: new Date()
    });
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/categories/${categoryId}`);
  }

  // Todo methods
  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.API_URL}/todos`);
  }

  getUserTodos(userId: number): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.API_URL}/todos?userId=${userId}`);
  }

  getTodosByCategory(categoryId: number): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.API_URL}/todos?categoryId=${categoryId}`);
  }

  createTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Observable<Todo> {
    return this.http.post<Todo>(`${this.API_URL}/todos`, {
      ...todoData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  updateTodo(todoId: number, todoData: Partial<Todo>): Observable<Todo> {
    return this.http.patch<Todo>(`${this.API_URL}/todos/${todoId}`, {
      ...todoData,
      updatedAt: new Date()
    });
  }

  deleteTodo(todoId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/todos/${todoId}`);
  }

  toggleTodoComplete(todoId: number): Observable<Todo> {
    return new Observable(observer => {
      this.http.get<Todo>(`${this.API_URL}/todos/${todoId}`).subscribe({
        next: (todo) => {
          const updatedTodo = {
            ...todo,
            completed: !todo.completed,
            updatedAt: new Date()
          };

          this.http.put<Todo>(`${this.API_URL}/todos/${todoId}`, updatedTodo).subscribe({
            next: (result) => {
              observer.next(result);
              observer.complete();
            },
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }
}