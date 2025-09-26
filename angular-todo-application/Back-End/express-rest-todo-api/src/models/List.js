const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     List:
 *       type: object
 *       required:
 *         - name
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           description: List ID
 *         userId:
 *           type: string
 *           description: ID of the user who owns this list
 *         name:
 *           type: string
 *           description: Name of the list
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *           description: Description of the list
 *           maxLength: 500
 *         color:
 *           type: string
 *           description: Hex color code for the list
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *         isActive:
 *           type: boolean
 *           description: Whether the list is active
 *         sortOrder:
 *           type: number
 *           description: Sort order for displaying lists
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: List creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         _id: "65f2234567890abcdef12345"
 *         userId: "65f1234567890abcdef12345"
 *         name: "Work Tasks"
 *         description: "Professional work-related tasks"
 *         color: "#1976d2"
 *         isActive: true
 *         sortOrder: 1
 *         createdAt: "2024-01-01T00:00:00.000Z"
 *         updatedAt: "2024-01-01T00:00:00.000Z"
 */

const listSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'List name is required'],
    trim: true,
    minlength: [1, 'List name must be at least 1 character long'],
    maxlength: [100, 'List name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  
  color: {
    type: String,
    default: '#1976d2',
    validate: {
      validator: function(v) {
        return /^#[0-9A-Fa-f]{6}$/.test(v);
      },
      message: 'Color must be a valid hex color code (e.g., #1976d2)'
    }
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  todoCount: {
    type: Number,
    default: 0
  },
  
  completedTodoCount: {
    type: Number,
    default: 0
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

// Virtual for completion percentage
listSchema.virtual('completionPercentage').get(function() {
  if (this.todoCount === 0) return 0;
  return Math.round((this.completedTodoCount / this.todoCount) * 100);
});

// Virtual for remaining todos count
listSchema.virtual('remainingTodoCount').get(function() {
  return this.todoCount - this.completedTodoCount;
});

// Pre-save middleware to set sortOrder
listSchema.pre('save', async function(next) {
  if (this.isNew && this.sortOrder === 0) {
    try {
      const lastList = await this.constructor
        .findOne({ userId: this.userId, isActive: true })
        .sort({ sortOrder: -1 });
      
      this.sortOrder = lastList ? lastList.sortOrder + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to update todo counts
listSchema.methods.updateTodoCounts = async function() {
  const Todo = mongoose.model('Todo');
  
  try {
    const stats = await Todo.aggregate([
      { $match: { listId: this._id, isActive: true } },
      {
        $group: {
          _id: null,
          totalTodos: { $sum: 1 },
          completedTodos: {
            $sum: { $cond: ['$completed', 1, 0] }
          }
        }
      }
    ]);
    
    const result = stats[0] || { totalTodos: 0, completedTodos: 0 };
    
    this.todoCount = result.totalTodos;
    this.completedTodoCount = result.completedTodos;
    
    return this.save();
  } catch (error) {
    throw error;
  }
};

// Static method to find lists by user
listSchema.statics.findByUser = function(userId, includeInactive = false) {
  const query = { userId };
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ sortOrder: 1, createdAt: 1 });
};

// Static method to find list by user and name
listSchema.statics.findByUserAndName = function(userId, name) {
  return this.findOne({
    userId,
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    isActive: true
  });
};

// Static method to get user's list statistics
listSchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: null,
          totalLists: { $sum: 1 },
          totalTodos: { $sum: '$todoCount' },
          completedTodos: { $sum: '$completedTodoCount' },
          avgCompletionRate: { $avg: '$completionPercentage' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalLists: 0,
      totalTodos: 0,
      completedTodos: 0,
      avgCompletionRate: 0
    };
    
    result.remainingTodos = result.totalTodos - result.completedTodos;
    result.overallCompletionRate = result.totalTodos > 0 ? 
      Math.round((result.completedTodos / result.totalTodos) * 100) : 0;
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Index for compound queries
listSchema.index({ userId: 1, isActive: 1 });
listSchema.index({ userId: 1, name: 1 });
listSchema.index({ userId: 1, sortOrder: 1 });

const List = mongoose.model('List', listSchema);

module.exports = List;