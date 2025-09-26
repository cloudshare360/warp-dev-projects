export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  todoCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
}