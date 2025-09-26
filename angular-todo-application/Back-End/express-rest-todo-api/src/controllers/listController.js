const List = require('../models/List');
const Todo = require('../models/Todo');
const { catchAsync, AppError } = require('../middleware');
const logger = require('../utils/logger');

/**
 * Get all lists for authenticated user
 * @route GET /api/lists
 * @access Private
 */
const getLists = catchAsync(async (req, res, next) => {
  const { search, isPublic, sortBy = 'updatedAt', sort = 'desc', page = 1, limit = 10 } = req.query;

  // Build query
  let query = { userId: req.user.userId };

  // Add search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Add public filter
  if (isPublic !== undefined) {
    query.isPublic = isPublic === 'true';
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = sort === 'desc' ? -1 : 1;

  // Execute query with population of todo count
  const lists = await List.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('todoCount')
    .populate('completedTodoCount');

  // Get total count for pagination
  const total = await List.countDocuments(query);

  logger.info('Lists retrieved', {
    userId: req.user.userId,
    count: lists.length,
    total,
    page,
    limit
  });

  res.status(200).json({
    success: true,
    message: 'Lists retrieved successfully',
    data: {
      lists,
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
 * Get a specific list by ID
 * @route GET /api/lists/:id
 * @access Private
 */
const getListById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const list = await List.findOne({ 
    _id: id, 
    userId: req.user.userId 
  })
  .populate('todoCount')
  .populate('completedTodoCount');

  if (!list) {
    return next(new AppError('List not found', 404));
  }

  logger.info('List retrieved by ID', {
    listId: list._id,
    userId: req.user.userId,
    listName: list.name
  });

  res.status(200).json({
    success: true,
    message: 'List retrieved successfully',
    data: {
      list
    }
  });
});

/**
 * Create a new list
 * @route POST /api/lists
 * @access Private
 */
const createList = catchAsync(async (req, res, next) => {
  const { name, description, color, isPublic = false } = req.body;

  // Check if user already has a list with the same name
  const existingList = await List.findOne({
    userId: req.user.userId,
    name: { $regex: `^${name}$`, $options: 'i' }
  });

  if (existingList) {
    return next(new AppError('You already have a list with this name', 400));
  }

  const list = await List.create({
    name,
    description,
    color,
    isPublic,
    userId: req.user.userId
  });

  logger.info('List created', {
    listId: list._id,
    userId: req.user.userId,
    listName: list.name,
    isPublic
  });

  res.status(201).json({
    success: true,
    message: 'List created successfully',
    data: {
      list
    }
  });
});

/**
 * Update a list
 * @route PUT /api/lists/:id
 * @access Private
 */
const updateList = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, color, isPublic } = req.body;

  const list = await List.findOne({ _id: id, userId: req.user.userId });

  if (!list) {
    return next(new AppError('List not found', 404));
  }

  // If name is being updated, check for duplicates
  if (name && name !== list.name) {
    const existingList = await List.findOne({
      userId: req.user.userId,
      name: { $regex: `^${name}$`, $options: 'i' },
      _id: { $ne: id }
    });

    if (existingList) {
      return next(new AppError('You already have a list with this name', 400));
    }
  }

  // Update fields
  if (name !== undefined) list.name = name;
  if (description !== undefined) list.description = description;
  if (color !== undefined) list.color = color;
  if (isPublic !== undefined) list.isPublic = isPublic;

  await list.save();

  logger.info('List updated', {
    listId: list._id,
    userId: req.user.userId,
    updatedFields: Object.keys(req.body)
  });

  res.status(200).json({
    success: true,
    message: 'List updated successfully',
    data: {
      list
    }
  });
});

/**
 * Delete a list
 * @route DELETE /api/lists/:id
 * @access Private
 */
const deleteList = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const list = await List.findOne({ _id: id, userId: req.user.userId });

  if (!list) {
    return next(new AppError('List not found', 404));
  }

  // Get todo count before deletion
  const todoCount = await Todo.countDocuments({ listId: id });

  // Delete all todos in this list
  await Todo.deleteMany({ listId: id });

  // Delete the list
  await List.findByIdAndDelete(id);

  logger.info('List deleted', {
    listId: id,
    userId: req.user.userId,
    listName: list.name,
    deletedTodos: todoCount
  });

  res.status(200).json({
    success: true,
    message: 'List and all associated todos deleted successfully',
    data: {
      deletedTodos: todoCount
    }
  });
});

