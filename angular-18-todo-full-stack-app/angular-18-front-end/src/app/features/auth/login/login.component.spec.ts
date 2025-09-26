import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { 
  mockUser, 
  mockAdmin, 
  mockAuthResponse, 
  TestDataHelper
} from '../../../../testing/test-utils';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize login form with correct validators', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeTruthy();
      expect(component.loginForm.get('password')).toBeTruthy();
      expect(component.loginForm.get('role')).toBeTruthy();
    });

    it('should set default role to user', () => {
      expect(component.role?.value).toBe('user');
    });

    it('should form be invalid initially', () => {
      expect(component.loginForm.valid).toBeFalsy();
    });
  });

  describe('Form Validation', () => {
    it('should require email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      
      expect(emailControl?.hasError('required')).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      
      expect(emailControl?.hasError('email')).toBeTruthy();
    });

    it('should require password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.hasError('required')).toBeTruthy();
    });

    it('should enforce minimum password length', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
    });

    it('should be valid with correct values', () => {
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
        role: 'user'
      });
      
      expect(component.loginForm.valid).toBeTruthy();
    });
  });

  describe('Role Selection', () => {
    it('should select user role', () => {
      component.selectRole('user');
      expect(component.role?.value).toBe('user');
    });

    it('should select admin role', () => {
      component.selectRole('admin');
      expect(component.role?.value).toBe('admin');
    });

    it('should update form control when role changes', () => {
      component.selectRole('admin');
      expect(component.loginForm.get('role')?.value).toBe('admin');
    });
  });

  describe('Login Process', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    it('should call auth service login on form submission', () => {
      authService.login.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      expect(authService.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123'
      });
    });

    it('should set loading state during login', () => {
      authService.login.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      expect(component.loading).toBe(true);
    });

    it('should navigate to user dashboard on successful user login', () => {
      const userAuthResponse = TestDataHelper.createMockAuthResponse({
        user: mockUser
      });
      authService.login.and.returnValue(of(userAuthResponse));
      
      component.onSubmit();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(component.loading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should navigate to admin dashboard on successful admin login', () => {
      component.selectRole('admin');
      const adminAuthResponse = TestDataHelper.createMockAuthResponse({
        user: mockAdmin
      });
      authService.login.and.returnValue(of(adminAuthResponse));
      
      component.onSubmit();
      
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
      expect(component.loading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle login errors', () => {
      const errorMessage = 'Invalid credentials';
      authService.login.and.returnValue(throwError(() => new Error(errorMessage)));
      
      component.onSubmit();
      
      expect(component.loading).toBe(false);
      expect(component.errorMessage).toBe(errorMessage);
    });

    it('should not submit invalid form', () => {
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: '123'
      });
      
      component.onSubmit();
      
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should not submit when already loading', () => {
      component.loading = true;
      
      component.onSubmit();
      
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('Form Interaction', () => {
    it('should show email validation errors when touched', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid');
      emailControl?.markAsTouched();
      fixture.detectChanges();
      
      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
    });

    it('should show password validation errors when touched', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123');
      passwordControl?.markAsTouched();
      fixture.detectChanges();
      
      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: ''
      });
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123'
      });
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(false);
    });

    it('should show loading spinner during login', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('.spinner');
      const buttonText = fixture.nativeElement.querySelector('button[type="submit"]').textContent;
      
      expect(spinner).toBeTruthy();
      expect(buttonText.trim()).toContain('Signing in...');
    });
  });

  describe('Demo Credentials', () => {
    it('should populate form with demo user credentials', () => {
      const demoUserButton = fixture.nativeElement.querySelector('.demo-account');
      demoUserButton.click();
      
      expect(component.loginForm.get('email')?.value).toBe('john.doe@example.com');
      expect(component.loginForm.get('password')?.value).toBe('password123');
      expect(component.loginForm.get('role')?.value).toBe('user');
    });

    it('should display demo accounts section', () => {
      const demoSection = fixture.nativeElement.querySelector('.demo-credentials');
      expect(demoSection).toBeTruthy();
      
      const demoAccounts = fixture.nativeElement.querySelectorAll('.demo-account');
      expect(demoAccounts.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when login fails', () => {
      component.errorMessage = 'Invalid credentials';
      fixture.detectChanges();
      
      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement.textContent.trim()).toBe('Invalid credentials');
    });

    it('should clear error message on new form submission', () => {
      component.errorMessage = 'Previous error';
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123'
      });
      
      authService.login.and.returnValue(of(mockAuthResponse));
      component.onSubmit();
      
      expect(component.errorMessage).toBe('');
    });

    it('should handle network errors gracefully', () => {
      authService.login.and.returnValue(throwError(() => new Error('Network error')));
      
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123'
      });
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Network error');
      expect(component.loading).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const emailLabel = fixture.nativeElement.querySelector('label[for="email"]');
      const passwordLabel = fixture.nativeElement.querySelector('label[for="password"]');
      
      expect(emailLabel).toBeTruthy();
      expect(passwordLabel).toBeTruthy();
      expect(emailLabel.textContent.trim()).toContain('Email');
      expect(passwordLabel.textContent.trim()).toContain('Password');
    });

    it('should have proper input associations', () => {
      const emailInput = fixture.nativeElement.querySelector('#email');
      const passwordInput = fixture.nativeElement.querySelector('#password');
      
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
    });

    it('should have submit button with proper text', () => {
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.textContent.trim()).toBe('Login');
    });
  });

  describe('Form Getters', () => {
    it('should return email control', () => {
      expect(component.email).toBe(component.loginForm.get('email'));
    });

    it('should return password control', () => {
      expect(component.password).toBe(component.loginForm.get('password'));
    });

    it('should return role control', () => {
      expect(component.role).toBe(component.loginForm.get('role'));
    });
  });
});