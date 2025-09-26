import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { AuthService } from './auth.service';
import { Todo, CreateTodoRequest, UpdateTodoRequest, BulkTodoOperation, TodoFilter, TodoSort } from '../models/todo.model';
import { 
  mockUser, 
  mockTodos, 
  TestDataHelper,
  TEST_CONFIG
} from '../../../testing/test-utils';

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TodoService,
        { provide: AuthService, useValue: authSpy }
      ]
    });
    
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    // Default mock behavior
    authService.getCurrentUser.and.returnValue(mockUser);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Todo Retrieval', () => {
    it('should get todos for current user', () => {
      service.getTodos().subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTodos);
    });

    it('should return empty array when no user is authenticated', () => {
      authService.getCurrentUser.and.returnValue(null);

      service.getTodos().subscribe(todos => {
        expect(todos).toEqual([]);
      });

      // No HTTP request should be made
      httpMock.expectNone(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}`);
    });

    it('should get todos without pagination', () => {
      service.getTodos().subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTodos);
    });

    it('should get todos with filters', () => {
      const filter: TodoFilter = {
        status: ['pending'],
        priority: ['high'],
        isImportant: true
      };

      service.getTodos(filter).subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(`userId=${mockUser.id}`) &&
               request.url.includes('status=pending') &&
               request.url.includes('priority=high') &&
               request.url.includes('isImportant=true');
      });
      req.flush(mockTodos);
    });

    it('should get todos with sorting', () => {
      const sort: TodoSort = {
        field: 'dueDate',
        direction: 'desc'
      };

      service.getTodos(undefined, sort).subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne(
        `${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}&_sort=dueDate&_order=desc`
      );
      req.flush(mockTodos);
    });

    it('should get single todo by id', () => {
      const todoId = '1';
      const expectedTodo = mockTodos[0];

      service.getTodo(todoId).subscribe(todo => {
        expect(todo).toEqual(expectedTodo);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos/${todoId}`);
      expect(req.request.method).toBe('GET');
      req.flush(expectedTodo);
    });
  });

  describe('Todo Creation', () => {
    it('should create a new todo', () => {
      const createRequest: CreateTodoRequest = {
        title: 'New Todo',
        description: 'Description of new todo',
        priority: 'medium',
        category: 'work',
        dueDate: '2024-12-31T23:59:59.000Z'
      };

      const createdTodo = TestDataHelper.createMockTodo({
        title: createRequest.title,
        description: createRequest.description,
        priority: createRequest.priority
      });

      service.createTodo(createRequest).subscribe(todo => {
        expect(todo.title).toBe(createRequest.title!);
        expect(todo.description).toBe(createRequest.description!);
        expect(todo.userId).toBe(mockUser.id);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.title).toBe(createRequest.title);
      expect(req.request.body.userId).toBe(mockUser.id);
      req.flush(createdTodo);
    });

    it('should throw error when creating todo without authenticated user', () => {
      authService.getCurrentUser.and.returnValue(null);

      const createRequest: CreateTodoRequest = {
        title: 'New Todo'
      };

      expect(() => service.createTodo(createRequest)).toThrowError('User must be authenticated');
    });

    it('should create todo with default values', () => {
      const createRequest: CreateTodoRequest = {
        title: 'Simple Todo'
      };

      service.createTodo(createRequest).subscribe();

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos`);
      const requestBody = req.request.body;
      
      expect(requestBody.title).toBe('Simple Todo');
      expect(requestBody.description).toBe('');
      expect(requestBody.category).toBe('general');
      expect(requestBody.priority).toBe('medium');
      expect(requestBody.status).toBe('pending');
      expect(requestBody.progress).toBe(0);
      expect(requestBody.isImportant).toBe(false);
      expect(requestBody.isArchived).toBe(false);
      
      req.flush(TestDataHelper.createMockTodo({ title: createRequest.title }));
    });
  });

  describe('Todo Updates', () => {
    it('should update existing todo', () => {
      const todoId = '1';
      const updateRequest: UpdateTodoRequest = {
        title: 'Updated Todo',
        status: 'completed',
        progress: 100
      };

      const updatedTodo = TestDataHelper.createMockTodo({
        id: todoId,
        title: updateRequest.title,
        status: updateRequest.status,
        progress: updateRequest.progress
      });

      service.updateTodo(todoId, updateRequest).subscribe(todo => {
        expect(todo.title).toBe(updateRequest.title!);
        expect(todo.status).toBe(updateRequest.status!);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos/${todoId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.title).toBe(updateRequest.title);
      expect(req.request.body.updatedAt).toBeDefined();
      req.flush(updatedTodo);
    });

    it('should delete todo', () => {
      const todoId = '1';

      service.deleteTodo(todoId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos/${todoId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Bulk Operations', () => {
    it('should perform bulk complete operation', (done) => {
      const operation: BulkTodoOperation = {
        todoIds: ['1', '2'],
        operation: 'complete'
      };

      service.bulkOperation(operation).subscribe(results => {
        expect(results.length).toBe(2);
        done();
      });

      // Expect two PATCH requests for completion
      const req1 = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos/1`);
      const req2 = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos/2`);

      expect(req1.request.method).toBe('PATCH');
      expect(req2.request.method).toBe('PATCH');
      expect(req1.request.body.status).toBe('completed');
      expect(req2.request.body.status).toBe('completed');

      req1.flush(mockTodos[0]);
      req2.flush(mockTodos[1]);
    });

    it('should perform bulk delete operation', (done) => {
      const operation: BulkTodoOperation = {
        todoIds: ['1', '2'],
        operation: 'delete'
      };

      service.bulkOperation(operation).subscribe(results => {
        expect(results.length).toBe(2);
        done();
      });

      // Expect two DELETE requests
      const req1 = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos/1`);
      const req2 = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos/2`);

      expect(req1.request.method).toBe('DELETE');
      expect(req2.request.method).toBe('DELETE');

      req1.flush(null);
      req2.flush(null);
    });

    it('should handle bulk operation errors', (done) => {
      const operation: BulkTodoOperation = {
        todoIds: ['1'],
        operation: 'complete'
      };

      service.bulkOperation(operation).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos/1`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Todo Search and Filtering', () => {
    it('should search todos by query', () => {
      const query = 'project';

      service.searchTodos(query).subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?q=${query}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTodos);
    });

    it('should get todos by category', () => {
      const category = 'work';

      service.getTodosByCategory(category).subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}&category=${category}`);
      req.flush(mockTodos);
    });

    it('should get important todos', () => {
      service.getImportantTodos().subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}&isImportant=true`);
      req.flush(mockTodos);
    });

    it('should get completed todos', () => {
      service.getCompletedTodos().subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}&status=completed`);
      req.flush(mockTodos);
    });

    it('should get archived todos', () => {
      service.getArchivedTodos().subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}&isArchived=true`);
      req.flush(mockTodos);
    });

    it('should return empty array for category search when no user authenticated', () => {
      authService.getCurrentUser.and.returnValue(null);

      service.getTodosByCategory('work').subscribe(todos => {
        expect(todos).toEqual([]);
      });

      // No HTTP request should be made
      httpMock.expectNone(`${TEST_CONFIG.API_URL}/todos`);
    });
  });

  describe('Todo Statistics', () => {
    it('should calculate todo statistics', () => {
      const statsData = [
        TestDataHelper.createMockTodo({ status: 'pending' }),
        TestDataHelper.createMockTodo({ status: 'completed' }),
        TestDataHelper.createMockTodo({ 
          status: 'pending',
          isImportant: true,
          dueDate: new Date(Date.now() - 86400000).toISOString() // Yesterday
        })
      ];

      service.getTodoStats().subscribe(stats => {
        expect(stats.total).toBe(3);
        expect(stats.pending).toBe(2);
        expect(stats.completed).toBe(1);
        expect(stats.overdue).toBe(1);
        expect(stats.important).toBe(1);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}`);
      req.flush(statsData);
    });

    it('should get overdue todos', () => {
      const overdueData = [
        TestDataHelper.createMockTodo({ 
          dueDate: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending'
        })
      ];

      service.getOverdueTodos().subscribe(todos => {
        expect(todos.length).toBe(1);
      });

      const req = httpMock.expectOne(`${TEST_CONFIG.API_URL}/todos?userId=${mockUser.id}`);
      req.flush([
        overdueData[0],
        TestDataHelper.createMockTodo({ 
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending' 
        }), // Future due date
        TestDataHelper.createMockTodo({ 
          dueDate: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed' 
        }) // Overdue but completed
      ]);
    });

    it('should return empty stats when no user authenticated', () => {
      authService.getCurrentUser.and.returnValue(null);

      service.getTodoStats().subscribe(stats => {
        expect(stats).toEqual({});
      });

      // No HTTP request should be made
      httpMock.expectNone(`${TEST_CONFIG.API_URL}/todos`);
    });
  });

  describe('Utility Methods', () => {
    it('should generate unique IDs', () => {
      const id1 = (service as any).generateId();
      const id2 = (service as any).generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });
});