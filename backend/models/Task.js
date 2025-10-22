const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  dueDate: {
    type: Date
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Subtask title cannot exceed 200 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  dependencies: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked-by', 'related'],
      default: 'related'
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ project: 1 });
taskSchema.index({ workspace: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ 'assignedTo.user': 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' });

// Virtual for comment count
taskSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for completed subtask count
taskSchema.virtual('completedSubtasks').get(function() {
  return this.subtasks.filter(subtask => subtask.completed).length;
});

// Virtual for subtask completion percentage
taskSchema.virtual('subtaskCompletionPercentage').get(function() {
  if (this.subtasks.length === 0) return 0;
  return Math.round((this.completedSubtasks / this.subtasks.length) * 100);
});

// Method to check if user is assigned to task
taskSchema.methods.isAssigned = function(userId) {
  return this.assignedTo.some(assignment => assignment.user.toString() === userId.toString());
};

// Method to add assignee
taskSchema.methods.addAssignee = function(userId, assignedBy = null) {
  if (!this.isAssigned(userId)) {
    this.assignedTo.push({
      user: userId,
      assignedBy: assignedBy
    });
  }
  return this.save();
};

// Method to remove assignee
taskSchema.methods.removeAssignee = function(userId) {
  this.assignedTo = this.assignedTo.filter(assignment => assignment.user.toString() !== userId.toString());
  return this.save();
};

// Method to add comment
taskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  return this.save();
};

// Method to update comment
taskSchema.methods.updateComment = function(commentId, content) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.content = content;
    comment.updatedAt = new Date();
    comment.isEdited = true;
  }
  return this.save();
};

// Method to delete comment
taskSchema.methods.deleteComment = function(commentId) {
  this.comments = this.comments.filter(comment => comment._id.toString() !== commentId.toString());
  return this.save();
};

// Pre-save middleware to set completedAt
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed' && this.completedAt) {
      this.completedAt = undefined;
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
