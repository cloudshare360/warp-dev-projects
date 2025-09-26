import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { User } from '../../../models/user.model';
import { Category, Todo } from '../../../models/todo.model';
import { CategoryListComponent } from '../../todo/category-list/category-list.component';
import { TodoListComponent } from '../../todo/todo-list/todo-list.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, CategoryListComponent, TodoListComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  currentUser: User | null = null;
  categories: Category[] = [];
  todos: Todo[] = [];
  selectedCategoryId: number | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.apiService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserData();
  }

  private loadUserData() {
    this.isLoading = true;
    this.errorMessage = '';

    if (!this.currentUser) return;

    // Load user categories and todos
    Promise.all([
      this.apiService.getUserCategories(this.currentUser.id!).toPromise(),
      this.apiService.getUserTodos(this.currentUser.id!).toPromise()
    ]).then(([categories, todos]) => {
      this.categories = categories || [];
      this.todos = todos || [];
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading user data:', error);
      this.errorMessage = 'Failed to load dashboard data';
      this.isLoading = false;
    });
  }

  onCategorySelected(categoryId: number | null) {
    this.selectedCategoryId = categoryId;
  }

  onDataChanged() {
    // Reload data when categories or todos are modified
    this.loadUserData();
  }

  logout() {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }

  get filteredTodos(): Todo[] {
    if (!this.selectedCategoryId) {
      return this.todos;
    }
    return this.todos.filter(todo => todo.categoryId === this.selectedCategoryId);
  }

  get todoStats() {
    const completed = this.todos.filter(t => t.completed).length;
    const total = this.todos.length;
    const pending = total - completed;
    
    return { completed, pending, total };
  }
}
