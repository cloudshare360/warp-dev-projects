import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent {
  @Input() categories: Category[] = [];
  @Input() selectedCategoryId: string | null = null;
  @Input() currentUserId!: string;
  @Output() categorySelected = new EventEmitter<string | null>();
  @Output() dataChanged = new EventEmitter<void>();

  showAddForm = false;
  newCategory = {
    name: '',
    description: ''
  };
  editingCategory: Category | null = null;
  errorMessage = '';
  successMessage = '';

  constructor() {}

  selectCategory(categoryId: string | null) {
    this.categorySelected.emit(categoryId);
  }

  showAll() {
    this.categorySelected.emit(null);
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.newCategory = { name: '', description: '' };
    this.errorMessage = '';
    this.successMessage = '';
  }

  createCategory() {
    if (!this.newCategory.name.trim()) {
      this.errorMessage = 'Category name is required';
      return;
    }

    // For now, just emit data changed - in real implementation this would call a service
    this.successMessage = 'Category created successfully';
    this.showAddForm = false;
    this.newCategory = { name: '', description: '' };
    this.dataChanged.emit();
    setTimeout(() => this.successMessage = '', 3000);
  }

  startEdit(category: Category) {
    this.editingCategory = { ...category };
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveEdit() {
    if (!this.editingCategory || !this.editingCategory.name.trim()) {
      this.errorMessage = 'Category name is required';
      return;
    }

    // For now, just emit data changed - in real implementation this would call a service
    this.successMessage = 'Category updated successfully';
    this.editingCategory = null;
    this.dataChanged.emit();
    setTimeout(() => this.successMessage = '', 3000);
  }

  cancelEdit() {
    this.editingCategory = null;
    this.errorMessage = '';
  }

  deleteCategory(category: Category) {
    if (confirm(`Are you sure you want to delete "${category.name}"? This will also delete all todos in this category.`)) {
      // For now, just emit data changed - in real implementation this would call a service
      this.successMessage = 'Category deleted successfully';
      this.dataChanged.emit();
      if (this.selectedCategoryId === category.id) {
        this.categorySelected.emit(null);
      }
      setTimeout(() => this.successMessage = '', 3000);
    }
  }
}
