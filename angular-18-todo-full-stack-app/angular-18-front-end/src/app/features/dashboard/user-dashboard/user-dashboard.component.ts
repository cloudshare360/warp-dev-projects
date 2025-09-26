import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TodoService } from '../../../core/services/todo.service';
import { AuthService } from '../../../core/services/auth.service';
import { Todo } from '../../../core/models/todo.model';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard">
      <!-- Stats Cards -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.pending }}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.completed }}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.overdue }}</div>
            <div class="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      <!-- Todo Section -->
      <div class="todo-section">
        <div class="section-header">
          <h2>My Todo List</h2>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="showCreateModal = true">+ Add Todo</button>
            <button class="btn btn-secondary">⚙️ Settings</button>
          </div>
        </div>

        <!-- Quick Add -->
        <div class="quick-add" *ngIf="!showCreateModal">
          <form [formGroup]="quickAddForm" (ngSubmit)="quickAddTodo()" class="quick-add-form">
            <input 
              type="text" 
              formControlName="title"
              placeholder="Quick add a new todo..."
              class="quick-input">
            <select formControlName="priority" class="quick-select">
              <option value="medium">Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select formControlName="category" class="quick-select">
              <option value="general">Category</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="shopping">Shopping</option>
            </select>
            <button type="submit" class="btn btn-primary" [disabled]="!quickAddForm.get('title')?.value">Add</button>
          </form>
        </div>

        <!-- Filters -->
        <div class="filters">
          <button 
            class="filter-btn"
            [class.active]="activeFilter === 'all'"
            (click)="setFilter('all')">All</button>
          <button 
            class="filter-btn"
            [class.active]="activeFilter === 'pending'"
            (click)="setFilter('pending')">Pending</button>
          <button 
            class="filter-btn"
            [class.active]="activeFilter === 'completed'"
            (click)="setFilter('completed')">Completed</button>
          <button 
            class="filter-btn"
            [class.active]="activeFilter === 'high'"
            (click)="setFilter('high')">High Priority</button>
          <button 
            class="filter-btn"
            [class.active]="activeFilter === 'today'"
            (click)="setFilter('today')">Due Today</button>
          <button 
            class="filter-btn"
            [class.active]="activeFilter === 'overdue'"
            (click)="setFilter('overdue')">Overdue</button>
        </div>

        <!-- Todo List -->
        <div class="todo-list">
          <div 
            class="todo-item"
            [class.priority-high]="todo.priority === 'high'"
            [class.priority-medium]="todo.priority === 'medium'"
            [class.priority-low]="todo.priority === 'low'"
            [class.completed]="todo.status === 'completed'"
            *ngFor="let todo of filteredTodos">
            
            <input 
              type="checkbox" 
              class="todo-checkbox"
              [checked]="todo.status === 'completed'"
              (change)="toggleComplete(todo)">
            
            <div class="todo-content">
              <div class="todo-title" [class.strike]="todo.status === 'completed'">{{ todo.title }}</div>
              <div class="todo-meta">
                <span class="category-tag">{{ todo.category }}</span>
                <span class="due-date" *ngIf="todo.dueDate">
                  Due: {{ formatDate(todo.dueDate) }}
                </span>
                <span class="priority">Priority: {{ todo.priority }}</span>
              </div>
            </div>
            
            <div class="todo-actions">
              <button class="action-btn" (click)="editTodo(todo)" title="Edit">✏️</button>
              <button class="action-btn" (click)="deleteTodo(todo)" title="Delete">🗑️</button>
              <button class="action-btn" (click)="toggleImportant(todo)" title="Important">⭐</button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="filteredTodos.length > 0">
          <button class="btn btn-secondary">← Previous</button>
          <span class="page-info">Page 1 of {{ Math.ceil(filteredTodos.length / 10) }} ({{ filteredTodos.length }} items)</span>
          <button class="btn btn-secondary">Next →</button>
        </div>
      </div>

      <!-- Create Todo Modal -->
      <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New Todo</h3>
            <button class="close-btn" (click)="showCreateModal = false">✕</button>
          </div>
          <form [formGroup]="createForm" (ngSubmit)="createTodo()">
            <div class="form-group">
              <label>Title *</label>
              <input type="text" formControlName="title" placeholder="Enter todo title...">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea formControlName="description" placeholder="Add detailed description..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select formControlName="category">
                  <option value="general">General</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="shopping">Shopping</option>
                </select>
              </div>
              <div class="form-group">
                <label>Due Date</label>
                <input type="datetime-local" formControlName="dueDate">
              </div>
            </div>
            <div class="form-group">
              <label>Priority</label>
              <div class="priority-selector">
                <button type="button" 
                  class="priority-btn"
                  [class.selected]="createForm.get('priority')?.value === 'high'"
                  (click)="setPriority('high')">High</button>
                <button type="button" 
                  class="priority-btn"
                  [class.selected]="createForm.get('priority')?.value === 'medium'"
                  (click)="setPriority('medium')">Medium</button>
                <button type="button" 
                  class="priority-btn"
                  [class.selected]="createForm.get('priority')?.value === 'low'"
                  (click)="setPriority('low')">Low</button>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!createForm.get('title')?.value">Create Todo</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .stats-section {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
      margin-bottom: 8px;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .todo-section {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    }

    .section-header h2 {
      margin: 0;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #ddd;
    }

    .btn-secondary:hover {
      background: #e9ecef;
    }

    .quick-add {
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .quick-add-form {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .quick-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .quick-select {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .filters {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 6px 12px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 16px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .filter-btn:hover {
      border-color: #007bff;
    }

    .filter-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .todo-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .todo-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      transition: all 0.2s ease;
      border-left: 4px solid #ddd;
    }

    .todo-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .todo-item.priority-high {
      border-left-color: #dc3545;
    }

    .todo-item.priority-medium {
      border-left-color: #ffc107;
    }

    .todo-item.priority-low {
      border-left-color: #28a745;
    }

    .todo-item.completed {
      opacity: 0.6;
      background: #f8f9fa;
    }

    .todo-checkbox {
      width: 18px;
      height: 18px;
    }

    .todo-content {
      flex: 1;
    }

    .todo-title {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .todo-title.strike {
      text-decoration: line-through;
    }

    .todo-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #666;
    }

    .category-tag {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 10px;
    }

    .todo-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .action-btn:hover {
      background: #f0f0f0;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }

    .page-info {
      color: #666;
      font-size: 14px;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
      color: #333;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group textarea {
      height: 80px;
      resize: vertical;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .priority-selector {
      display: flex;
      gap: 8px;
    }

    .priority-btn {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .priority-btn.selected {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }

    @media (max-width: 768px) {
      .dashboard {
        padding: 16px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .header-actions {
        flex-direction: column;
        gap: 8px;
      }

      .quick-add-form {
        flex-direction: column;
        align-items: stretch;
      }

      .filters {
        justify-content: flex-start;
        overflow-x: auto;
        padding-bottom: 8px;
      }

      .form-row {
        flex-direction: column;
        gap: 16px;
      }

      .priority-selector {
        flex-direction: column;
      }
    }
  `]
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  todos: Todo[] = [];
  filteredTodos: Todo[] = [];
  stats = { total: 0, pending: 0, completed: 0, overdue: 0 };
  activeFilter = 'all';
  showCreateModal = false;
  Math = Math;

  quickAddForm: FormGroup;
  createForm: FormGroup;

  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private todoService: TodoService,
    private authService: AuthService
  ) {
    this.quickAddForm = this.fb.group({
      title: [''],
      priority: ['medium'],
      category: ['general']
    });

    this.createForm = this.fb.group({
      title: [''],
      description: [''],
      category: ['general'],
      dueDate: [''],
      priority: ['medium']
    });
  }

  ngOnInit(): void {
    this.loadTodos();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadTodos(): void {
    this.subscription.add(
      this.todoService.getTodos().subscribe({
        next: (todos) => {
          this.todos = todos;
          this.applyFilter();
        },
        error: (error) => {
          console.error('Error loading todos:', error);
        }
      })
    );
  }

  loadStats(): void {
    this.subscription.add(
      this.todoService.getTodoStats().subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        }
      })
    );
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    const now = new Date();
    
    switch (this.activeFilter) {
      case 'pending':
        this.filteredTodos = this.todos.filter(todo => todo.status === 'pending');
        break;
      case 'completed':
        this.filteredTodos = this.todos.filter(todo => todo.status === 'completed');
        break;
      case 'high':
        this.filteredTodos = this.todos.filter(todo => todo.priority === 'high');
        break;
      case 'today':
        this.filteredTodos = this.todos.filter(todo => {
          if (!todo.dueDate) return false;
          const dueDate = new Date(todo.dueDate);
          return dueDate.toDateString() === now.toDateString();
        });
        break;
      case 'overdue':
        this.filteredTodos = this.todos.filter(todo => {
          if (!todo.dueDate || todo.status === 'completed') return false;
          return new Date(todo.dueDate) < now;
        });
        break;
      default:
        this.filteredTodos = this.todos;
    }
  }

  quickAddTodo(): void {
    if (this.quickAddForm.get('title')?.value) {
      const todoData = this.quickAddForm.value;
      
      this.subscription.add(
        this.todoService.createTodo(todoData).subscribe({
          next: () => {
            this.quickAddForm.reset({ priority: 'medium', category: 'general' });
            this.loadTodos();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error creating todo:', error);
          }
        })
      );
    }
  }

  createTodo(): void {
    if (this.createForm.get('title')?.value) {
      const todoData = this.createForm.value;
      
      this.subscription.add(
        this.todoService.createTodo(todoData).subscribe({
          next: () => {
            this.createForm.reset({ priority: 'medium', category: 'general' });
            this.showCreateModal = false;
            this.loadTodos();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error creating todo:', error);
          }
        })
      );
    }
  }

  setPriority(priority: string): void {
    this.createForm.patchValue({ priority });
  }

  toggleComplete(todo: Todo): void {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    const progress = newStatus === 'completed' ? 100 : 0;
    
    this.subscription.add(
      this.todoService.updateTodo(todo.id, { status: newStatus, progress }).subscribe({
        next: () => {
          this.loadTodos();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error updating todo:', error);
        }
      })
    );
  }

  editTodo(todo: Todo): void {
    // TODO: Implement edit functionality
    console.log('Edit todo:', todo);
  }

  deleteTodo(todo: Todo): void {
    if (confirm('Are you sure you want to delete this todo?')) {
      this.subscription.add(
        this.todoService.deleteTodo(todo.id).subscribe({
          next: () => {
            this.loadTodos();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error deleting todo:', error);
          }
        })
      );
    }
  }

  toggleImportant(todo: Todo): void {
    this.subscription.add(
      this.todoService.updateTodo(todo.id, { isImportant: !todo.isImportant }).subscribe({
        next: () => {
          this.loadTodos();
        },
        error: (error) => {
          console.error('Error updating todo:', error);
        }
      })
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}