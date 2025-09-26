import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { User, TodoList, Todo } from '../../shared/interfaces/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Todo Dashboard</h1>
        </div>
        <div class="nav-user">
          <span class="welcome-text" *ngIf="currentUser">
            Welcome, {{ currentUser.firstName }}!
          </span>
          <button class="btn btn-secondary" (click)="logout()">
            Logout
          </button>
        </div>
      </nav>

      <main class="main-content">
        <div class="dashboard-grid">
          <!-- Stats Cards -->
          <div class="stats-section">
            <div class="stat-card">
              <div class="stat-number">{{ totalTodos }}</div>
              <div class="stat-label">Total Todos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ completedTodos }}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ totalLists }}</div>
              <div class="stat-label">Lists</div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="actions-section">
            <h2>Quick Actions</h2>
            <div class="action-buttons">
              <button class="btn btn-primary" (click)="createNewTodo()">
                <i class="icon">+</i>
                Add New Todo
              </button>
              <button class="btn btn-outline" (click)="createNewList()">
                <i class="icon">📋</i>
                Create List
              </button>
            </div>
          </div>

          <!-- Recent Todos -->
          <div class="recent-todos">
            <h2>Recent Todos</h2>
            <div class="todo-list" *ngIf="recentTodos.length > 0; else noTodos">
              <div 
                class="todo-item" 
                *ngFor="let todo of recentTodos"
                [class.completed]="todo.isCompleted"
              >
                <div class="todo-content">
                  <div class="todo-title">{{ todo.title }}</div>
                  <div class="todo-meta">
                    <span class="priority" [class]="'priority-' + todo.priority">
                      {{ todo.priority }}
                    </span>
                    <span class="due-date" *ngIf="todo.dueDate">
                      Due: {{ formatDate(todo.dueDate) }}
                    </span>
                  </div>
                </div>
                <div class="todo-actions">
                  <button 
                    class="btn-icon" 
                    (click)="toggleTodo(todo._id)"
                    [title]="todo.isCompleted ? 'Mark as incomplete' : 'Mark as complete'"
                  >
                    {{ todo.isCompleted ? '✓' : '○' }}
                  </button>
                </div>
              </div>
            </div>
            <ng-template #noTodos>
              <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>No todos yet. Create your first one!</p>
                <button class="btn btn-primary" (click)="createNewTodo()">
                  Create Todo
                </button>
              </div>
            </ng-template>
          </div>

          <!-- Lists Overview -->
          <div class="lists-overview">
            <h2>Your Lists</h2>
            <div class="lists-grid" *ngIf="todoLists.length > 0; else noLists">
              <div 
                class="list-card" 
                *ngFor="let list of todoLists"
                (click)="openList(list._id)"
              >
                <div class="list-header">
                  <div class="list-color" [style.background-color]="list.color"></div>
                  <div class="list-title">{{ list.title }}</div>
                </div>
                <div class="list-stats">
                  <span class="todo-count">
                    {{ list.completedCount }}/{{ list.todoCount }} completed
                  </span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    [style.width.%]="getCompletionPercentage(list)"
                  ></div>
                </div>
              </div>
            </div>
            <ng-template #noLists>
              <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>No lists yet. Create your first list!</p>
                <button class="btn btn-outline" (click)="createNewList()">
                  Create List
                </button>
              </div>
            </ng-template>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .navbar {
      background: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand h1 {
      color: #333;
      margin: 0;
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .welcome-text {
      color: #666;
      font-weight: 500;
    }

    .main-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .stats-section {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .stat-number {
      font-size: 3rem;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #666;
      font-weight: 500;
    }

    .actions-section, .recent-todos, .lists-overview {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .actions-section h2, .recent-todos h2, .lists-overview h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: #333;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-outline {
      background: transparent;
      border: 2px solid #667eea;
      color: #667eea;
    }

    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .todo-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .todo-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .todo-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .todo-item.completed {
      opacity: 0.7;
    }

    .todo-item.completed .todo-title {
      text-decoration: line-through;
    }

    .todo-content {
      flex: 1;
    }

    .todo-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .todo-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #666;
    }

    .priority {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-high {
      background: #fee2e2;
      color: #dc2626;
    }

    .priority-medium {
      background: #fef3c7;
      color: #d97706;
    }

    .priority-low {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-icon {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .btn-icon:hover {
      background: #f8f9fa;
    }

    .lists-grid {
      display: grid;
      gap: 1rem;
    }

    .list-card {
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .list-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .list-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .list-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .list-title {
      font-weight: 600;
      color: #333;
    }

    .list-stats {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 4px;
      background: #e1e5e9;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      
      .main-content {
        padding: 1rem;
      }
      
      .navbar {
        padding: 1rem;
      }
      
      .nav-user {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  todoLists: TodoList[] = [];
  recentTodos: Todo[] = [];
  
  totalTodos = 0;
  completedTodos = 0;
  totalLists = 0;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Load lists
    this.apiService.getLists().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.todoLists = response.data;
          this.totalLists = this.todoLists.length;
        }
      },
      error: (error) => console.error('Error loading lists:', error)
    });

    // Load recent todos
    this.apiService.getTodos().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentTodos = response.data
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
          
          this.totalTodos = response.data.length;
          this.completedTodos = response.data.filter(todo => todo.isCompleted).length;
        }
      },
      error: (error) => console.error('Error loading todos:', error)
    });
  }

  logout(): void {
    this.authService.logout();
  }

  createNewTodo(): void {
    // Navigate to todo creation or open modal
    console.log('Create new todo');
  }

  createNewList(): void {
    // Navigate to list creation or open modal
    console.log('Create new list');
  }

  openList(listId: string): void {
    console.log('Open list:', listId);
  }

  toggleTodo(todoId: string): void {
    this.apiService.toggleTodo(todoId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadDashboardData(); // Refresh data
        }
      },
      error: (error) => console.error('Error toggling todo:', error)
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getCompletionPercentage(list: TodoList): number {
    if (list.todoCount === 0) return 0;
    return (list.completedCount / list.todoCount) * 100;
  }
}