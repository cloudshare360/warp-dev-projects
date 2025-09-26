const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Todo:
 *       type: object
 *       required:
 *         - title
 *         - userId
 *         - listId
 *       properties:
 *         _id:
 *           type: string
 *           description: Todo ID
 *         userId:
 *           type: string
 *           description: ID of the user who owns this todo
 *         listId:
 *           type: string
 *           description: ID of the list this todo belongs to
 *         title:
 *           type: string
 *           description: Title of the todo
 *           minLength: 1
 *           maxLength: 200
 *         description:
 *           type: string
 *           description: Detailed description of the todo
 *           maxLength: 1000
 *         completed:
 *           type: boolean
 *           description: Whether the todo is completed
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Priority level of the todo
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the todo
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the todo was completed
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags associated with the todo
 *         isActive:
 *           type: boolean
 *           description: Whether the todo is active
 *         sortOrder:
 *           type: number
 *           description: Sort order within the list
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Todo creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         _id: "65f3234567890abcdef12345"
 *         userId: "65f1234567890abcdef12345"
 *         listId: "65f2234567890abcdef12345"
 *         title: "Complete quarterly report"
 *         description: "Finish Q4 performance analysis and submit to management"
 *         completed: false
 *         priority: "high"
 *         dueDate: "2024-01-07T00:00:00.000Z"
 *         tags: ["report", "quarterly", "urgent"]
 *         isActive: true
 *         sortOrder: 1
 *         createdAt: "2024-01-01T00:00:00.000Z"
 *         updatedAt: "2024-01-01T00:00:00.000Z"
 */

const todoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: [true, 'List ID is required'],
    index: true
  },
  
  title: {
    type: String,
    required: [true, 'Todo title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high'
    },
    default: 'medium',
    index: true
  },
  
  dueDate: {
    type: Date,
    default: null,
    index: true
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9\s-]+$/, 'Tags can only contain letters, numbers, spaces, and hyphens']
  }],
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours must be positive'],
    max: [1000, 'Estimated hours cannot exceed 1000'],
    default: null
  },
  
  actualHours: {
    type: Number,
    min: [0, 'Actual hours must be positive'],
    max: [1000, 'Actual hours cannot exceed 1000'],
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Virtual for overdue status
todoSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.completed) return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
todoSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for priority weight (for sorting)
todoSchema.virtual('priorityWeight').get(function() {
  const weights = { high: 3, medium: 2, low: 1 };
  return weights[this.priority] || 2;
});

// Virtual for completion duration
todoSchema.virtual('completionDuration').get(function() {
  if (!this.completed || !this.completedAt) return null;
  return this.completedAt.getTime() - this.createdAt.getTime();
});

// Pre-save middleware to set sortOrder and handle completion
todoSchema.pre('save', async function(next) {
  try {
    // Set sortOrder for new todos
    if (this.isNew && this.sortOrder === 0) {
      const lastTodo = await this.constructor
        .findOne({ listId: this.listId, isActive: true })
        .sort({ sortOrder: -1 });
      
      this.sortOrder = lastTodo ? lastTodo.sortOrder + 1 : 1;
    }
    
    // Handle completion status change
    if (this.isModified('completed')) {
      if (this.completed && !this.completedAt) {
        this.completedAt = new Date();
      } else if (!this.completed) {
        this.completedAt = null;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update list counts
todoSchema.post('save', async function() {
  try {
    const List = mongoose.model('List');
    const list = await List.findById(this.listId);
    if (list) {
      await list.updateTodoCounts();
    }
  } catch (error) {
    // Log error but don't fail the todo save
    console.error('Error updating list counts:', error);
  }
});

// Post-remove middleware to update list counts
todoSchema.post('remove', async function() {
  try {
    const List = mongoose.model('List');
    const list = await List.findById(this.listId);
    if (list) {
      await list.updateTodoCounts();
    }
  } catch (error) {
    console.error('Error updating list counts after todo removal:', error);
  }
});

// Method to toggle completion status
todoSchema.methods.toggleCompleted = function() {
  this.completed = !this.completed;
  return this.save();
};

// Method to add tags
todoSchema.methods.addTags = function(newTags) {
  const tagsArray = Array.isArray(newTags) ? newTags : [newTags];
  const uniqueTags = [...new Set([...this.tags, ...tagsArray])];
  this.tags = uniqueTags.slice(0, 10); // Limit to 10 tags
  return this.save();
};

// Method to remove tags
todoSchema.methods.removeTags = function(tagsToRemove) {
  const tagsArray = Array.isArray(tagsToRemove) ? tagsToRemove : [tagsToRemove];
  this.tags = this.tags.filter(tag => !tagsArray.includes(tag));
  return this.save();
};

// Static method to find todos by user
todoSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  // Add optional filters
  if (options.completed !== undefined) {
    query.completed = options.completed;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  if (options.listId) {
    query.listId = options.listId;
  }
  
  if (options.dueDate) {
    if (options.dueDate === 'overdue') {
      query.dueDate = { $lt: new Date() };
      query.completed = false;
    } else if (options.dueDate === 'today') {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (options.dueDate === 'week') {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
      query.dueDate = { $gte: today, $lte: nextWeek };
    }
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  let queryBuilder = this.find(query);
  
  // Add sorting
  if (options.sortBy) {
    const sortOptions = {};
    switch (options.sortBy) {
      case 'priority':
        sortOptions.priority = -1;
        sortOptions.createdAt = -1;
        break;
      case 'dueDate':
        sortOptions.dueDate = 1;
        sortOptions.priority = -1;
        break;
      case 'completed':
        sortOptions.completed = 1;
        sortOptions.completedAt = -1;
        break;
      case 'alphabetical':
        sortOptions.title = 1;
        break;
      default:
        sortOptions.sortOrder = 1;
        sortOptions.createdAt = 1;
    }
    queryBuilder = queryBuilder.sort(sortOptions);
  } else {
    queryBuilder = queryBuilder.sort({ sortOrder: 1, createdAt: 1 });
  }
  
  // Add pagination
  if (options.limit) {
    queryBuilder = queryBuilder.limit(parseInt(options.limit));
  }
  
  if (options.skip) {
    queryBuilder = queryBuilder.skip(parseInt(options.skip));
  }
  
  return queryBuilder.populate('listId', 'name color');
};

// Static method to find todos by list
todoSchema.statics.findByList = function(listId, includeCompleted = true) {
  const query = { listId, isActive: true };
  if (!includeCompleted) {
    query.completed = false;
  }
  
  return this.find(query).sort({ completed: 1, sortOrder: 1, createdAt: 1 });
};

// Static method to get user's todo statistics
todoSchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: null,
          totalTodos: { $sum: 1 },
          completedTodos: { $sum: { $cond: ['$completed', 1, 0] } },
          highPriorityTodos: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          overdueTodos: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $eq: ['$completed', false] },
                    { $ne: ['$dueDate', null] }
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
    
    const result = stats[0] || {
      totalTodos: 0,
      completedTodos: 0,
      highPriorityTodos: 0,
      overdueTodos: 0
    };
    
    result.remainingTodos = result.totalTodos - result.completedTodos;
    result.completionRate = result.totalTodos > 0 ? 
      Math.round((result.completedTodos / result.totalTodos) * 100) : 0;
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Index for compound queries
todoSchema.index({ userId: 1, isActive: 1 });
todoSchema.index({ listId: 1, isActive: 1 });
todoSchema.index({ userId: 1, completed: 1 });
todoSchema.index({ userId: 1, priority: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
todoSchema.index({ tags: 1 });
todoSchema.index({ dueDate: 1, completed: 1 });

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;