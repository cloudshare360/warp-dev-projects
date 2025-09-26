export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold';
  progress: number; // 0-100
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  attachments: Attachment[];
  subtasks: Subtask[];
  reminders: Reminder[];
  isImportant: boolean;
  isArchived: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  url: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  type: 'email' | 'push';
  timing: string; // "15min|30min|1hour|1day"
  sent: boolean;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  tags?: string[];
  subtasks?: Omit<Subtask, 'id' | 'createdAt'>[];
  reminders?: Omit<Reminder, 'id' | 'sent'>[];
  isImportant?: boolean;
}

export interface UpdateTodoRequest extends Partial<CreateTodoRequest> {
  status?: 'pending' | 'in-progress' | 'completed' | 'on-hold';
  progress?: number;
  isArchived?: boolean;
}

export interface BulkTodoOperation {
  todoIds: string[];
  operation: 'complete' | 'delete' | 'archive' | 'change_category' | 'change_priority';
  value?: any; // For operations like change_category, change_priority
}

export interface TodoFilter {
  status?: string[];
  priority?: string[];
  category?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  isImportant?: boolean;
  isArchived?: boolean;
  userId?: string;
}

export interface TodoSort {
  field: 'dueDate' | 'priority' | 'createdAt' | 'title' | 'progress';
  direction: 'asc' | 'desc';
}