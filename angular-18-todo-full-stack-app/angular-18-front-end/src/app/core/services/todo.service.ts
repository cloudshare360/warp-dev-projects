import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Todo, CreateTodoRequest, UpdateTodoRequest, BulkTodoOperation, TodoFilter, TodoSort } from '../models/todo.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private apiUrl = 'http://localhost:3000/todos';
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  public todos$ = this.todosSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  loadTodos(): Observable<Todo[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable(observer => observer.next([]));
    }

    return this.http.get<Todo[]>(`${this.apiUrl}?userId=${currentUser.id}`)
      .pipe(
        map(todos => {
          this.todosSubject.next(todos);
          return todos;
        })
      );
  }

  getTodos(filter?: TodoFilter, sort?: TodoSort): Observable<Todo[]> {
    let params = new HttpParams();
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      params = params.set('userId', currentUser.id);
    }

    // Apply filters
    if (filter) {
      if (filter.status && filter.status.length > 0) {
        filter.status.forEach(status => {
          params = params.append('status', status);
        });
      }
      if (filter.priority && filter.priority.length > 0) {
        filter.priority.forEach(priority => {
          params = params.append('priority', priority);
        });
      }
      if (filter.category && filter.category.length > 0) {
        filter.category.forEach(category => {
          params = params.append('category', category);
        });
      }
      if (filter.isImportant !== undefined) {
        params = params.set('isImportant', filter.isImportant.toString());
      }
      if (filter.isArchived !== undefined) {
        params = params.set('isArchived', filter.isArchived.toString());
      }
    }

    // Apply sorting
    if (sort) {
      params = params.set('_sort', sort.field);
      params = params.set('_order', sort.direction);
    }

    return this.http.get<Todo[]>(this.apiUrl, { params });
  }

  getTodo(id: string): Observable<Todo> {
    return this.http.get<Todo>(`${this.apiUrl}/${id}`);
  }

  createTodo(todoRequest: CreateTodoRequest): Observable<Todo> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const newTodo: Omit<Todo, 'id'> = {
      userId: currentUser.id,
      title: todoRequest.title,
      description: todoRequest.description || '',
      category: todoRequest.category || 'general',
      priority: todoRequest.priority || 'medium',
      status: 'pending',
      progress: 0,
      dueDate: todoRequest.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: todoRequest.tags || [],
      attachments: [],
      subtasks: todoRequest.subtasks?.map(subtask => ({
        ...subtask,
        id: this.generateId(),
        createdAt: new Date().toISOString()
      })) || [],
      reminders: todoRequest.reminders?.map(reminder => ({
        ...reminder,
        id: this.generateId(),
        sent: false
      })) || [],
      isImportant: todoRequest.isImportant || false,
      isArchived: false
    };

    return this.http.post<Todo>(this.apiUrl, newTodo);
  }

  updateTodo(id: string, todoRequest: UpdateTodoRequest): Observable<Todo> {
    const updateData = {
      ...todoRequest,
      updatedAt: new Date().toISOString()
    };

    return this.http.patch<Todo>(`${this.apiUrl}/${id}`, updateData);
  }

  deleteTodo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkOperation(operation: BulkTodoOperation): Observable<any> {
    // For JSON Server, we'll need to make individual requests
    // In a real backend, this would be a single endpoint
    const requests = operation.todoIds.map(id => {
      switch (operation.operation) {
        case 'complete':
          return this.updateTodo(id, { status: 'completed', progress: 100 });
        case 'delete':
          return this.deleteTodo(id);
        case 'archive':
          return this.updateTodo(id, { isArchived: true });
        case 'change_category':
          return this.updateTodo(id, { category: operation.value });
        case 'change_priority':
          return this.updateTodo(id, { priority: operation.value });
        default:
          throw new Error(`Unknown operation: ${operation.operation}`);
      }
    });

    // Execute all requests
    return new Observable(observer => {
      Promise.all(requests).then(results => {
        observer.next(results);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  searchTodos(query: string): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.apiUrl}?q=${query}`);
  }

  getTodosByCategory(category: string): Observable<Todo[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable(observer => observer.next([]));
    }

    return this.http.get<Todo[]>(`${this.apiUrl}?userId=${currentUser.id}&category=${category}`);
  }

  getImportantTodos(): Observable<Todo[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable(observer => observer.next([]));
    }

    return this.http.get<Todo[]>(`${this.apiUrl}?userId=${currentUser.id}&isImportant=true`);
  }

  getCompletedTodos(): Observable<Todo[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable(observer => observer.next([]));
    }

    return this.http.get<Todo[]>(`${this.apiUrl}?userId=${currentUser.id}&status=completed`);
  }

  getArchivedTodos(): Observable<Todo[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable(observer => observer.next([]));
    }

    return this.http.get<Todo[]>(`${this.apiUrl}?userId=${currentUser.id}&isArchived=true`);
  }

  getOverdueTodos(): Observable<Todo[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable(observer => observer.next([]));
    }

    return this.http.get<Todo[]>(`${this.apiUrl}?userId=${currentUser.id}`)
      .pipe(
        map(todos => todos.filter(todo => {
          if (!todo.dueDate || todo.status === 'completed') return false;
          return new Date(todo.dueDate) < new Date();
        }))
      );
  }

  getTodoStats(): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable(observer => observer.next({}));
    }

    return this.http.get<Todo[]>(`${this.apiUrl}?userId=${currentUser.id}`)
      .pipe(
        map(todos => {
          const now = new Date();
          return {
            total: todos.length,
            pending: todos.filter(t => t.status === 'pending').length,
            inProgress: todos.filter(t => t.status === 'in-progress').length,
            completed: todos.filter(t => t.status === 'completed').length,
            overdue: todos.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length,
            important: todos.filter(t => t.isImportant).length
          };
        })
      );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}