const Todo = require('../models/Todo');
const List = require('../models/List');
const { catchAsync, AppError } = require('../middleware');
const logger = require('../utils/logger');

/**
 * Get all todos for authenticated user with filtering and pagination
 * @route GET /api/todos
 * @access Private
 */
const getTodos = catchAsync(async (req, res, next) => {
  const { 
    listId, 
    search, 
    priority, 
    isCompleted, 
    tag, 
    dueDateFrom, 
    dueDateTo, 
    sortBy = 'createdAt', 
    sort = 'desc', 
    page = 1, 
    limit = 10 
  } = req.query;

  // Build query
  let query = { userId: req.user.userId };

  // Filter by list
  if (listId) {
    // Verify user owns the list
    const list = await List.findOne({ _id: listId, userId: req.user.userId });
    if (!list) {
      return next(new AppError('List not found', 404));
    }
    query.listId = listId;
  }

  // Add search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Filter by priority
  if (priority) {
    query.priority = priority;
  }

  // Filter by completion status
  if (isCompleted !== undefined) {
    query.isCompleted = isCompleted === 'true';
  }

  // Filter by tag
  if (tag) {
    query.tags = { $in: [tag] };
  }

  // Filter by due date range
  if (dueDateFrom || dueDateTo) {
    query.dueDate = {};
    if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
    if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = sort === 'desc' ? -1 : 1;

  // Execute query
  const todos = await Todo.find(query)
    .populate('listId', 'name color')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await Todo.countDocuments(query);

  logger.info('Todos retrieved', {
    userId: req.user.userId,
    count: todos.length,
    total,
    filters: { listId, search, priority, isCompleted, tag },
    page,
    limit
  });

  res.status(200).json({
    success: true,
    message: 'Todos retrieved successfully',
    data: {
      todos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * Get a specific todo by ID
 * @route GET /api/todos/:id
 * @access Private
 */
const getTodoById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const todo = await Todo.findOne({ 
    _id: id, 
    userId: req.user.userId 
  }).populate('listId', 'name color description');

  if (!todo) {
    return next(new AppError('Todo not found', 404));
  }

  logger.info('Todo retrieved by ID', {
    todoId: todo._id,
    userId: req.user.userId,
    title: todo.title
  });

  res.status(200).json({
    success: true,
    message: 'Todo retrieved successfully',
    data: {
      todo
    }
  });
});

/**
 * Create a new todo
 * @route POST /api/todos
 * @access Private
 */
const createTodo = catchAsync(async (req, res, next) => {
  const { listId, title, description, priority = 'medium', dueDate, tags = [], estimatedTime } = req.body;

  // Verify user owns the list
  const list = await List.findOne({ _id: listId, userId: req.user.userId });
  if (!list) {
    return next(new AppError('List not found', 404));
  }

  // Get the next order number for this list
  const lastTodo = await Todo.findOne({ listId }).sort({ order: -1 });
  const order = lastTodo ? lastTodo.order + 1 : 0;

  const todo = await Todo.create({
    title,
    description,
    priority,
    dueDate,
    tags,
    estimatedTime,
    listId,
    userId: req.user.userId,
    order
  });

  // Populate the created todo
  await todo.populate('listId', 'name color');

  logger.info('Todo created', {
    todoId: todo._id,
    userId: req.user.userId,
    listId: list._id,
    title: todo.title,
    priority: todo.priority
  });

  res.status(201).json({
    success: true,
    message: 'Todo created successfully',
    data: {
      todo
    }
  });
});

/**
 * Update a todo
 * @route PUT /api/todos/:id
 * @access Private
 */
const updateTodo = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, priority, dueDate, tags, estimatedTime, isCompleted } = req.body;

  const todo = await Todo.findOne({ _id: id, userId: req.user.userId });

  if (!todo) {
    return next(new AppError('Todo not found', 404));
  }

  // Store original completion status for logging
  const wasCompleted = todo.isCompleted;

  // Update fields
  if (title !== undefined) todo.title = title;
  if (description !== undefined) todo.description = description;
  if (priority !== undefined) todo.priority = priority;
  if (dueDate !== undefined) todo.dueDate = dueDate;
  if (tags !== undefined) todo.tags = tags;
  if (estimatedTime !== undefined) todo.estimatedTime = estimatedTime;
  if (isCompleted !== undefined) {
    todo.isCompleted = isCompleted;
    if (isCompleted && !wasCompleted) {
      todo.completedAt = new Date();
    } else if (!isCompleted && wasCompleted) {
      todo.completedAt = undefined;
    }
  }

  await todo.save();

  // Populate the updated todo
  await todo.populate('listId', 'name color');

  logger.info('Todo updated', {
    todoId: todo._id,
    userId: req.user.userId,
    updatedFields: Object.keys(req.body),
    statusChanged: wasCompleted !== todo.isCompleted
  });

  res.status(200).json({
    success: true,
    message: 'Todo updated successfully',
    data: {
      todo
    }
  });
});

/**
 * Delete a todo
 * @route DELETE /api/todos/:id
 * @access Private
 */
const deleteTodo = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const todo = await Todo.findOne({ _id: id, userId: req.user.userId });

  if (!todo) {
    return next(new AppError('Todo not found', 404));
  }

  await Todo.findByIdAndDelete(id);

  logger.info('Todo deleted', {
    todoId: id,
    userId: req.user.userId,
    title: todo.title,
    listId: todo.listId
  });

  res.status(200).json({
    success: true,
    message: 'Todo deleted successfully'
  });
});

