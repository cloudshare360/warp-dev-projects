import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { 
  mockUser, 
  mockAdmin, 
  mockAuthResponse, 
  TestDataHelper,
  MockLocalStorage,
  TEST_CONFIG
} from '../../../testing/test-utils';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockLocalStorage: MockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = new MockLocalStorage();
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => mockLocalStorage.getItem(key));
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => mockLocalStorage.setItem(key, value));
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => mockLocalStorage.removeItem(key));
  });

  afterEach(() => {
    httpMock.verify();
    mockLocalStorage.clear();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with no current user when localStorage is empty', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should initialize with user data from localStorage', () => {
      mockLocalStorage.setItem('token', 'mock-token');
      mockLocalStorage.setItem('currentUser', JSON.stringify(mockUser));
      mockLocalStorage.setItem('tokenExpiration', new Date(Date.now() + 3600000).toISOString());

      // Recreate service to test initialization
      service = TestBed.inject(AuthService);
      
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should clear invalid localStorage data during initialization', () => {
      mockLocalStorage.setItem('token', 'mock-token');
      mockLocalStorage.setItem('currentUser', 'invalid-json');
      
      spyOn(service, 'logout');
      
      // Recreate service to test initialization
      service = TestBed.inject(AuthService);
      
      expect(service.logout).toHaveBeenCalled();
    });
  });

  describe('Authentication', () => {
    it('should login successfully with valid credentials', () => {
      const loginRequest: LoginRequest = {
        email: 'john.doe@example.com',
        password: 'password123'
      };

      service.login(loginRequest).subscribe(response => {
        expect(response.user).toEqual(mockUser);
        expect(response.token).toBeTruthy();
        expect(response.expiresIn).toBe(3600);
        expect(service.getCurrentUser()).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/users?email=${loginRequest.email}`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });

    it('should handle login with no matching user', () => {
      const loginRequest: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      service.login(loginRequest).subscribe({
        next: () => fail('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Invalid credentials');
        }
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/users?email=${loginRequest.email}`);
      req.flush([]);
    });

    it('should register a new user successfully', () => {
      const registerRequest: RegisterRequest = {
        email: 'newuser@example.com',
        fullName: 'New User',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'user'
      };

      const newUser = TestDataHelper.createMockUser({
        email: registerRequest.email,
        fullName: registerRequest.fullName,
        role: registerRequest.role
      });

      service.register(registerRequest).subscribe(response => {
        expect(response.email).toBe(registerRequest.email);
        expect(response.fullName).toBe(registerRequest.fullName);
        expect(response.role).toBe(registerRequest.role);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.email).toBe(registerRequest.email);
      req.flush(newUser);
    });

    it('should logout and clear session data', () => {
      // Set up some session data
      mockLocalStorage.setItem('token', 'mock-token');
      mockLocalStorage.setItem('currentUser', JSON.stringify(mockUser));
      mockLocalStorage.setItem('tokenExpiration', new Date().toISOString());

      service.logout();

      expect(mockLocalStorage.getItem('token')).toBeNull();
      expect(mockLocalStorage.getItem('currentUser')).toBeNull();
      expect(mockLocalStorage.getItem('tokenExpiration')).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('Authentication State', () => {
    it('should return true when authenticated with valid token', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      mockLocalStorage.setItem('token', 'valid-token');
      mockLocalStorage.setItem('tokenExpiration', futureDate);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      mockLocalStorage.setItem('token', 'expired-token');
      mockLocalStorage.setItem('tokenExpiration', pastDate);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return the stored token', () => {
      const token = 'test-token';
      mockLocalStorage.setItem('token', token);
      
      expect(service.getToken()).toBe(token);
    });

    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('User Roles', () => {
    it('should identify admin user correctly', () => {
      spyOn(service, 'getCurrentUser').and.returnValue(mockAdmin);
      expect(service.isAdmin()).toBe(true);
      expect(service.isUser()).toBe(false);
    });

    it('should identify regular user correctly', () => {
      spyOn(service, 'getCurrentUser').and.returnValue(mockUser);
      expect(service.isAdmin()).toBe(false);
      expect(service.isUser()).toBe(true);
    });

    it('should return false for roles when no user is logged in', () => {
      spyOn(service, 'getCurrentUser').and.returnValue(null);
      expect(service.isAdmin()).toBe(false);
      expect(service.isUser()).toBe(false);
    });
  });

  describe('Password Reset', () => {
    it('should send forgot password request', () => {
      const request = { email: 'john.doe@example.com' };

      service.forgotPassword(request).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/auth/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ message: 'Password reset email sent' });
    });

    it('should reset password with token', () => {
      const request = { 
        token: 'reset-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      service.resetPassword(request).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/auth/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ message: 'Password reset successful' });
    });
  });

  describe('Session Management', () => {
    it('should set session data correctly', () => {
      const authResponse = TestDataHelper.createMockAuthResponse();
      
      service.login({ email: mockUser.email, password: 'password123' }).subscribe();
      
      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/users?email=${mockUser.email}`);
      req.flush([mockUser]);

      expect(mockLocalStorage.getItem('token')).toBeTruthy();
      expect(mockLocalStorage.getItem('currentUser')).toBe(JSON.stringify(mockUser));
      expect(mockLocalStorage.getItem('tokenExpiration')).toBeTruthy();
    });

    it('should generate valid token', () => {
      service.login({ email: mockUser.email, password: 'password123' }).subscribe(response => {
        const token = response.token;
        expect(token).toBeTruthy();
        
        // Token should be base64 encoded JSON
        const decodedToken = JSON.parse(atob(token));
        expect(decodedToken.userId).toBe(mockUser.id);
        expect(decodedToken.email).toBe(mockUser.email);
        expect(decodedToken.role).toBe(mockUser.role);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/users?email=${mockUser.email}`);
      req.flush([mockUser]);
    });
  });

  describe('Observable Streams', () => {
    it('should emit current user changes', (done) => {
      let emissionCount = 0;
      
      service.currentUser$.subscribe(user => {
        if (emissionCount === 0) {
          expect(user).toBeNull();
          emissionCount++;
        } else {
          expect(user).toEqual(mockUser);
          done();
        }
      });

      service.login({ email: mockUser.email, password: 'password123' }).subscribe();
      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/users?email=${mockUser.email}`);
      req.flush([mockUser]);
    });

    it('should emit null when user logs out', (done) => {
      // First set a user
      service.login({ email: mockUser.email, password: 'password123' }).subscribe(() => {
        // Then logout
        service.logout();
      });

      let emissionCount = 0;
      service.currentUser$.subscribe(user => {
        if (emissionCount === 0) {
          expect(user).toBeNull(); // Initial state
        } else if (emissionCount === 1) {
          expect(user).toEqual(mockUser); // After login
        } else {
          expect(user).toBeNull(); // After logout
          done();
        }
        emissionCount++;
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/users?email=${mockUser.email}`);
      req.flush([mockUser]);
    });
  });
});