import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="logo-section">
          <h1 class="logo">📋 Todo App</h1>
          <p class="tagline">Create your account</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" formControlName="fullName" placeholder="Enter your full name">
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" formControlName="email" placeholder="Enter your email">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Create a password">
          </div>

          <div class="form-group">
            <label>Confirm Password</label>
            <input type="password" formControlName="confirmPassword" placeholder="Confirm your password">
          </div>

          <div class="role-selector">
            <div class="role-option" [class.selected]="registerForm.get('role')?.value === 'user'" (click)="setRole('user')">
              <strong>User Account</strong>
              <small>Personal task management</small>
            </div>
            <div class="role-option" [class.selected]="registerForm.get('role')?.value === 'admin'" (click)="setRole('admin')">
              <strong>Request Admin</strong>
              <small>Requires approval</small>
            </div>
          </div>

          <button type="submit" class="register-btn" [disabled]="registerForm.invalid || loading">
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>

          <div class="login-section">
            <p>Already have an account?</p>
            <a routerLink="/auth/login" class="login-link">Login</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .register-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 450px;
      width: 100%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .logo-section {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #333;
      margin: 0 0 8px 0;
    }

    .tagline {
      color: #666;
      margin: 0;
      font-size: 16px;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }

    .form-group input {
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
    }

    .role-selector {
      display: flex;
      gap: 12px;
    }

    .role-option {
      flex: 1;
      padding: 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      background: #f8f9fa;
    }

    .role-option.selected {
      border-color: #007bff;
      background: #e7f3ff;
    }

    .register-btn {
      padding: 14px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }

    .register-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .login-section {
      text-align: center;
      margin-top: 20px;
    }

    .login-link {
      color: #007bff;
      text-decoration: none;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['user', Validators.required]
    });
  }

  setRole(role: 'user' | 'admin'): void {
    this.registerForm.patchValue({ role });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      const userData = this.registerForm.value;

      this.authService.register(userData).subscribe({
        next: () => {
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.loading = false;
          console.error('Registration failed:', error);
        }
      });
    }
  }
}