/**
 * Toggle todo completion status
 * @route PATCH /api/todos/:id/toggle
 * @access Private
 */
const toggleTodoCompletion = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isCompleted } = req.body;

  const todo = await Todo.findOne({ _id: id, userId: req.user.userId });

  if (!todo) {
    return next(new AppError('Todo not found', 404));
  }

  const previousStatus = todo.isCompleted;
  todo.isCompleted = isCompleted;

  if (isCompleted && !previousStatus) {
    todo.completedAt = new Date();
  } else if (!isCompleted && previousStatus) {
    todo.completedAt = undefined;
  }

  await todo.save();

  // Populate the updated todo
  await todo.populate('listId', 'name color');

  const action = isCompleted ? 'completed' : 'uncompleted';

  logger.info(`Todo ${action}`, {
    todoId: todo._id,
    userId: req.user.userId,
    title: todo.title,
    completedAt: todo.completedAt
  });

  res.status(200).json({
    success: true,
    message: `Todo ${action} successfully`,
    data: {
      todo
    }
  });
});

/**
 * Reorder todo within list
 * @route PUT /api/todos/:id/reorder
 * @access Private
 */
const reorderTodo = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { newOrder } = req.body;

  const todo = await Todo.findOne({ _id: id, userId: req.user.userId });

  if (!todo) {
    return next(new AppError('Todo not found', 404));
  }

  const oldOrder = todo.order;

  // Update orders of other todos in the same list
  if (newOrder > oldOrder) {
    // Moving down: decrease order of todos between old and new position
    await Todo.updateMany(
      {
        listId: todo.listId,
        order: { $gt: oldOrder, $lte: newOrder },
        _id: { $ne: todo._id }
      },
      { $inc: { order: -1 } }
    );
  } else if (newOrder < oldOrder) {
    // Moving up: increase order of todos between new and old position
    await Todo.updateMany(
      {
        listId: todo.listId,
        order: { $gte: newOrder, $lt: oldOrder },
        _id: { $ne: todo._id }
      },
      { $inc: { order: 1 } }
    );
  }

  // Update the todo's order
  todo.order = newOrder;
  await todo.save();

  logger.info('Todo reordered', {
    todoId: todo._id,
    userId: req.user.userId,
    oldOrder,
    newOrder,
    title: todo.title
  });

  res.status(200).json({
    success: true,
    message: 'Todo reordered successfully',
    data: {
      todo: {
        id: todo._id,
        title: todo.title,
        order: todo.order
      }
    }
  });
});

/**
 * Get todos by list ID
 * @route GET /api/lists/:listId/todos
 * @access Private
 */
const getTodosByList = catchAsync(async (req, res, next) => {
  const { listId } = req.params;
  const { 
    search, 
    priority, 
    isCompleted, 
    sortBy = 'order', 
    sort = 'asc', 
    page = 1, 
    limit = 50 
  } = req.query;

  // Verify user owns the list
  const list = await List.findOne({ _id: listId, userId: req.user.userId });
  if (!list) {
    return next(new AppError('List not found', 404));
  }

  // Build query
  let query = { listId, userId: req.user.userId };

  // Add filters
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  if (priority) {
    query.priority = priority;
  }

  if (isCompleted !== undefined) {
    query.isCompleted = isCompleted === 'true';
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = sort === 'desc' ? -1 : 1;

  // Execute query
  const todos = await Todo.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await Todo.countDocuments(query);

  logger.info('Todos retrieved by list', {
    listId,
    userId: req.user.userId,
    count: todos.length,
    total
  });

  res.status(200).json({
    success: true,
    message: 'Todos retrieved successfully',
    data: {
      list: {
        id: list._id,
        name: list.name,
        description: list.description,
        color: list.color
      },
      todos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * Get todo statistics for user
 * @route GET /api/todos/stats
 * @access Private
 */
const getTodoStats = catchAsync(async (req, res, next) => {
  const stats = await Todo.aggregate([
    { $match: { userId: req.user.userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        pending: { $sum: { $cond: ['$isCompleted', 0, 1] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', new Date()] },
                  { $eq: ['$isCompleted', false] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalEstimatedTime: { $sum: '$estimatedTime' },
        avgEstimatedTime: { $avg: '$estimatedTime' }
      }
    }
  ]);

  const userStats = stats.length > 0 ? stats[0] : {
    total: 0,
    completed: 0,
    pending: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    overdue: 0,
    totalEstimatedTime: 0,
    avgEstimatedTime: 0
  };

  // Calculate completion percentage
  const completionPercentage = userStats.total > 0 
    ? Math.round((userStats.completed / userStats.total) * 100) 
    : 0;

  // Get recent activity (completed todos in last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentlyCompleted = await Todo.countDocuments({
    userId: req.user.userId,
    isCompleted: true,
    completedAt: { $gte: weekAgo }
  });

  res.status(200).json({
    success: true,
    message: 'Todo statistics retrieved successfully',
    data: {
      stats: {
        ...userStats,
        _id: undefined,
        completionPercentage,
        recentlyCompleted,
        avgEstimatedTime: Math.round(userStats.avgEstimatedTime || 0)
      }
    }
  });
});

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoCompletion,
  reorderTodo,
  getTodosByList,
  getTodoStats
};