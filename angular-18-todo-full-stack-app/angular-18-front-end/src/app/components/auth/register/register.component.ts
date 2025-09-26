import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerData = {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    roleType: 'user' as 'user' | 'admin'
  };

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  onSubmit() {
    // Validate form data
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { confirmPassword, ...userData } = this.registerData;

    this.apiService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success) {
          this.successMessage = response.message + '. Redirecting to login...';
          
          // Redirect to login page after successful registration
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Registration service unavailable. Please try again later.';
        console.error('Registration error:', error);
      }
    });
  }

  private isFormValid(): boolean {
    // Check required fields
    if (!this.registerData.username || !this.registerData.email || 
        !this.registerData.firstName || !this.registerData.lastName ||
        !this.registerData.password || !this.registerData.confirmPassword) {
      this.errorMessage = 'Please fill in all required fields';
      return false;
    }

    // Check password confirmation
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return false;
    }

    // Check password strength (minimum 6 characters)
    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    return true;
  }
}
