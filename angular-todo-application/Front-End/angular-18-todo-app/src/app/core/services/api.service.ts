import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  ApiResponse, 
  AuthResponse, 
  User, 
  Todo, 
  TodoList,
  LoginRequest,
  RegisterRequest,
  CreateTodoRequest,
  UpdateTodoRequest,
  CreateListRequest,
  UpdateListRequest 
} from '../../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  // Authentication endpoints
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(catchError(this.handleError));
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, userData)
      .pipe(catchError(this.handleError));
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken })
      .pipe(catchError(this.handleError));
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/auth/logout`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  forgotPassword(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/auth/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/auth/reset-password`, {
      token,
      newPassword
    }).pipe(catchError(this.handleError));
  }

  // User endpoints
  getUserProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  updateUserProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/profile`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/users/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  deleteAccount(): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/users/account`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // List endpoints
  getLists(): Observable<ApiResponse<TodoList[]>> {
    return this.http.get<ApiResponse<TodoList[]>>(`${this.baseUrl}/lists`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  getList(id: string): Observable<ApiResponse<TodoList>> {
    return this.http.get<ApiResponse<TodoList>>(`${this.baseUrl}/lists/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  createList(listData: CreateListRequest): Observable<ApiResponse<TodoList>> {
    return this.http.post<ApiResponse<TodoList>>(`${this.baseUrl}/lists`, listData, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  updateList(id: string, listData: UpdateListRequest): Observable<ApiResponse<TodoList>> {
    return this.http.put<ApiResponse<TodoList>>(`${this.baseUrl}/lists/${id}`, listData, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  deleteList(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/lists/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // Todo endpoints
  getTodos(params?: { listId?: string; completed?: boolean; priority?: string }): Observable<ApiResponse<Todo[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.listId) httpParams = httpParams.set('listId', params.listId);
      if (params.completed !== undefined) httpParams = httpParams.set('completed', params.completed.toString());
      if (params.priority) httpParams = httpParams.set('priority', params.priority);
    }

    return this.http.get<ApiResponse<Todo[]>>(`${this.baseUrl}/todos`, {
      headers: this.getAuthHeaders(),
      params: httpParams
    }).pipe(catchError(this.handleError));
  }

  getTodo(id: string): Observable<ApiResponse<Todo>> {
    return this.http.get<ApiResponse<Todo>>(`${this.baseUrl}/todos/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  createTodo(todoData: CreateTodoRequest): Observable<ApiResponse<Todo>> {
    return this.http.post<ApiResponse<Todo>>(`${this.baseUrl}/todos`, todoData, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  updateTodo(id: string, todoData: UpdateTodoRequest): Observable<ApiResponse<Todo>> {
    return this.http.put<ApiResponse<Todo>>(`${this.baseUrl}/todos/${id}`, todoData, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  deleteTodo(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/todos/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  toggleTodo(id: string): Observable<ApiResponse<Todo>> {
    return this.http.patch<ApiResponse<Todo>>(`${this.baseUrl}/todos/${id}/toggle`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  reorderTodos(todoId: string, newOrder: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/todos/${todoId}/reorder`, {
      newOrder
    }, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }
}