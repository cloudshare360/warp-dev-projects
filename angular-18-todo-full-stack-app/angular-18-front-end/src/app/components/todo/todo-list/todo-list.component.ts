import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Todo } from '../../../core/models/todo.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css'
})
export class TodoListComponent {
  @Input() todos: Todo[] = [];
  @Input() categories: Category[] = [];
  @Input() currentUserId!: string;
  @Output() dataChanged = new EventEmitter<void>();

  showAddForm = false;
  newTodo = {
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    categoryId: null as string | null
  };
  errorMessage = '';
  successMessage = '';
  filterStatus = 'all' as 'all' | 'completed' | 'pending';
  sortBy = 'created' as 'created' | 'priority' | 'title';

  constructor() {}

  get filteredAndSortedTodos(): Todo[] {
    let filtered = this.todos;

    // Filter by status
    switch (this.filterStatus) {
      case 'completed':
        filtered = filtered.filter(todo => todo.status === 'completed');
        break;
      case 'pending':
        filtered = filtered.filter(todo => todo.status !== 'completed');
        break;
      // 'all' shows everything
    }

    // Sort todos
    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.newTodo = {
      title: '',
      description: '',
      priority: 'medium',
      categoryId: null
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  createTodo() {
    if (!this.newTodo.title.trim()) {
      this.errorMessage = 'Todo title is required';
      return;
    }

    if (!this.newTodo.categoryId) {
      this.errorMessage = 'Please select a category';
      return;
    }

    const todoData = {
      title: this.newTodo.title.trim(),
      description: this.newTodo.description.trim(),
      priority: this.newTodo.priority,
      completed: false,
      categoryId: this.newTodo.categoryId,
      userId: this.currentUserId
    };

    // For now, just emit data changed - in real implementation this would call a service
    this.successMessage = 'Todo created successfully';
    this.showAddForm = false;
    this.newTodo = {
      title: '',
      description: '',
      priority: 'medium',
      categoryId: null
    };
    this.dataChanged.emit();
    setTimeout(() => this.successMessage = '', 3000);
  }

  onTodoChanged() {
    this.dataChanged.emit();
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  get todoStats() {
    const total = this.todos.length;
    const completed = this.todos.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const highPriority = this.todos.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    
    return { total, completed, pending, highPriority };
  }

  trackByTodoId(index: number, todo: Todo): string {
    return todo.id;
  }
}