/**
 * Get list statistics
 * @route GET /api/lists/:id/stats
 * @access Private
 */
const getListStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const list = await List.findOne({ _id: id, userId: req.user.userId });

  if (!list) {
    return next(new AppError('List not found', 404));
  }

  // Aggregate todo statistics
  const stats = await Todo.aggregate([
    { $match: { listId: list._id } },
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
        }
      }
    }
  ]);

  const listStats = stats.length > 0 ? stats[0] : {
    total: 0,
    completed: 0,
    pending: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    overdue: 0
  };

  // Calculate completion percentage
  const completionPercentage = listStats.total > 0 
    ? Math.round((listStats.completed / listStats.total) * 100) 
    : 0;

  res.status(200).json({
    success: true,
    message: 'List statistics retrieved successfully',
    data: {
      list: {
        id: list._id,
        name: list.name,
        description: list.description
      },
      stats: {
        ...listStats,
        _id: undefined,
        completionPercentage
      }
    }
  });
});

/**
 * Duplicate a list
 * @route POST /api/lists/:id/duplicate
 * @access Private
 */
const duplicateList = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const originalList = await List.findOne({ _id: id, userId: req.user.userId });

  if (!originalList) {
    return next(new AppError('List not found', 404));
  }

  // Generate new name if not provided
  const newName = name || `${originalList.name} (Copy)`;

  // Check if name already exists
  const existingList = await List.findOne({
    userId: req.user.userId,
    name: { $regex: `^${newName}$`, $options: 'i' }
  });

  if (existingList) {
    return next(new AppError('A list with this name already exists', 400));
  }

  // Create duplicate list
  const duplicatedList = await List.create({
    name: newName,
    description: originalList.description,
    color: originalList.color,
    isPublic: false, // Duplicated lists are private by default
    userId: req.user.userId
  });

  // Get all todos from original list
  const originalTodos = await Todo.find({ listId: id });

  // Create duplicated todos
  if (originalTodos.length > 0) {
    const duplicatedTodos = originalTodos.map(todo => ({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      dueDate: todo.dueDate,
      tags: [...todo.tags],
      estimatedTime: todo.estimatedTime,
      listId: duplicatedList._id,
      userId: req.user.userId,
      isCompleted: false, // Reset completion status
      order: todo.order
    }));

    await Todo.insertMany(duplicatedTodos);
  }

  logger.info('List duplicated', {
    originalListId: id,
    duplicatedListId: duplicatedList._id,
    userId: req.user.userId,
    todosCount: originalTodos.length
  });

  // Populate the duplicated list with counts
  const populatedList = await List.findById(duplicatedList._id)
    .populate('todoCount')
    .populate('completedTodoCount');

  res.status(201).json({
    success: true,
    message: 'List duplicated successfully',
    data: {
      list: populatedList,
      duplicatedTodos: originalTodos.length
    }
  });
});

/**
 * Share/Unshare a list (toggle public status)
 * @route PATCH /api/lists/:id/share
 * @access Private
 */
const toggleListSharing = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const list = await List.findOne({ _id: id, userId: req.user.userId });

  if (!list) {
    return next(new AppError('List not found', 404));
  }

  // Toggle public status
  list.isPublic = !list.isPublic;
  await list.save();

  const action = list.isPublic ? 'shared' : 'unshared';

  logger.info(`List ${action}`, {
    listId: list._id,
    userId: req.user.userId,
    isPublic: list.isPublic
  });

  res.status(200).json({
    success: true,
    message: `List ${action} successfully`,
    data: {
      list: {
        id: list._id,
        name: list.name,
        isPublic: list.isPublic
      }
    }
  });
});

module.exports = {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  getListStats,
  duplicateList,
  toggleListSharing
};